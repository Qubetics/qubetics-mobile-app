/**
 * libsodium stub for Hermes.
 *
 * libsodium-wrappers(-sumo) >= 0.7.16 is WebAssembly-only: it starts
 * instantiating WASM at *import* time and chains off its own `ready` promise.
 * Hermes has no `WebAssembly` global, so that promise rejects and surfaces as a
 * recurring, un-actionable "Uncaught (in promise): ReferenceError: Property
 * 'WebAssembly' doesn't exist".
 *
 * The app only uses the pure-JS parts of @cosmjss/crypto (Slip10, Bip39 via
 * @noble/hashes, Secp256k1, Keccak256). The libsodium-backed classes
 * (Argon2id, Ed25519, Xchacha20poly1305Ietf) are pulled in only because
 * @cosmjss/crypto's index re-exports them eagerly -- nothing in this app calls
 * them.
 *
 * This stub therefore:
 *   - resolves `ready`, so nothing hangs and no rejection is emitted, and
 *   - throws a clear, located error if any sodium primitive is ever called,
 *     instead of failing silently somewhere far from the cause.
 *
 * If a real libsodium primitive is ever needed, replace this with a JS
 * implementation (e.g. @stablelib/* or @noble/*) rather than deleting it --
 * WebAssembly will still not exist under Hermes.
 */
'use strict';

const unavailable = name => () => {
  throw new Error(
    `libsodium.${String(name)}() is unavailable: libsodium requires WebAssembly, ` +
      'which Hermes does not provide. See src/polyfills/libsodium-stub.js.',
  );
};

const passthrough = new Set(['__esModule', 'then', 'ready', 'default']);

const sodium = new Proxy(
  { ready: Promise.resolve() },
  {
    get(target, prop) {
      if (prop === 'ready') return target.ready;
      if (prop === 'then') return undefined; // never look like a thenable
      if (prop === '__esModule') return undefined;
      if (prop === 'default') return sodiumProxy;
      if (typeof prop === 'symbol') return undefined;
      if (prop in target) return target[prop];
      return unavailable(prop);
    },
  },
);

const sodiumProxy = sodium;
module.exports = sodium;
