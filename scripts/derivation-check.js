#!/usr/bin/env node
/**
 * Independent derivation oracle for the §8 verification gate.
 *
 * Both platforms derive natively -- iOS through HDWalletKit/WalletCore in
 * ios/CreateWallet.swift, Android through wallet-core in WalletHandler.java --
 * so neither can be checked from JS directly. This script instead recomputes
 * the same addresses from the same mnemonic using reference implementations
 * that share no code with either platform, giving a value to compare against.
 *
 * Run it before and after any change that touches derivation, signing, the
 * crypto dependencies or the React Native version, and diff the output.
 *
 *   node scripts/derivation-check.js                      # fixed test mnemonic
 *   node scripts/derivation-check.js "word word ... word" # a specific mnemonic
 *   node scripts/derivation-check.js --json > before.json
 *
 * Paths are taken from WalletHandler.java (SOLANA_PATH, TRON_PATH) and from
 * wallet-core's defaults for the remaining coins. Keep them in sync if either
 * side changes.
 *
 * NEVER pass a real wallet's mnemonic. The default below is the published
 * BIP-39 all-"abandon" vector and holds no funds.
 */

const crypto = require('crypto');
const ethers = require('ethers');
const bip39 = require('@scure/bip39');
const {HDKey} = require('@scure/bip32');
const bech32 = require('bech32');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const {derivePath} = require('ed25519-hd-key');

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Derivation paths. The two non-default ones are pinned in WalletHandler.java
// because wallet-core's own defaults for these coins produce different keys.
const PATHS = {
  ethereum: "m/44'/60'/0'/0/0",
  bitcoin: "m/84'/0'/0'/0/0",
  cosmos: "m/44'/118'/0'/0/0",
  solana: "m/44'/501'/0'",
  tron: "m/44'/195'/0'/0/0",
};

const hex = buf => Buffer.from(buf).toString('hex');
const sha256 = buf => Buffer.from(ethers.getBytes(ethers.sha256(buf)));
const ripemd160 = buf => Buffer.from(ethers.getBytes(ethers.ripemd160(buf)));
const hash160 = buf => ripemd160(sha256(buf));

const base58check = payload => {
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return ethers.encodeBase58(Buffer.concat([payload, checksum]));
};

/**
 * Proves this script's own PBKDF2 matches the BIP-39 specification before any
 * of its output is trusted as a reference. Uses the published vector, which
 * is only valid with the "TREZOR" passphrase.
 */
const selfTest = () => {
  const expected =
    'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04';
  const actual = hex(bip39.mnemonicToSeedSync(TEST_MNEMONIC, 'TREZOR'));
  if (actual !== expected) {
    throw new Error(
      `BIP-39 self-test failed -- this script cannot be trusted as a reference.\n  expected ${expected}\n  actual   ${actual}`,
    );
  }
};

const deriveEthereum = mnemonic => {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, '', PATHS.ethereum);
  return {address: wallet.address, privateKey: wallet.privateKey};
};

/** BIP-84 native segwit, the form `getAddressForCoin(CoinType.BITCOIN)` returns. */
const deriveBitcoin = seed => {
  const node = HDKey.fromMasterSeed(seed).derive(PATHS.bitcoin);
  const words = bech32.toWords(hash160(node.publicKey));
  const wif = base58check(
    Buffer.concat([Buffer.from([0x80]), Buffer.from(node.privateKey), Buffer.from([0x01])]),
  );
  return {
    address: bech32.encode('bc', [0, ...words]),
    privateKey: wif,
  };
};

const deriveCosmos = seed => {
  const node = HDKey.fromMasterSeed(seed).derive(PATHS.cosmos);
  const words = bech32.toWords(hash160(node.publicKey));
  return {
    address: bech32.encode('cosmos', words),
    privateKey: hex(node.privateKey),
  };
};

/** ed25519, so it uses SLIP-0010 rather than BIP-32. */
const deriveSolana = seed => {
  const {key} = derivePath(PATHS.solana, hex(seed));
  const pair = nacl.sign.keyPair.fromSeed(key);
  const encode = bs58.default ? bs58.default.encode : bs58.encode;
  return {
    address: encode(pair.publicKey),
    privateKey: encode(pair.secretKey),
  };
};

/** Tron takes the last 20 bytes of keccak256(uncompressed pubkey) behind a 0x41 prefix. */
const deriveTron = seed => {
  const node = HDKey.fromMasterSeed(seed).derive(PATHS.tron);
  const privateKey = hex(node.privateKey);
  const uncompressed = ethers.getBytes(
    ethers.SigningKey.computePublicKey('0x' + privateKey, false),
  );
  const digest = ethers.getBytes(ethers.keccak256(uncompressed.slice(1)));
  const body = Buffer.concat([Buffer.from([0x41]), Buffer.from(digest.slice(-20))]);
  return {address: base58check(body), privateKey};
};

const main = () => {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const mnemonic = args.find(a => !a.startsWith('--')) || TEST_MNEMONIC;

  selfTest();

  if (!bip39.validateMnemonic(mnemonic, require('@scure/bip39/wordlists/english').wordlist)) {
    throw new Error('Mnemonic failed BIP-39 checksum validation.');
  }

  // The app passes an empty passphrase on both platforms.
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');

  const result = {
    mnemonic,
    passphrase: '',
    seed: hex(seed),
    paths: PATHS,
    chains: {
      ethereum: deriveEthereum(mnemonic),
      bitcoin: deriveBitcoin(seed),
      cosmos: deriveCosmos(seed),
      solana: deriveSolana(seed),
      tron: deriveTron(seed),
    },
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  console.log('BIP-39 self-test: PASS (matches the published spec vector)\n');
  console.log(`mnemonic : ${result.mnemonic}`);
  console.log(`seed     : ${result.seed}\n`);
  for (const [chain, {address, privateKey}] of Object.entries(result.chains)) {
    console.log(`${chain.padEnd(9)}  ${PATHS[chain]}`);
    console.log(`  address    ${address}`);
    console.log(`  privateKey ${privateKey}`);
  }
  console.log(
    '\nCompare these against what the app returns for the same mnemonic:' +
      '\n  iOS      CreateWallet.generateAddressFromMnemonics' +
      '\n  Android  WalletHandler.generateAddresses' +
      '\nEvery address and private key must match byte for byte.',
  );
};

main();
