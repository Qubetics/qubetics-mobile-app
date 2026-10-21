const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const { SigningStargateClient } = require("@cosmjss/stargate");
const { stringToPath } = require("@cosmjss/crypto");
import { signCosmosMessage1 } from "../../../../Utils/MnemonicsUtils";
import * as Constants from "../../../../Constants";
import { sendStartSession } from "./sendStartSession";
import { consoleLogFunc, getData } from "../../../../Utils/MethodsUtils";
import { MsgStartSessionRequest } from "../../../../generated/qubetics/subscription/v3/msg";
import { stopVpnSessionOnChain } from "./stopVpnSessionOnChain";
import { generateWGKeyPair } from "../../../common/WireGuardNative";
export const startVpnSessionOnChain = async ({
  mnemonic,
  url,
  rpc,
  id,
  node_address,
}: any) => {
  try {
    const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);
    if (sessionId) {
      await stopVpnSessionOnChain({
        mnemonic: mnemonic?.toLowerCase()?.trim(),
        rpc: rpc,
        id: sessionId,
      });
    }
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
        "/qubetics.subscription.v3.MsgStartSessionRequest",
        MsgStartSessionRequest,
      ],
    ]);
    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
    const msg = {
      typeUrl: "/qubetics.subscription.v3.MsgStartSessionRequest",
      value: MsgStartSessionRequest.fromPartial({
        from: userAddress,
        id: id,
        nodeAddress: node_address,
      }),
    };

    const fee = {
      amount: [{ denom: "tics", amount: "1" }],
      gas: "10000000",
    };

    const result = await client.signAndBroadcast(userAddress, [msg], fee);
    if (result.code === 0) {
      const rawLog = result.rawLog;

      let sessionId;

      try {
        const logJson = JSON.parse(rawLog);

        const createSessionEvent = logJson[0].events.find(
          (e: any) => e.type === "qubetics.subscription.v3.EventCreateSession"
        );

        if (createSessionEvent) {
          const idAttr = createSessionEvent.attributes.find(
            (attr: any) => attr.key === "id"
          );
          if (idAttr) {
            sessionId = idAttr.value.replace(/"/g, ""); // Remove escaped quotes
          }
        }
      } catch (err) {
        consoleLogFunc("Failed to extract session ID:", err);
      }
      const { pubKey, signature } = await signCosmosMessage1(
        mnemonic?.toLowerCase()?.trim(),
        userAddress,
        userAddress
      );
      const keyPair = await generateWGKeyPair();
      if (!keyPair) {
        consoleLogFunc("❌ Failed to generate WireGuard key pair");
        return;
      }

      const private_key = keyPair.privateKey;
      const public_key = keyPair.publicKey;

      const response = await sendStartSession({
        url,
        pubKey,
        sessionId: sessionId,
        signatureBase64: signature,
        public_key,
        private_key,
      } as any);
      if (response?.result?.data) {
        const decoded = Buffer.from(response.result.data, "base64").toString(
          "utf-8"
        );
        const config = JSON.parse(decoded);
        const address = config.addrs?.[0] || "10.0.0.2/32";
        const metadata = config.metadata?.[0];
        const port = metadata?.port;
        const serverPublicKey = metadata?.public_key;

        // Get private key from secure storage
        const privateKey = private_key; // Replace with actual method
        // Construct dynamic WireGuard config
        //AllowedIPs = 0.0.0.0/0,::/0

        // AllowedIPs = 0.0.0.0/0
//        // AllowedIPs = 10.0.0.0/8, 192.168.0.0/16

        const dynamicConfig = `[Interface]
        PrivateKey = ${privateKey}
        Address = ${address}
        DNS = 1.1.1.1
        MTU = 1420
        
        [Peer]
        PublicKey = ${serverPublicKey}
        AllowedIPs = 0.0.0.0/0,::/0
        Endpoint = ${response.result.addrs[0]}:${port}
        PersistentKeepalive = 30`;
        return {
          config: dynamicConfig,
          sessionId: sessionId,
        };
      }
      return null;
    } else {
      consoleLogFunc("❌ Failed to startVpnSessionOnChain session", result);
      return null;
    }
  } catch (err) {
    consoleLogFunc("startVpnSessionOnChain error", err);
    return null;
  }
};
