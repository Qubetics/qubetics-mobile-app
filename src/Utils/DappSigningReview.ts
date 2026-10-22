import {ethers} from 'ethers';

export type SignReview =
  | {
      accepted: true;
      title: string;
      origin: string;
      details: {label: string; value: string}[];
      body: string;
      warnings: string[];
    }
  | {accepted: false; reason: string};

type ReviewInput = {
  name: string;
  object: any;
  origin: string;
  activeChainId: number;
};

const PERMIT_PRIMARY_TYPES = [
  'Permit',
  'PermitSingle',
  'PermitBatch',
  'PermitTransferFrom',
  'PermitBatchTransferFrom',
  'PermitWitnessTransferFrom',
  'PermitBatchWitnessTransferFrom',
  'OrderComponents',
  'Order',
  'BulkOrder',
];

const UNLIMITED_THRESHOLD = 2n ** 128n;

export const getOrigin = (url: string | undefined): string => {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(url || '');
  return match ? match[1] : 'Unknown site';
};

const toBigInt = (value: unknown): bigint | null => {
  try {
    return BigInt(value as any);
  } catch {
    return null;
  }
};

const reviewPersonalMessage = (
  data: string,
  origin: string,
): SignReview => {
  let body: string;
  const warnings: string[] = [];
  try {
    body = ethers.toUtf8String(data);
  } catch {
    body = data;
    warnings.push(
      'This message is not readable text. Only sign it if you fully trust this site.',
    );
  }
  if (/^0x[0-9a-f]{64}$/i.test(body)) {
    warnings.push(
      'This looks like a raw hash. Signing a hash can authorize actions you cannot see.',
    );
  }
  return {
    accepted: true,
    title: 'Sign message',
    origin,
    details: [],
    body,
    warnings,
  };
};

const collectAmountWarnings = (message: any, warnings: string[]) => {
  const fields = ['value', 'amount', 'allowed'];
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(key => {
      const child = node[key];
      if (child && typeof child === 'object') {
        visit(child);
        return;
      }
      if (!fields.includes(key)) return;
      const amount = toBigInt(child);
      if (amount !== null && amount >= UNLIMITED_THRESHOLD) {
        warnings.push(
          `"${key}" is effectively unlimited. The spender could take your entire token balance.`,
        );
      }
    });
  };
  visit(message);
};

const reviewTypedData = (
  raw: string,
  origin: string,
  activeChainId: number,
): SignReview => {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {accepted: false, reason: 'Invalid typed data'};
  }
  if (!parsed?.domain || !parsed?.types || !parsed?.message) {
    return {accepted: false, reason: 'Invalid typed data'};
  }

  const domainChainId = parsed.domain.chainId;
  if (
    domainChainId !== undefined &&
    Number(domainChainId) !== Number(activeChainId)
  ) {
    return {
      accepted: false,
      reason: `Typed data is for chain ${Number(
        domainChainId,
      )}, but the wallet is on chain ${activeChainId}`,
    };
  }

  const primaryType: string = parsed.primaryType || '';
  const warnings: string[] = [];
  if (PERMIT_PRIMARY_TYPES.includes(primaryType)) {
    warnings.push(
      `"${primaryType}" can grant a third party permission to move your tokens or NFTs without a transaction. Check the spender carefully.`,
    );
  }
  collectAmountWarnings(parsed.message, warnings);

  const details = [
    {label: 'Type', value: primaryType || 'Unknown'},
    {label: 'App', value: String(parsed.domain.name ?? 'Unknown')},
    {
      label: 'Contract',
      value: String(parsed.domain.verifyingContract ?? 'None'),
    },
    {
      label: 'Chain',
      value: String(domainChainId ?? 'Not specified'),
    },
  ];

  return {
    accepted: true,
    title: 'Sign typed data',
    origin,
    details,
    body: JSON.stringify(parsed.message, null, 2),
    warnings,
  };
};

export const reviewSignRequest = ({
  name,
  object,
  origin,
  activeChainId,
}: ReviewInput): SignReview => {
  if (name === 'signMessage') {
    return {
      accepted: false,
      reason: 'eth_sign is not supported because it can sign arbitrary data',
    };
  }
  if (name === 'signPersonalMessage') {
    if (typeof object?.data !== 'string') {
      return {accepted: false, reason: 'Invalid message'};
    }
    return reviewPersonalMessage(object.data, origin);
  }
  if (name === 'signTypedMessage') {
    if (typeof object?.raw !== 'string') {
      return {accepted: false, reason: 'Invalid typed data'};
    }
    return reviewTypedData(object.raw, origin, activeChainId);
  }
  return {accepted: false, reason: 'Unsupported request'};
};

const ADDRESS_PATTERN = /^0x[0-9a-f]{40}$/i;

type WalletConnectReviewInput = {
  method: string;
  params: any;
  origin: string;
  chainId: string;
  validation?: string;
};

export const reviewWalletConnectRequest = ({
  method,
  params,
  origin,
  chainId,
  validation,
}: WalletConnectReviewInput): SignReview => {
  const withVerifyWarning = (review: SignReview): SignReview => {
    if (!review.accepted) return review;
    if (validation === 'INVALID' || validation === 'SCAM') {
      review.warnings.unshift(
        'This site failed WalletConnect verification and may be impersonating another app.',
      );
    } else if (validation !== 'VALID') {
      review.warnings.unshift('This site could not be verified.');
    }
    return review;
  };

  if (method === 'personal_sign') {
    const entries: unknown[] = Array.isArray(params) ? params : [];
    const message = entries.find(
      entry => typeof entry === 'string' && !ADDRESS_PATTERN.test(entry),
    );
    if (typeof message !== 'string') {
      return {accepted: false, reason: 'Invalid message'};
    }
    const hex = /^0x[0-9a-f]*$/i.test(message)
      ? message
      : ethers.hexlify(ethers.toUtf8Bytes(message));
    return withVerifyWarning(reviewPersonalMessage(hex, origin));
  }

  if (method.startsWith('eth_signTypedData')) {
    const raw = Array.isArray(params) ? params[1] : undefined;
    const rawText = typeof raw === 'string' ? raw : JSON.stringify(raw ?? null);
    const numericChain = Number(chainId.split(':')[1]);
    return withVerifyWarning(reviewTypedData(rawText, origin, numericChain));
  }

  return {accepted: false, reason: 'Unsupported request'};
};
