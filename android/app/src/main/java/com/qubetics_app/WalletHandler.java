package com.qubetics_app;



import org.json.JSONObject;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import wallet.core.jni.Base58;
import wallet.core.jni.CoinType;
import wallet.core.jni.HDWallet;
import wallet.core.jni.PrivateKey;
import wallet.core.jni.PublicKey;

public class WalletHandler {

    /**
     * Derivation paths copied from the JS implementations they replace. These are
     * NOT wallet-core's defaults -- getAddressForCoin(CoinType.SOLANA) uses a
     * different path and would produce a DIFFERENT address for existing users.
     * Do not change these without a migration.
     *
     *   Solana : MnemonicsUtils.createSolAddress -> `m/44'/501'/0'`
     *   Tron   : tronweb (was @bitsler/tron-address) -> `m/44'/195'/0'/0/0`
     */
    public static final String SOLANA_PATH = "m/44'/501'/0'";
    public static final String TRON_PATH = "m/44'/195'/0'/0/0";

    /**
     * Diagnostic only -- NOT called in normal operation.
     *
     * Result on wallet-core 4.3.17 (verified on device):
     *   m/44'/501'/0'      -> matches the previous JS address
     *   m/44'/501'/0'/0    -> same (trailing non-hardened segments are ignored)
     *   m/44'/501'/0'/0'   -> DIFFERENT key (hardened 4th level)
     *   m/44'/501'/0'/0/0  -> same as the 3-segment path
     * SLIP-0010 permits only hardened derivation for ed25519, which is why the
     * non-hardened tails are no-ops. Keep SOLANA_PATH as the explicit 3-segment
     * form so it maps 1:1 onto what ed25519-hd-key accepts in JS.
     */
    public static JSONObject solanaPathProbe(HDWallet hdWallet) {
        String[] candidates = {
            "m/44'/501'/0'",
            "m/44'/501'/0'/0",
            "m/44'/501'/0'/0'",
            "m/44'/501'/0'/0/0"
        };
        JSONObject out = new JSONObject();
        for (String path : candidates) {
            try {
                PrivateKey k = hdWallet.getKey(CoinType.SOLANA, path);
                out.put(path, CoinType.SOLANA.deriveAddress(k));
            } catch (Throwable t) {
                try { out.put(path, "ERROR: " + t.getMessage()); } catch (Exception ignored) {}
            }
        }
        return out;
    }

    /** Solana address + the 64-byte nacl-style secret key (seed||pubkey), base58. */
    public static JSONObject deriveSolana(HDWallet hdWallet) throws Exception {
        PrivateKey key = hdWallet.getKey(CoinType.SOLANA, SOLANA_PATH);
        byte[] seed = key.data();                              // 32-byte ed25519 seed
        PublicKey pub = key.getPublicKeyEd25519();             // 32-byte public key
        byte[] secret64 = new byte[seed.length + pub.data().length];
        System.arraycopy(seed, 0, secret64, 0, seed.length);
        System.arraycopy(pub.data(), 0, secret64, seed.length, pub.data().length);

        JSONObject o = new JSONObject();
        o.put("address", CoinType.SOLANA.deriveAddress(key));
        // JS stores bs58(64-byte secretKey); nacl.sign.keyPair.fromSecretKey expects that.
        o.put("pvtKey", Base58.encodeNoCheck(secret64));
        return o;
    }

    /** Tron address + hex private key, matching tronweb's deriver output. */
    public static JSONObject deriveTron(HDWallet hdWallet) throws Exception {
        PrivateKey key = hdWallet.getKey(CoinType.TRON, TRON_PATH);
        JSONObject o = new JSONObject();
        o.put("address", CoinType.TRON.deriveAddress(key));
        o.put("pvtKey", toHexString(key.data()));
        return o;
    }

    public static JSONObject generateAddresses(String mnemonics) {
        try {
            HDWallet hdWallet = new HDWallet(mnemonics, "");
            CoinType coinEth = CoinType.ETHEREUM;
            CoinType coinCosmos = CoinType.COSMOS;
            CoinType coinBtc = CoinType.BITCOIN;

            String ethSeeds = toHexString(hdWallet.getKeyForCoin(coinEth).data());
            String btcSeeds = toWIF(hdWallet.getKeyForCoin(coinBtc).data(), true);

            final JSONObject objectBTC = new JSONObject();
            final JSONObject objectETH = new JSONObject();
            objectBTC.put("address", hdWallet.getAddressForCoin(coinBtc));
            objectBTC.put("pvtKey", btcSeeds);
            objectETH.put("address", hdWallet.getAddressForCoin(coinEth));
            objectETH.put("pvtKey", "0x" + ethSeeds);

            final JSONObject addresses = new JSONObject();
            addresses.put("eth", objectETH);
            addresses.put("btc", objectBTC);
            // Additive: JS still uses its own sol/trx derivation until these are
            // verified byte-identical on device. See docs/UPGRADE_PLAN.md section 13.
            addresses.put("sol", deriveSolana(hdWallet));
            addresses.put("trx", deriveTron(hdWallet));
            addresses.put("mnemonics", mnemonics);

            return addresses;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    // Utility methods

    public static String toHexString(byte[] byteArray) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : byteArray) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }

    public static String toWIF(byte[] keyData, boolean compressed) {
        byte[] versionedKey = new byte[keyData.length + 1];
        versionedKey[0] = (byte) 0x80;
        System.arraycopy(keyData, 0, versionedKey, 1, keyData.length);

        byte[] keyWithCompression;
        if (compressed) {
            keyWithCompression = new byte[versionedKey.length + 1];
            System.arraycopy(versionedKey, 0, keyWithCompression, 0, versionedKey.length);
            keyWithCompression[versionedKey.length] = 0x01;
        } else {
            keyWithCompression = versionedKey;
        }

        try {
            MessageDigest sha256Digest = MessageDigest.getInstance("SHA-256");
            byte[] hash1 = sha256Digest.digest(keyWithCompression);
            byte[] hash2 = sha256Digest.digest(hash1);

            byte[] checksum = new byte[4];
            System.arraycopy(hash2, 0, checksum, 0, 4);

            byte[] wifBytes = new byte[keyWithCompression.length + checksum.length];
            System.arraycopy(keyWithCompression, 0, wifBytes, 0, keyWithCompression.length);
            System.arraycopy(checksum, 0, wifBytes, keyWithCompression.length, checksum.length);

            return Base58.encodeNoCheck(wifBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
