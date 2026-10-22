import { getAddress, isAddress } from "ethers";
import { getData, saveDataInStorage } from "./MethodsUtils";

const KNOWN_RECIPIENTS_KEY = "known_evm_recipients";
const MAX_KNOWN_RECIPIENTS = 200;
const LOOKALIKE_PREFIX_LENGTH = 4;
const LOOKALIKE_SUFFIX_LENGTH = 4;

export type AddressVerdict =
  | { status: "invalid" }
  | { status: "bad-checksum" }
  | { status: "ok"; address: string };

export type RecipientRisk =
  | { kind: "known" }
  | { kind: "new" }
  | { kind: "lookalike"; similarTo: string };

// ethers.isAddress accepts all-lowercase / all-uppercase input and rejects
// mixed-case input whose EIP-55 checksum does not match, which is the typo case.
export const validateEvmAddress = (input: string): AddressVerdict => {
  const value = input.trim();
  if (isAddress(value)) return { status: "ok", address: getAddress(value) };
  const looksLikeAddress = /^0x[0-9a-fA-F]{40}$/.test(value);
  return looksLikeAddress ? { status: "bad-checksum" } : { status: "invalid" };
};

const shareEnds = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return (
    x !== y &&
    x.slice(2, 2 + LOOKALIKE_PREFIX_LENGTH) === y.slice(2, 2 + LOOKALIKE_PREFIX_LENGTH) &&
    x.slice(-LOOKALIKE_SUFFIX_LENGTH) === y.slice(-LOOKALIKE_SUFFIX_LENGTH)
  );
};

export const assessRecipient = (address: string, knownRecipients: string[]): RecipientRisk => {
  const target = address.toLowerCase();
  if (knownRecipients.some((known) => known.toLowerCase() === target)) return { kind: "known" };
  const similar = knownRecipients.find((known) => shareEnds(known, address));
  return similar ? { kind: "lookalike", similarTo: similar } : { kind: "new" };
};

export const loadKnownRecipients = async (): Promise<string[]> => {
  try {
    const stored = await getData(KNOWN_RECIPIENTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((a) => typeof a === "string") : [];
  } catch {
    return [];
  }
};

export const rememberRecipient = async (address: string) => {
  const known = await loadKnownRecipients();
  const target = address.toLowerCase();
  const next = [address, ...known.filter((a) => a.toLowerCase() !== target)].slice(0, MAX_KNOWN_RECIPIENTS);
  try {
    await saveDataInStorage(KNOWN_RECIPIENTS_KEY, JSON.stringify(next));
  } catch {
    // Failing to remember a recipient only means the next send warns again.
  }
};
