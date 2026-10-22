import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import { getOrigin, reviewWalletConnectRequest } from "../../../../Utils/DappSigningReview";
import { Component } from "react";
import { BlurView } from "@react-native-community/blur";
import { Fonts, Images } from "../../../../theme";
import {
    getGasLimitFromData,
    getGasPriceForWc,
    getNonceForWc,
    signPersonalMessage,
} from "../../../../Utils";
import { ThemeManager } from "../../../../../ThemeManager";
import { LanguageManager } from "../../../../../LanguageManager";
import {
    bigNumberSafeMath,
    consoleLogFunc,
    getData,
    getEncryptedData,
    toFixed,
    toFixedExp,
} from "../../../../Utils/MethodsUtils";
import { AppAlert, Button, LoaderView } from "../../../common";
import Singleton from "../../../../Singleton";
import WalletConnectInstance from "../../../../Utils/WalletConnectInstance";
import {
    fetchNativePrice,
    requestSendCoin,
    saveSolTransactionId,
    requestGasEstimation,
} from "../../../../Redux/Actions";
import { store } from "../../../../Redux/Reducers";
import EnterPinForTransaction from "../../EnterPinForTransaction/EnterPinForTransaction";
import { ACCESS_TOKEN } from "../../../../Constants";
import { sendSOLANAFromJupiterSwapLegacyTxn, resolveActualTxHash } from "../../../../Utils/SolUtils";
import { EventRegister } from "react-native-event-listeners";
import * as Constants from "../../../../Constants";
import { ethers } from "ethers";
import bs58 from "bs58";

