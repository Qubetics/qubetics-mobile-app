import { Tendermint34Client } from "@cosmjss/tendermint-rpc";
import { QueryClientImpl } from "cosmjs-types/cosmos/bank/v1beta1/query";
const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const {
  SigningStargateClient,
  QueryClient,
  createProtobufRpcClient,
} = require("@cosmjss/stargate");
const { stringToPath } = require("@cosmjss/crypto");
import { MsgStartSubscriptionRequest } from "../../../../generated/qubetics/subscription/v3/msg";
import { startVpnSessionOnChain } from "./startVpnSessionOnChain";
import { consoleLogFunc } from "../../../../Utils/MethodsUtils";

export const startSubscriptionOnChain = async ({
  mnemonic,
  url,
  rpc,
  id,
  node_address
}: {mnemonic: any; url: any; rpc: any; id: any; node_address: any}) => {
  try {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Invalid or missing mnemonic");
    }

    const prefix = "qubetics";
    const hdPath = stringToPath("m/44'/60'/0'/0/0");

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });
    const [account] = await wallet.getAccounts();
    const userAddress = account.address;

    const registry = new Registry([
      [
        "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
        MsgStartSubscriptionRequest,
      ],
    ]);

    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
    const msg = {
      typeUrl: "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
      value: MsgStartSubscriptionRequest.fromPartial({
        from: userAddress,
        id: id,
        denom: "tics",
        renewal_price_policy: 1,
      } as any),
    };

    const fee = {
      amount: [{ denom: "tics", amount: "1" }],
      gas: "1000000",
    };

    const result = await client.signAndBroadcast(userAddress, [msg], fee);
      consoleLogFunc("✅ startSubscriptionOnChain--->>>>", result);

    if (result.code === 0) {

      // 🔍 Extract ID from event logs
      let subscriptionId = null;
      for (const event of result.events || []) {
        if (
          event.type === "qubetics.subscription.v3.EventCreate" ||
          event.type === "qubetics.subscription.v3.EventPay"
        ) {
          for (const attr of event.attributes) {
            if (attr.key === "id" || attr.key === "\"id\"") {
              try {
                const rawId = attr.value;
                // Cleanup quotes and convert to number
                subscriptionId = parseInt(rawId.replace(/"/g, ""));
                break;
              } catch (_) {}
            }
          }
        }
        if (subscriptionId !== null) break;
      }

      if (!subscriptionId) {
        console.warn("⚠️ Could not extract subscription ID from transaction logs.");
        return null;
      }
      const response =  await startVpnSessionOnChain({
        mnemonic: mnemonic?.toLowerCase()?.trim(),
        url:url,
        rpc:rpc,
        id: subscriptionId,
        node_address:node_address
      });

      return response;
    } else {
      console.error("❌ Failed to start session", result);
      return null;
    }
  } catch (err) {
    console.error("RPC error", err);
    return null;
  }
};

// Cached across calls — Tendermint34Client.connect() fires a /status round-trip
// every time it's called (see detectVersion in the library). Building the full
// QueryClient stack from scratch on each getBalance invocation multiplies that
// cost by the number of calls per session.
let _cachedBankService: any = null;
let _cachedRcp: any = null;

const getBankService = async (rcp: any) => {
  if (_cachedBankService && _cachedRcp === rcp) return _cachedBankService;
  const tendermint = await Tendermint34Client.connect(rcp);
  const queryClient = new QueryClient(tendermint);
  const rpcClient = createProtobufRpcClient(queryClient);
  _cachedBankService = new QueryClientImpl(rpcClient);
  _cachedRcp = rcp;
  return _cachedBankService;
};

export const getBalance = async ({ denom, address, rcp }: {denom: any; address: any; rcp: any}) => {
  try {
    consoleLogFunc("✅`8`", { denom, address, rcp });
    const t0 = Date.now();
    const isCached = _cachedBankService !== null && _cachedRcp === rcp;
    const bankQueryService = await getBankService(rcp);
    consoleLogFunc(`⏱ getBankService: ${Date.now() - t0}ms | cached: ${isCached}`);
    const t1 = Date.now();
    const { balance } = await bankQueryService.Balance({ address, denom });
    consoleLogFunc(`⏱ Balance query: ${Date.now() - t1}ms`);
    consoleLogFunc("✅`13`", balance);
    return formatTics(balance.amount);
  } catch (error) {
    // Reset cache so the next call reconnects cleanly
    _cachedBankService = null;
    _cachedRcp = null;
    console.error(error);
  }
};

const formatTics = (amount: any, decimals = 18) => {
  const padded = amount.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
};


export const handlePurchase = async ({ mnemonic, rpc, id }: {mnemonic: any; rpc: any; id: any}) => {
      consoleLogFunc("✅`1`", id);

  try {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Invalid or missing mnemonic");
    }
    const prefix = "qubetics";
    const hdPath = stringToPath("m/44'/60'/0'/0/0");
    // 🔑 Wallet setup
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });
    const [account] = await wallet.getAccounts();
    const userAddress = account.address;
    // 🔑 Message registry
    const registry = new Registry([
      [
        "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
        MsgStartSubscriptionRequest,
      ],
    ]);
    // 🔑 Client setup
    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
    // 🔑 Subscription message
    const msg = {
      typeUrl: "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
      value: MsgStartSubscriptionRequest.fromPartial({
        from: userAddress,
        id: String(id),
        denom: "tics",
        renewalPricePolicy: "1",
      }),
    };
    // 🔑 Fee
    const fee = {
      amount: [{ denom: "tics", amount: "1" }],
      gas: "1000000",
    };
    // 🔑 Broadcast transaction
    const result = await client.signAndBroadcast(userAddress, [msg], fee);

    if (result.code === 0) {
      // Extract subscriptionId from logs
      let subscriptionId = null;
      for (const event of result.events || []) {
        if (
          event.type === "qubetics.subscription.v3.EventCreate" ||
          event.type === "qubetics.subscription.v3.EventPay"
        ) {
          for (const attr of event.attributes) {
            if (attr.key === "id" || attr.key === "\"id\"") {
              try {
                subscriptionId = parseInt(attr.value.replace(/"/g, ""));
                break;
              } catch (_) {}
            }
          }
        }
        if (subscriptionId !== null) break;
      }

      if (!subscriptionId) {
        console.warn("⚠️ Could not extract subscription ID from transaction logs.");
        return null;
      }

      return { subscriptionId, txHash: result.transactionHash };
    } else {
      console.error("❌ Failed to start subscription", result);
      return null;
    }
  } catch (err) {
    console.error("RPC error in handlePurchase:", err);
    return null;
  }
};
