/**
 * Common fetch with SSL pinning using qubetics.cer (asset folder).
 * Use for VPN API and Chain Abstraction API calls.
 *
 * Cert: place qubetics.cer in assets; iOS/Android use name "qubetics" (no extension).
 */
import {fetch, type ReactNativeSSLPinning} from 'react-native-ssl-pinning';
import { consoleLogFunc } from './MethodsUtils';

const PINNED_CERTS = ['qubetics', 'swftc'];

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_RETRIES = 2; // 1 initial + 2 retries = 3 total attempts on timeout

/** @returns {boolean} true if error looks like a timeout */
const isTimeoutError = (error: any) => {
  const msg = (error?.message ?? String(error)).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    error?.name === 'AbortError' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNABORTED'
  );
};

/**
 * Drop headers whose value is null/undefined and stringify the rest.
 *
 * react-native-ssl-pinning does `builder.addHeader(key, map.getString(key))`
 * with no null check, and OkHttp's Kotlin `Request.Builder.addHeader` rejects a
 * null value with "Parameter specified as non-null is null". A single absent
 * token (e.g. `refresh-token` during logout) therefore crashes the whole
 * request, so strip them here rather than at every call site.
 */
const sanitizeHeaders = (
  headers: unknown,
): ReactNativeSSLPinning.Header | undefined => {
  if (!headers || typeof headers !== 'object')
    return headers as ReactNativeSSLPinning.Header | undefined;
  const clean: ReactNativeSSLPinning.Header = {};
  Object.keys(headers).forEach((key) => {
    const value = (headers as Record<string, unknown>)[key];
    if (value === null || value === undefined) return;
    clean[key] = typeof value === 'string' ? value : String(value);
  });
  return clean;
};

/**
 * What callers may pass. Modelled on react-native-ssl-pinning's own Options
 * rather than RequestInit, because that is what this wraps and what the call
 * sites actually pass (method, headers, body).
 *
 * sslPinning and disableAllSecurity are accepted but deliberately discarded:
 * the destructuring below pulls them out of `rest` so a caller cannot override
 * the transport security settings chosen here.
 */
export type PinnedFetchOptions = Partial<ReactNativeSSLPinning.Options> & {
  signal?: AbortSignal;
  maxRetries?: number;
  retryDelayMs?: number;
};

/**
 * Fetch with SSL pinning (qubetics.cer). Same signature as global fetch.
 * On request timeout, retries up to maxRetries times (only for timeouts).
 * @param {string} url - Request URL
 * @param {RequestInit & { sslPinning?: object, disableAllSecurity?: boolean, timeoutInterval?: number, maxRetries?: number, retryDelayMs?: number }} options - Fetch options
 * @returns {Promise<Response>}
 */
export const pinnedFetch = (
  url: string,
  options: PinnedFetchOptions = {},
) => {
  const {
    sslPinning,
    disableAllSecurity,
    timeoutInterval = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = 0,
    ...rest
  } = options;

  if (rest?.signal) {
    delete rest.signal;
  }
  if (rest.headers) {
    rest.headers = sanitizeHeaders(rest.headers);
  }
  consoleLogFunc("pinnedFetch", url, rest);

  const doRequest = (_attempt: number) =>
    fetch(url, {
      ...rest,
      // SECURITY -- THIS DOES NOT PIN, despite the name. Two separate faults:
      //
      //  1. react-native-ssl-pinning's contract is `sslPinning: {certs: [...]}`
      //     but PINNED_CERTS is a bare string[], so the key is malformed. That
      //     it was never noticed is itself evidence this branch never ran --
      //     a malformed key yields "key certs was not found".
      //  2. Decisively, both native modules check disableAllSecurity FIRST and
      //     short-circuit past the pinning branch, so the certs are never used.
      //
      // Android still validates TLS on that path (plain OkHttpClient, no
      // trust-manager override). iOS did not until patches/react-native-ssl-
      // pinning+1.6.0.patch set validatesDomainName/allowInvalidCertificates
      // back to safe values -- before that it accepted any certificate.
      //
      // Turning pinning on needs per-host scoping: only qubetics.cer and
      // swftc.cer are bundled, while this also serves third-party hosts such
      // as api.blockchain.info, which would start failing. Tracked separately.
      sslPinning: PINNED_CERTS as unknown as ReactNativeSSLPinning.Options['sslPinning'],
      disableAllSecurity: true,
      timeoutInterval,
    } as ReactNativeSSLPinning.Options);

  const runWithRetry = (
    attempt: number = 0,
  ): Promise<ReactNativeSSLPinning.Response> =>
    doRequest(attempt).catch((error: any) => {
      if (!isTimeoutError(error) || attempt >= maxRetries) {
        throw error;
      }
      const nextAttempt = attempt + 1;
      consoleLogFunc("pinnedFetch", { timeoutRetry: nextAttempt, maxRetries });
      const delay =
        typeof retryDelayMs === 'number' && retryDelayMs > 0
          ? Promise.resolve(undefined).then(() => new Promise((r) => setTimeout(r, retryDelayMs)))
          : Promise.resolve();
      return delay.then(() => runWithRetry(nextAttempt));
    });

  return runWithRetry(0);
};

