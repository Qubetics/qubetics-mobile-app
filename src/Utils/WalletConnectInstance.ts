//***********FOR_WALLET_CONNECT_V2_NEW***************/
import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";
import { EventRegister } from "react-native-event-listeners";
import { getSdkError } from "@walletconnect/utils";
import Singleton from "../Singleton";
import { MAIN_URL } from "../EndPoint";
import { consoleLogFunc } from "./MethodsUtils";
import { WALLETCONNECT_PROJECT_ID } from "@env";

const core = new Core({
  // allowUndefined: true in babel.config.js means a missing .env key is
  // undefined at build time; the assumption it is set is unchanged.
  projectId: WALLETCONNECT_PROJECT_ID!,
});

const SUPPORTED_REQUEST_METHODS = [
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "solana_signMessage",
  "solana_signTransaction",
];

export default class WalletConnectInstance {
  static myInstance: WalletConnectInstance | null = null;
  // The SDK is used loosely below (see the .connected note), so the wallet is
  // held as any rather than the strict WalletKit type.
  web3Wallet: any = null;
  invalidQR: ReturnType<typeof setTimeout> | null = null;
  smartContractCallInterval: ReturnType<typeof setInterval> | null = null;
  /**
   * Singleton to get the instance of the WalletConnectInstance
   * @return {WalletConnectInstance} - The instance of the WalletConnectInstance
   */

  static getInstance(): WalletConnectInstance {
    if (WalletConnectInstance.myInstance == null) {
      consoleLogFunc("WalletConnectInstance Initialize");

      WalletConnectInstance.myInstance = new WalletConnectInstance();
      WalletConnectInstance.myInstance.initializeWalletConnect();
    }
    return this.myInstance!;
  }

  initializeWalletConnect = async () => {
    try {
      this.web3Wallet = await WalletKit.init({
        core, // <- pass the shared `core` instance
        metadata: {
          name: "Qubetics Wallet",
          description: "Qubetics Wallet",
          url: MAIN_URL!,
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
    } catch (error: any) {
      consoleLogFunc("error>>>", error);
    }

    // Approval: Using this listener for sessionProposal, you can accept the session
    this.web3Wallet?.on("session_proposal", async (proposal: any) => {
      consoleLogFunc("session_proposal>>>>>>", JSON.stringify(proposal));

      EventRegister.emitEvent("sessionProposal", proposal);
      clearTimeout(this.invalidQR ?? undefined);
    });

    this.web3Wallet?.on("session_delete", async (proposal: any) => {
      consoleLogFunc("session_deletesession_delete proposal>>>", proposal);
      EventRegister.emitEvent("sessionDeleted", proposal);
      let requests = this.web3Wallet?.getPendingSessionRequests();
      const topic = proposal?.topic;

      requests.map(async (el: any) => {
        //Delete all pending requests for particular session before disconnecting the session
        if (el?.topic == topic) {
          const response = {
            id: el?.id,
            jsonrpc: "2.0",
            error: {
              code: 5000,
              message: "User rejected.",
            },
          };
          try {
            await this.web3Wallet?.respondSessionRequest({
              topic: el?.topic,
              response: response,
            });
          } catch (e: any) {
            consoleLogFunc('--------------error--wc', e)
          }
        }
      });
    });

    this.web3Wallet?.on("session_request", async (event: any) => {
      consoleLogFunc("session_request>>>>>>", JSON.stringify(event));
      this.sessionRequest(event);
    });

  };

  connect = async (walletUri: any) => {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const response = await this.web3Wallet.pair({
          uri: walletUri,
        });
        consoleLogFunc("response>>>>>>", response);

        this.invalidQR = setTimeout(() => {
          try {
            if (this.web3Wallet) {
              if (!this.web3Wallet?.connected) {
                (Singleton.getInstance() as any).showToast?.show("Invalid QR Code.");
                reject();
              }
            }
          } catch (e: any) {
            consoleLogFunc("exception--------", e);
          }
        }, 15000);
        resolve(undefined);
      } catch (error: any) {
        (Singleton.getInstance() as any).showToast?.show("Invalid QR Code.", 3000);
        consoleLogFunc("-------------connectionError", error);
        reject(error);
      }
    });
  };

  rejectSession = (id: any) => {
    this.web3Wallet.rejectSession({
      id: id,
      reason: getSdkError("USER_REJECTED_METHODS"),
    });
  };