class TransactionRequest extends Component<any, any> {
    [key: string]: any;
    /** Initializes the TransactionRequest component. */
    constructor(props: any) {
        super(props);
        this.state = {
            isShowReq: false,
            pinModal: false,
            showAlertDialog: false,
            showConfirmDialog: false,
            alertTxt: "",
            signingData: "",
            selectedNetwork: "Ethereum",
            coinFamily: 2,
            isLoading: true,
            calculatedFee: 0,
            fiatPrice: 0,
            gasPrice: 0,
            gasLimit: 0,
            transactionData: null,
            hideFees: false,
        };
    }
    componentDidMount() {
        EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
            this.setState({
                showAlertDialog: false,
                showConfirmDialog: false,
                isLoading: false,
            });
            this.closeModal();
        });
    }

    showTransactionRequest(isShow: any, signingData: any) {
        consoleLogFunc("signingData>>>>>", JSON.stringify(signingData));
        this.setState({
            isLoading: true,
        });
        let dataIndex = 0;
        try {
            dataIndex = signingData.payload?.params?.request?.params?.findIndex(
                (ite: any) => {
                    return JSON.stringify(ite).length > 100;
                }
            );
            dataIndex = dataIndex == -1 ? 0 : dataIndex;
            this.setState({
                isLoading: false,
            });
        } catch (error) {
            consoleLogFunc("findIndex-error>>>>>", error);

            dataIndex = 0;
            this.setState({
                isLoading: false,
            });
        }
        consoleLogFunc(" index:::::", dataIndex);
        const isSolanaSign = signingData?.payload?.params?.request?.method === "solana_signTransaction";
        const data = isSolanaSign
            ? {
                to: Singleton.getInstance()?.defaultSolAddress,
                from: Singleton.getInstance()?.defaultSolAddress,
                data: signingData?.payload?.params?.request?.params?.transaction,
              }
            : signingData?.payload?.params?.request?.params?.[dataIndex];
        // Message-sign requests have no fee to show. Decide this before the first
        // render, otherwise the fee rows render once with a null calculatedFee.
        const isMessageSign =
            signingData?.method != "eth_sendTransaction" &&
            signingData?.method != "solana_signMessage";
        const reviewedMethod = signingData?.payload?.params?.request?.method;
        const signReview =
            reviewedMethod === "personal_sign" || reviewedMethod?.startsWith("eth_signTypedData")
                ? reviewWalletConnectRequest({
                      method: reviewedMethod,
                      params: signingData?.payload?.params?.request?.params,
                      origin: getOrigin(signingData?.payload?.verifyContext?.verified?.origin),
                      chainId: String(signingData?.payload?.params?.chainId ?? ""),
                      validation: signingData?.payload?.verifyContext?.verified?.validation,
                  })
                : null;
        this.setState(
            {
                signReview,
                hideFees: isMessageSign,
                isShowReq: isShow,
                signingData: signingData,
                coinFamily: signingData?.coinFamily,
                selectedNetwork:
                    signingData?.coinFamily == 1
                        ? "Binance"
                        : signingData?.coinFamily == 2
                            ? "Ethereum"
                            : signingData?.coinFamily == 5
                                ? "Solana"
                                : signingData?.coinFamily == 7
                                    ? "Qubetics"
                                : "Polygon",
                transactionData: data,
                calculatedFee: isSolanaSign ? "0.000005" : null,
            },
            async () => {
                if (signingData?.method == "eth_sendTransaction") {
                    if (isSolanaSign) {
                        this.fetchNativePriceFun(signingData?.coinFamily);
                    } else {
                        consoleLogFunc("data>>>", data);
                        let calculateGasEstimate = 0;
                        let gasPrice = 0;
                        if (!data?.gas) {
                            try {
                                const estimateResp = await getGasLimitFromData(
                                    data?.from,
                                    data?.to,
                                    data?.data,
                                    signingData?.coinFamily
                                );
                                calculateGasEstimate =
                                    estimateResp?.gas_estimate || estimateResp || 0;
                            } catch (e: any) {
                                consoleLogFunc("Gas Estimation Error:", e);
                                calculateGasEstimate = 0;
                            }

                        } else {
                            calculateGasEstimate = this.hex2dec(data?.gas);
                        }
                        if (!data?.gasPrice) {
                            try {
                                gasPrice = await getGasPriceForWc(signingData?.coinFamily);
                            } catch (e: any) {
                                consoleLogFunc("Gas Price Fetch Error:", e);
                                gasPrice = 0;
                            }
                        } else {
                            gasPrice = this.hex2dec(data?.gasPrice);
                        }
                        // Ensure minimum gas price for Ethereum
                        if (signingData?.coinFamily === 1 && gasPrice / 10 ** 9 < 1) {
                            gasPrice = 1 * 10 ** 9;
                        }
                        if (signingData?.coinFamily == 4) {
                            this.setState({ isLoading: true });
                            let gasEstimationReq = {
                                from: Singleton.getInstance().defaultMaticAddress,
                                to: Singleton.getInstance().defaultMaticAddress,
                                amount: "",
                            };
                            try {
                                const token = await getData(Constants.ACCESS_TOKEN);
                                const res = await (store as any).dispatch(
                                    (requestGasEstimation as any)({
                                        url: `polygon/pol/gas_estimation`,
                                        coinSymbol: "pol",
                                        gasEstimationReq,
                                        token,
                                    })
                                );

                                consoleLogFunc("gasPriceDetail: pol", res);

                                if (!res?.resultList && res?.gas_price !== undefined) {
                                    res.resultList = {
                                        safe_gas_price: res.gas_price,
                                        propose_gas_price: res.gas_price,
                                        fast_gas_price: res.gas_price,
                                    };
                                }
                                gasPrice =
                                    parseFloat(
                                        res?.resultList?.propose_gas_price < 3
                                            ? 3
                                            : res.resultList.propose_gas_price
                                    ) *
                                    10 ** 9;
                                calculateGasEstimate = Math.ceil(calculateGasEstimate * 1.5);
                                this.setState({ isLoading: false });
                                 // Add 20% buffer
                            } catch (err: any) {
                                consoleLogFunc("Polygon Gas Estimation Error:", err);
                                this.setState({ isLoading: false });
                                return; // Exit early on error
                            }
                        }
                        gasPrice = gasPrice;
                        calculateGasEstimate = calculateGasEstimate;

                        const calculatedFee = toFixedExp(
                            bigNumberSafeMath(
                                bigNumberSafeMath(calculateGasEstimate, "*", gasPrice),
                                "/",
                                10 ** 18
                            ),
                            6
                        );
                        consoleLogFunc("data>>>mediumGasPrice11", gasPrice);
                        consoleLogFunc(
                            "data>>>mediumGasPrice--calculatedFee11",
                            calculatedFee,
                            "---",
                            calculateGasEstimate,
                        );

                        this.setState(
                            {
                                gasLimit: calculateGasEstimate,
                                gasPrice: gasPrice,
                                calculatedFee,
                            },
                            () => {
                                this.fetchNativePriceFun(signingData?.coinFamily);
                            }
                        );
                    }
                } else if (signingData?.method == "solana_signMessage") {
                    consoleLogFunc("signingData?.coinFamily", signingData?.coinFamily, data);
                    let td = {
                        to: Singleton.getInstance()?.defaultSolAddress,
                        from: Singleton.getInstance()?.defaultSolAddress,
                        data: signingData?.payload?.params?.request?.params?.message,
                    };
                    this.setState({
                        transactionData: td,
                    });
                } else {
                    consoleLogFunc("signingData?.coinFamily", signingData?.coinFamily, data);
                    const index = signingData.payload?.params?.request?.params?.findIndex(
                        (ite: any) => {
                            return JSON.stringify(ite).length <= 100;
                        }
                    );
                    let td = {
                        to:
                            index != -1
                                ? signingData?.payload?.params?.request?.params?.[index]
                                : signingData?.payload?.params?.request?.params?.[1] ||
                                Singleton.getInstance()?.defaultEthAddress,
                        from: Singleton.getInstance()?.defaultEthAddress,
                        data: data,
                    };
                    this.setState({
                        transactionData: td,
                    });
                }
            }
        );
    }

    fetchNativePriceFun(coinFamily: any) {
        let data = {
            fiat_currency: Singleton.getInstance().CurrencySelected,
            coin_family: coinFamily,
        };
        (store as any)
            .dispatch(fetchNativePrice({ data }))
            .then((res: any) => {
                this.setState({
                    isLoading: false,
                    fiatPrice: toFixedExp(res?.fiatCoinPrice?.value, 2),
                });
                consoleLogFunc("chk res native price:::::", res);
            })
            .catch((err: any) => {
                this.setState({
                    isLoading: false,
                });
                consoleLogFunc("chk err native price:::::", err);
            });
    }

    closeModal() {
        this.setState({ signingData: "", isShowReq: false }, () => {
            (global as any).wcTxnData = null;
            (global as any).wcTxnPopup = false;
            let requests =
                WalletConnectInstance?.getInstance()?.web3Wallet?.getPendingSessionRequests();
            consoleLogFunc("requests:::S:S::::", requests);
            requests?.map(async (el: any) => {
                const response = {
                    id: el?.id,
                    jsonrpc: "2.0",
                    error: {
                        code: 5000,
                        message: "User rejected.",
                    },
                };
                try {
                    await WalletConnectInstance?.getInstance()?.web3Wallet?.respondSessionRequest(
                        {
                            topic: el?.topic,
                            response: response,
                        }
                    );
                } catch (e: any) {
                    consoleLogFunc("----------dapp request reject----error", e);
                }
            });
        });
    }

    ConvertBase(num: any) {
        return {
            from: function (baseFrom: any) {
                return {
                    to: function (baseTo: any) {
                        return parseInt(num, baseFrom).toString(baseTo);
                    },
                };
            },
        };
    }
    hex2dec(num: any): any {
        return this.ConvertBase(num).from(16).to(10);
    }

    async prepareTransactionRaw(pin: any) {
        try {
            this.setState({ isLoading: true });
            if (this.state.selectedNetwork == "Solana") {
                const mnemonics = await getEncryptedData(
                    Singleton.getInstance().defaultSolAddress,
                    pin
                );
                sendSOLANAFromJupiterSwapLegacyTxn(
                    this.state.transactionData?.data,
                    mnemonics,
                    Singleton.getInstance().defaultSolAddress
                )
                    .then(({ signature, signedTransaction }) => {
                        this.saveSolTransaction(signature, signedTransaction);
                    })
                    .catch((err: any) => {
                        consoleLogFunc("ERR>>>", err);

                        this.setState({
                            isLoading: false,
                            showAlertDialog: true,
                            alertTxt: err,
                        });
                    });
            } else {
                let pKey = await getEncryptedData(
                    `${Singleton.getInstance().defaultEthAddress}_pk`,
                    pin
                );

                let amount = (
                    this.hex2dec(this.state.transactionData?.value || 0) /
                    10 ** 18
                ).toString();
                consoleLogFunc("amount11>>>", amount);

                const nonce = await getNonceForWc(Singleton.getInstance().defaultEthAddress, this.state.coinFamily);
                consoleLogFunc("amount>>>", amount);
                consoleLogFunc("gasLimit>>>", this.state.gasLimit);

                consoleLogFunc("nonce>>>", nonce);
                consoleLogFunc("transactionData>>>", this.state.transactionData);
                consoleLogFunc(
                    "selectedNetwork>>>",
                    this.state.selectedNetwork != "Ethereum"
                );
                let gasPrice = this.state.gasPrice;
                if (this.state.selectedNetwork != "Ethereum") {
                    gasPrice = bigNumberSafeMath(gasPrice, "/", 10 ** 9);
                    consoleLogFunc("gasPrice>>>111", gasPrice);
                    if (gasPrice?.toString().includes(".")) {
                        gasPrice = gasPrice.split(".")[0];
                    }
                }
                consoleLogFunc("gasPrice>>>", gasPrice);

                consoleLogFunc(
                    "nonce>>>",
                    nonce,
                    "---",
                    this.state.selectedNetwork?.toLowerCase()
                );

                Singleton.getInstance()
                    .getsignRawTxnDapp(
                        pKey,
                        amount,
                        gasPrice,
                        this.state.gasLimit,
                        nonce,
                        // nonce_new,
                        this.state.transactionData?.to,
                        this.state.transactionData?.from,
                        this.state.transactionData?.data,
                        this.state.selectedNetwork == "Ethereum"
                            ? "eth"
                            : this.state.selectedNetwork == "Binance"
                                ? "bnb"
                                : this.state.selectedNetwork == "Qubetics"
                                    ? "tics"
                                : "pol"
                    )
                    .then((serializedTx) => {
                        consoleLogFunc("res>>>", serializedTx);
                        pKey = "";
                        if (serializedTx != null) {
                            this.sendCoin(serializedTx, nonce);
                        }
                    })
                    .catch((err: any) => {
                        consoleLogFunc("ERR>>>", err);
                        pKey = "";
                        this.setState({ isLoading: false });
                    });
            }
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    async saveSolTransaction(userSignature: any, signedTransaction: any) {
        // Step 1: Return signed tx to Jupiter first so they can co-sign slot 0 and submit.
        // The actual Solana tx hash (slot 0) is only known after Jupiter broadcasts.
        const responseVal = {
            id: parseInt(this.state.signingData?.payload?.id),
            result: { transaction: signedTransaction },
            jsonrpc: "2.0",
        };
        consoleLogFunc("RES>>>", responseVal, this.state.signingData?.payload?.topic);
        try {
            await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest({
                topic: this.state.signingData?.payload?.topic?.toString(),
                response: responseVal,
            });
        } catch (e: any) {
            consoleLogFunc("WC respond error:", e?.message);
        }

        // Step 2: Poll Solana RPC until the submitted tx appears, then extract real txid.
        const actualTxHash = await resolveActualTxHash(
            userSignature,
            Singleton.getInstance().defaultSolAddress
        );
        consoleLogFunc("actualTxHash:", actualTxHash);

        // Step 3: Save to backend with the correct on-chain tx hash.
        const data = {
            amount: "0.0",
            gas_price: 0.000005,
            from: Singleton.getInstance().defaultSolAddress,
            txid: actualTxHash,
            to: Singleton.getInstance().defaultSolAddress,
            tx_type: "dapp",
            tx_status: "Complete",
        };
        (store as any)
            .dispatch(saveSolTransactionId("sol", data))
            .then((res: any) => {
                consoleLogFunc("res saveSolTransactionId", res);
                this.setState({
                    isLoading: false,
                    showConfirmDialog: true,
                    alertTxt: res?.message,
                });
            })
            .catch((err: any) => {
                consoleLogFunc("err saveSolTransactionId", err);
                this.setState({
                    isLoading: false,
                    alertTxt: err,
                    showAlertDialog: true,
                });
            });
    }

    async sendCoin(serializedTx: any, nonce: any) {
        const tx_raw = serializedTx;
        const from = this.state.transactionData?.from;
        const to = this.state.transactionData?.to;
        const amount = (
            this.hex2dec(this.state.transactionData?.value || 0) /
            10 ** 18
        ).toString();
        const gas_estimate = this.state.gasLimit;
        const eth_gas_price = this.state.gasPrice;
        const coinsym =
            this.state.selectedNetwork == "Ethereum"
                ? "eth"
                : this.state.selectedNetwork == "Binance"
                    ? "bnb"
                    : this.state.selectedNetwork == "Qubetics"
                        ? "tics"
                    : "pol";
        const coinType =
            this.state.selectedNetwork == "Ethereum"
                ? "ethereum"
                : this.state.selectedNetwork == "Binance"
                    ? "binancesmartchain"
                    : this.state.selectedNetwork == "Qubetics"
                        ? "qubetics"
                    : "polygon";
        const fee = toFixedExp(parseFloat(this.state.calculatedFee), 8);

        const sendCoinReq = {
            nonce: nonce,
            tx_raw: tx_raw,
            from: from,
            to: to,
            amount: this.hex2dec(this.state.transactionData) == 0 ? fee : amount,
            add_amount: this.hex2dec(this.state.transactionData) == 0 ? 1 : 0,
            gas_estimate: gas_estimate,
            gas_price: eth_gas_price,
            tx_type: "dapp",
        };
        consoleLogFunc("The sendCoinReq txn is ", sendCoinReq);
        consoleLogFunc("coinsym---- ", coinType, coinsym);

        getData(ACCESS_TOKEN).then((token: any) => {
            consoleLogFunc("The raw txn is " + tx_raw);
            (store as any)
                .dispatch(
                    (requestSendCoin as any)({
                        url: `${coinType}/${coinsym}/send`,
                        coinSymbol: coinsym,
                        sendCoinReq,
                        token,
                    })
                )
                .then(async (res: any) => {
                    consoleLogFunc(
                        "-----------------------Response------------",
                        res.tx_hash
                    );
                    const responseVal = {
                        id: parseInt(this.state.signingData?.payload?.id),
                        result: res?.tx_hash,
                        jsonrpc: "2.0",
                    };
                    await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                        {
                            topic: this.state.signingData?.payload?.topic?.toString(),
                            response: responseVal,
                        }
                    );

                    this.setState({
                        isLoading: false,
                        showConfirmDialog: true,
                        alertTxt: res?.message,
                    });
                })
                .catch((err: any) => {
                    this.setState({
                        isLoading: false,
                        alertTxt: typeof err == "object" ? err?.message : err,
                        showAlertDialog: true,
                    });
                });
        });
    }
    render() {
        if (!this.state.isShowReq) {
            return null;
        }
        const { sendTrx, browser, merchantCard } = LanguageManager;
        // Only a transaction waits on a fee; a message-sign request has none, so
        // gating submit on calculatedFee would leave its button permanently off.
        const isSubmitDisabled =
            !this.state.hideFees &&
            (this.state.calculatedFee == 0 || this.state.calculatedFee == null);

        return (
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                }}
            >
                {this.state.signingData != "" && (
                    <>
                        <BlurView
                            style={styles.blurView}
                            blurType="dark"
                            blurAmount={4}
                            reducedTransparencyFallbackColor="rgba(0,0,0,0.85)"
                        />
                        <View
                            style={{
                                ...styles.modalView,
                            }}
                        >
                            <View
                                style={{
                                    ...styles.modalinner,
                                    borderColor: ThemeManager.colors.borderColor,
                                    backgroundColor: ThemeManager.colors.mnemonicsBg,
                                }}
                            >
                                <View style={styles.ViewStyle5}>
                                    <Text
                                        allowFontScaling={false}
                                        style={{
                                            ...styles.titleSign,
                                            color: ThemeManager.colors.blackWhiteText,
                                        }}
                                    >
                                        {browser.confirmTransaction}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.touchableStyle}
                                        onPress={() => {
                                            this.closeModal();
                                        }}
                                    >
                                        <Image
                                            style={{
                                                tintColor: ThemeManager.colors.blackWhiteText,
                                            }}
                                            source={Images.close_icon}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {this.state.signReview?.accepted && (
                                    <View style={{ gap: 8 }}>
                                        <Text allowFontScaling={false} style={[styles.txtValue, { width: "100%", color: ThemeManager.colors.blackWhiteText }]}>
                                            {this.state.signReview.origin}
                                        </Text>
                                        {this.state.signReview.warnings.map((warning: string) => (
                                            <Text key={warning} allowFontScaling={false} style={[styles.txtValue, { width: "100%", color: "#E5484D" }]}>
                                                {warning}
                                            </Text>
                                        ))}
                                        {this.state.signReview.details.map((detail: any) => (
                                            <View key={detail.label} style={styles.vwSignTransaction}>
                                                <Text allowFontScaling={false} style={[styles.textLbl, { color: ThemeManager.colors.blackWhiteText }]}>
                                                    {detail.label}
                                                </Text>
                                                <Text selectable allowFontScaling={false} style={[styles.txtValue, { color: ThemeManager.colors.lightGreyText }]}>
                                                    {detail.value}
                                                </Text>
                                            </View>
                                        ))}
                                        <ScrollView style={{ maxHeight: 220 }}>
                                            <Text selectable allowFontScaling={false} style={[styles.txtValue, { width: "100%", color: ThemeManager.colors.lightGreyText }]}>
                                                {this.state.signReview.body}
                                            </Text>
                                        </ScrollView>
                                    </View>
                                )}

                                {!this.state.signReview?.accepted && (<>
                                <View style={styles.vwSignTransaction}>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.textLbl,
                                            { color: ThemeManager.colors.blackWhiteText },
                                        ]}
                                    >
                                        {browser.to}
                                    </Text>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.txtValue,
                                            { color: ThemeManager.colors.lightGreyText },
                                        ]}
                                    >
                                        {this.state.transactionData?.to}
                                    </Text>
                                </View>

                                <View style={styles.vwSignTransaction}>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.textLbl,
                                            { color: ThemeManager.colors.blackWhiteText },
                                        ]}
                                    >
                                        {browser.From}
                                    </Text>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.txtValue,
                                            { color: ThemeManager.colors.lightGreyText },
                                        ]}
                                    >
                                        {this.state.transactionData?.from}
                                    </Text>
                                </View>
                                </>)}

                                {!this.state.hideFees && (
                                    <View style={[styles.vwSignTransaction]}>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.textLbl,
                                                { color: ThemeManager.colors.blackWhiteText },
                                            ]}
                                        >
                                            {sendTrx.transactionFee}
                                        </Text>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.txtValue,
                                                {
                                                    color: ThemeManager.colors.lightGreyText,
                                                },
                                            ]}
                                        >
                                            {" "}{this.state.calculatedFee}{" "}
                                            {this.state.selectedNetwork == "Ethereum"
                                                ? "ETH"
                                                : this.state.selectedNetwork == "Binance"
                                                    ? "BNB"
                                                    : this.state.selectedNetwork == "Solana"
                                                        ? "SOL"
                                                        : this.state.selectedNetwork == "Qubetics"
                                                            ? "TICS"
                                                        : "POL"}{" "}
                                            {this.state.selectedNetwork == "Solana" ? "" :`(${Singleton.getInstance().CurrencySymbol} ${toFixedExp(
                                                Number(this.state.calculatedFee) *
                                                Number(this.state.fiatPrice),
                                                4
                                            )})`}
                                        </Text>
                                    </View>
                                )}
                                {!this.state.hideFees && (
                                    <View style={styles.vwSignTransaction}>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.textLbl,
                                                { color: ThemeManager.colors.blackWhiteText },
                                            ]}
                                        >
                                            {browser.total}
                                        </Text>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.txtValue,
                                                { color: ThemeManager.colors.lightGreyText },
                                            ]}
                                        >
                                            {toFixed(
                                                this.state.selectedNetwork == "Solana"
                                                    ? this.state.calculatedFee
                                                    : bigNumberSafeMath(
                                                        this.hex2dec(
                                                            this.state?.transactionData?.value || 0
                                                        ) /
                                                        10 ** 18,
                                                        "+",
                                                        this.state.calculatedFee
                                                    ),
                                                8
                                            )}{" "}
                                            {this.state.selectedNetwork == "Ethereum"
                                                ? "ETH"
                                                : this.state.selectedNetwork == "Binance"
                                                    ? "BNB"
                                                    : this.state.selectedNetwork == "Solana"
                                                        ? "SOL"
                                                        : this.state.selectedNetwork == "Qubetics"
                                                            ? "TICS"
                                                        : "POL"}
                                        </Text>
                                    </View>
                                )}
                                <Button
                                    btnstyle={{ borderRadius: 6, marginBottom: 0 }}
                                    buttontext={merchantCard.submit}
                                    onPress={() => {
                                        this.setState({ pinModal: true });
                                    }}
                                    isDisabled={isSubmitDisabled}
                                    disabled={isSubmitDisabled}
                                />
                            </View>
                        </View>
                        <LoaderView isLoading={this.state.isLoading} />
                    </>
                )}

                <AppAlert
                    visible={this.state.showAlertDialog}
                    alertTxt={this.state.alertTxt}
                    hideAlertDialog={() => {
                        this.setState({ showAlertDialog: false });
                    }}
                />
                <AppAlert
                    visible={this.state.showConfirmDialog}
                    showSuccess={true}
                    alertTxt={this.state.alertTxt}
                    hideAlertDialog={() => {
                        this.setState({
                            showConfirmDialog: false,
                            signingData: "",
                            isShowReq: false,
                        });
                    }}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.pinModal}
                    onRequestClose={() => {
                        this.setState({ pinModal: false });
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <EnterPinForTransaction
                            onBackClick={() => {
                                this.setState({ pinModal: false });
                            }}
                            checkBiometric={true}
                            closeEnterPin={async (pin: any) => {
                                consoleLogFunc("INSIDE_____", this.state.signingData);

                                let pKey = await getEncryptedData(
                                    `${Singleton.getInstance().defaultEthAddress}_pk`,
                                    pin
                                );
                                this.setState({ pinModal: false }, () => {
                                    setTimeout(async () => {
                                        if (
                                            this.state.signingData?.method == "eth_sendTransaction"
                                        ) {
                                            this.prepareTransactionRaw(pin);
                                        } else if (
                                            this.state.signingData?.method == "eth_signTypedData"
                                        ) {
                                            this.setState({ isLoading: true });
                                            consoleLogFunc("eth_signTypedData----11");

                                            Singleton.getInstance()
                                                .dappApprovalHash(
                                                    pKey,
                                                    this.state.signingData?.newParams
                                                )
                                                .then(async (res: any) => {
                                                    consoleLogFunc("dappApprovalHash----11");

                                                    let responseVal = {
                                                        id: parseInt(this.state.signingData?.payload?.id),
                                                        result: res,
                                                        jsonrpc: "2.0",
                                                    };

                                                    consoleLogFunc("responseVal----11");

                                                    try {
                                                        await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                                                            {
                                                                topic:
                                                                    this.state.signingData?.payload?.topic?.toString(),
                                                                response: responseVal,
                                                            }
                                                        );
                                                        pKey = "";
                                                        Singleton.getInstance().showToast?.show(
                                                            "Transaction Successfully Done.",
                                                            2000
                                                        );
                                                        setTimeout(() => {
                                                            this.setState({
                                                                isLoading: false,
                                                                showConfirmDialog: false,
                                                                signingData: "",
                                                                isShowReq: false,
                                                            });
                                                            (global as any).wcTxnPopup = false;
                                                        }, 800);
                                                    } catch (e: any) {
                                                        consoleLogFunc("-------approval-------error", e);
                                                        this.setState({ isLoading: false });
                                                        Singleton.getInstance().showToast?.show(`${e}`);
                                                    }
                                                })
                                                .catch((err: any) => {
                                                    this.setState({ isLoading: false });
                                                    Singleton.getInstance().showToast?.show(
                                                        "Transaction failed."
                                                    );
                                                });
                                        } else if (
                                            this.state.signingData?.method == "personal_sign" ||
                                            this.state.signingData?.method == "solana_signMessage"
                                        ) {
                                            this.setState({ isLoading: true });
                                            let msg = "";
                                            if (
                                                this.state.signingData?.method == "solana_signMessage"
                                            ) {
                                                consoleLogFunc(
                                                    "SOLANA_SIGN_MESSAGE",
                                                    this.state.transactionData?.data
                                                );
                                                let decodeSolanaMessage = bs58.decode(
                                                    this.state.transactionData?.data
                                                );
                                                msg = ethers.toUtf8String(decodeSolanaMessage);
                                            } else {
                                                msg = ethers.toUtf8String(
                                                    this.state.transactionData?.data
                                                );
                                            }
                                            consoleLogFunc("MESSAGE::::::: ", msg);

                                            const signedMessage = await signPersonalMessage(
                                                msg,
                                                pKey,
                                                this.state.coinFamily
                                            );
                                            consoleLogFunc(" my msg::::::: ", msg);

                                            let responseVal = {
                                                id: parseInt(this.state.signingData?.payload?.id),
                                                result: signedMessage,
                                                jsonrpc: "2.0",
                                            };
                                            try {
                                                await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                                                    {
                                                        topic:
                                                            this.state.signingData?.payload?.topic?.toString(),
                                                        response: responseVal,
                                                    }
                                                );

                                                Singleton.getInstance().showToast?.show(
                                                    "Transaction Successfully Done."
                                                );
                                                setTimeout(() => {
                                                    this.setState({
                                                        isLoading: false,
                                                        showConfirmDialog: false,
                                                        signingData: "",
                                                        isShowReq: false,
                                                    });
                                                }, 800);
                                            } catch (err: any) {
                                                consoleLogFunc("personal_sign----catch", err);
                                                this.setState({ isLoading: false });
                                                Singleton.getInstance().showToast?.show(
                                                    "Transaction failed."
                                                );
                                            }
                                        }
                                        (global as any).wcTxnData = null;
                                        (global as any).wcTxnPopup = false;
                                    }, 100);
                                });
                            }}
                        />
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    blurView: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        flex: 1,
    },
    touchableStyle: {
        position: "absolute",
        right: 0,
        top: 0,
        height: 40,
        width: 40,
        alignItems: "flex-end",
    },
    ViewStyle5: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    modalView: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    modalinner: {
        backgroundColor: ThemeManager.colors.whiteText,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 20,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2.84,
        elevation: 2,
        width: "85%",
    },
    vwSignTransaction: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    titleSign: {
        fontFamily: Fonts.dmMedium,
        fontSize: 17,
    },
    textLbl: {
        fontFamily: Fonts.dmMedium,
        fontSize: 15,
    },
    txtValue: {
        width: "86%",
        fontFamily: Fonts.dmRegular,
        fontSize: 14,
    },
});
export default TransactionRequest;