  sessionRequest = async (payload: any) => {
    consoleLogFunc("sessionRequest----", payload?.params?.request?.method, JSON.stringify(payload));
    try {

      if (payload?.params?.request?.method === "wallet_switchEthereumChain") {
        consoleLogFunc("wallet_switchEthereumChain----INSIDE");
      
        const chainParams = payload?.params?.request?.params?.[0];
        const hexChainId = chainParams?.chainId;
        const decimalChainId = parseInt(hexChainId, 16);
      
        consoleLogFunc("🔀 Switch network request:", decimalChainId);
      
        try {
          if ([1, 56, 137, 9030].includes(decimalChainId)) {
            // ✅ Supported network
            consoleLogFunc("Switch successful (simulate MetaMask)");
      
            await this.web3Wallet.respondSessionRequest({
              topic: payload?.topic,
              response: {
                id: payload?.id,
                jsonrpc: "2.0",
                result: null, // MetaMask always returns null for success
              },
            });
      
            consoleLogFunc("✅ Respond sent!");
      
            // 🔔 Update app/provider state
            EventRegister.emitEvent("networkSwitched", decimalChainId);
          } else {
            // ❌ Unsupported network
            consoleLogFunc("wallet_switchEthereumChain----Unsupported Chain:", decimalChainId);
      
            await this.web3Wallet.respondSessionRequest({
              topic: payload?.topic,
              response: {
                id: payload?.id,
                jsonrpc: "2.0",
                error: {
                  code: 4902, // Standard MetaMask error
                  message: `Unrecognized chain ID: ${hexChainId}`,
                },
              },
            });
          }
        } catch (err: any) {
          console.error("❌ Failed to respond:", err);
      
          await this.web3Wallet.respondSessionRequest({
            topic: payload?.topic,
            response: {
              id: payload?.id,
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "Internal error while switching chain",
              },
            },
          });
        }
      
        return;
      }
      if(payload?.params?.request?.method == "wallet_watchAsset"){
        await this.web3Wallet.respondSessionRequest({
          topic: payload?.topic,
          response: {
            id: payload?.id,
            jsonrpc: '2.0',
            result: true,
          },
        });
        return;
      }

      if (payload?.params?.request?.method == "wallet_addEthereumChain" || payload?.params?.request?.method == "eth_sign") {

        consoleLogFunc("sessionRequest----11", payload?.params?.request?.method, JSON.stringify(payload));

        const response = {
          id: payload?.id,
          jsonrpc: "2.0",
          error: {
            code: 5000,
            message: "Method not supported",
          },
        };
        consoleLogFunc("response----11", response);


        await this.web3Wallet?.respondSessionRequest(
          {
            topic: payload?.topic,
            response: response,
          }
        );
        return;
      }


      if (payload?.params?.request?.method == "wallet_getCapabilities") {
        const account = payload?.params?.request?.params[0]; // "0x..." - address

        const result = {
          eip155: {
            methods: [
              "eth_sendTransaction",
              "personal_sign",
              "eth_signTypedData",
              "eth_signTypedData_v4",
            ],
            chains: [
              "eip155:1",    // Ethereum
              "eip155:56",   // BNB Chain

            ],
            events: [
              "accountsChanged",
              "chainChanged",
            ],
            accounts: [
              `eip155:56:${account}`,
              `eip155:1:${account}`,

            ],
          }
        };
        consoleLogFunc("result", result);

        await this.web3Wallet.respondSessionRequest({
          topic: payload?.topic,
          response: {
            id: payload?.id,
            jsonrpc: "2.0",
            result: result
          }
        });

        consoleLogFunc("✅ Responded to wallet_getCapabilities");
        return;
      }

      const requestedMethod = payload?.params?.request?.method;
      if (!SUPPORTED_REQUEST_METHODS.includes(requestedMethod)) {
        await this.web3Wallet?.respondSessionRequest({
          topic: payload?.topic,
          response: {
            id: payload?.id,
            jsonrpc: "2.0",
            error: { code: 5101, message: "Method not supported" },
          },
        });
        return;
      }

      let coinFamily = null;
      if (payload?.params?.chainId?.toString()?.includes("solana")) {
        coinFamily = 5; // for SOLANA
      } else if (payload?.params?.chainId?.toString() == "eip155:56") {
        coinFamily = 1; // for BNB
      } else if (payload?.params?.chainId?.toString() == "eip155:137") {
        coinFamily = 4; // for POLYGON
      } else if (payload?.params?.chainId?.toString() == "eip155:1") {
        coinFamily = 2; // for ETH
      } else if (payload?.params?.chainId?.toString() == "eip155:9030") {

        coinFamily = 7; // for TICS
      } else {
        coinFamily = 6;
      }
      if (coinFamily == 6) {
        (Singleton.getInstance() as any).showToast?.show("Unsupported chain");
        return;
      } else if (payload?.params?.request?.method.includes("personal_sign") || payload?.params?.request?.method.includes("solana_signMessage")) {
        //Personal Sign
        consoleLogFunc("INSIDE PERSONAL SIGN");
        EventRegister.emitEvent("sessionRequest", true);

        (global as any).callRequest = true;
        clearInterval(this.smartContractCallInterval ?? undefined);
        this.smartContractCallInterval = setInterval(() => {
          let data = {
            payload: payload,
            coinFamily: coinFamily,
            newParams: payload?.params?.request?.params[0],
            method: payload?.params?.request?.method,
          };
          consoleLogFunc("data:PERSONAL SIGN::>:>>:>>", JSON.stringify(data));
          EventRegister.emitEvent("requestFromDapp", data);
          clearInterval(this.smartContractCallInterval ?? undefined);
        }, 2000);
        return;
      } else {
        EventRegister.emitEvent("sessionRequest", true);
        if (payload?.params?.request?.method.includes("eth_signTypedData")) {
          //Sign type data
          const rawTyped = payload?.params?.request?.params[1];
          let approvalParam: any;
          try {
            approvalParam = typeof rawTyped === "string" ? JSON.parse(rawTyped) : rawTyped;
            const domainChain = approvalParam?.domain?.chainId;
            const sessionChain = Number(payload?.params?.chainId?.toString()?.split(":")[1]);
            if (!approvalParam?.types || (domainChain !== undefined && Number(domainChain) !== sessionChain)) {
              throw new Error("Typed data chain mismatch");
            }
          } catch (typedError) {
            await this.web3Wallet?.respondSessionRequest({
              topic: payload?.topic,
              response: {
                id: payload?.id,
                jsonrpc: "2.0",
                error: { code: 5000, message: "Invalid typed data or chain mismatch" },
              },
            });
            return;
          }
          let typeArr = Object.keys(approvalParam.types);
          let newTypes: any = {};
          typeArr.map((el) => {
            if (el != "EIP712Domain") {
              newTypes[el] = approvalParam.types[el];
            }
          });
          let newParams = {
            domain: approvalParam.domain,
            types: newTypes,
            message: approvalParam.message,
          };
          (global as any).callRequest = true;
          clearInterval(this.smartContractCallInterval ?? undefined);
          this.smartContractCallInterval = setInterval(() => {
            let data = {
              payload: payload,
              coinFamily: coinFamily,
              newParams: newParams,
              method: "eth_signTypedData",
            };
            EventRegister.emitEvent("requestFromDapp", data);
            clearInterval(this.smartContractCallInterval ?? undefined);
          }, 2000);
          return;
        } else {
          // Send Txn
          (global as any).callRequest = true;
          clearInterval(this.smartContractCallInterval ?? undefined);
          this.smartContractCallInterval = setInterval(() => {
            let data = {
              payload: payload,
              coinFamily: coinFamily,
              method: "eth_sendTransaction",
            };
            EventRegister.emitEvent("requestFromDapp", data);
            clearInterval(this.smartContractCallInterval ?? undefined);
          }, 2000);
        }
      }
    } catch (err: any) {
      consoleLogFunc("ERRIR", err);
    }
  };

  deleteSession = async (event: any) => {
    return new Promise<any>(async (resolve, reject) => {
      const { topic } = event;
      let requests = this.web3Wallet?.getPendingSessionRequests();
      requests.map(async (el: any) => {
        //Delete all pending requests for particular session before disconnecting the session
        if (el?.topic == topic) {
          const response = {
            id: el?.id,
            jsonrpc: "2.0",
            error: {
              code: 5000,
              message: "User rejected.",
            },
          };
          try {
            await this.web3Wallet?.respondSessionRequest({
              topic: el?.topic,
              response: response,
            });
          } catch (e: any) {
            consoleLogFunc("----------deleteSession----error", e);
          }
        }
      });

      try {
        await this.web3Wallet.disconnectSession({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (error: any) { }
      setTimeout(() => {
        resolve(undefined);
      }, 1000);
    });
  };

  deleteAllSessions = () => {

    return new Promise<any>((resolve, reject) => {
      if (!this.web3Wallet) {
        reject();
        return;
      }
      let requests = this.web3Wallet?.getPendingSessionRequests();
      requests.map(async (el: any) => {
        const response = {
          id: el?.id,
          jsonrpc: "2.0",
          error: {
            code: 5000,
            message: "User rejected.",
          },
        };
        try {
          await this.web3Wallet?.respondSessionRequest({
            topic: el?.topic,
            response: response,
          });
        } catch (e: any) {
        }
      });

      let sessions = this.web3Wallet.getActiveSessions();
      let keys = Object.keys(sessions);
      let connectionList: any[] = [];
      keys.map((el) => {
        connectionList.push(sessions[el]);
      });

      consoleLogFunc("-----------sessions", connectionList);
      try {
        connectionList.map(async (el) => {
          await this.web3Wallet.disconnectSession({
            topic: el.topic,
            reason: getSdkError("USER_DISCONNECTED"),
          });
        });
      } catch (error: any) {
      } finally {
        consoleLogFunc("-----------finally");
      }

      setTimeout(() => {
        resolve(undefined);
      }, 1000);
    });
  };
}
