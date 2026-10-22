/* eslint-disable react-native/no-inline-styles */
import Clipboard from "@react-native-clipboard/clipboard";
import { Component } from "react";
import {
  AppState,
  BackHandler,
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from "react-native-event-listeners";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  fetchNativePrice,
  requestGasEstimation,
  requestNonce,
  requestSendCoin,
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Colors, Fonts } from "../../../theme";
import { heightDimen, widthDimen } from "../../../Utils";
import {
  bnbDataEncode,
  getBnbBal,
  getBnbRaw,
  sendTokenBNB,
} from "../../../Utils/BscUtils";
import { getMaticBal, getMaticRaw } from "../../../Utils/MaticUtils";
import {
  clearGarbageCollection,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixedExp,
} from "../../../Utils/MethodsUtils";
import { getTicsBal } from "../../../Utils/TicsUtils";
import {
  AddressModal,
  AppAlert,
  Button,
  ConfirmTxnModal,
  HeaderMain,
  InputCustom,
  InputCustomWithPasteButton,
  QRCodeScannerNew,
} from "../../common";
import { KeyBoardAwareComp } from "../../common/KeyBoardAwareComp";
import { LoaderView } from "../../common/LoaderView";
import ContactsBook from "../ContactsBook/ContactsBook";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import styles from "./SendBnbPolStyle";

const rnBiometrics = new ReactNativeBiometrics();

class SendBnbPol extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      disabled: false,
      newObj: "",
      showConfirmModal: false,
      nativePrice: 0,
      toAddress: this.props?.preFillAddress || "",
      selectedCoin: this.props.selectedCoin,
      isLoading: false,
      gasFeeMultiplier: 0.000000000000000001,
      selectedFeeType: 2,
      amount: "",
      nonce: 0,
      gasEstimate: 21000,
      gasPrice: 0,
      totalFee: 0,
      isVisible: false,
      valueInUSD: 0,
      bioMetricMode: false,
      showAlertDialog: false,
      alertTxt: "",
      maxclicked: false,
      PinModal: false,
      gasPriceForTxnSlow: 10 * 10 ** 9,
      gasPriceForTxnMedium: 10 * 10 ** 9,
      gasPriceForTxnHigh: 10 * 10 ** 9,
      showAddressBookModal: false,
      showContactlModal: false,
      selectedItem: "",
      selected_Index: undefined,
      isButtonDisabled: false,
      isReqSent: false,
      walletName: "",
      balValue: this.props?.selectedCoin?.balance || 0,
    };
  }
  /******************************************************************************************/

  componentDidMount() {
    consoleLogFunc("this.props.selectedCoin", this.props.selectedCoin)
    consoleLogFunc("this.state.selectedCoin", this.state.selectedCoin)
    getData(Constants.WALLET_NAME).then(async (res) => {
      consoleLogFunc('walletName res ------', res);
      this.setState({ walletName: res })
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: "",
        showConfirmModal: false,
        isVisible: false,
        PinModal: false,
        disabled: false,
        showAddressBookModal: false,
      });
    });
    this.fetchNativePrice();
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.generateFeesAndNonceBnb();
    });
    AppState.addEventListener("change", (nextState) => {
      if (Platform.OS == "android")
        this.setState({
          isVisible: false,
          PinModal: false,
        });
      else this.setState({ isVisible: false });
    });
    getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
      if (bio_mode == "false") this.setState({ bioMetricMode: false });
      else this.setState({ bioMetricMode: true });
    });
    // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
    this.backhandle = (BackHandler as any)?.removeEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
    if (this.backhandle) this.backhandle?.remove();
  }
  componentWillUnmount() {
    clearGarbageCollection();
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
  }

  /******************************************************************************************/

  /******************************************************************************************/
  fetchNativePrice() {
    let data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: this.state.selectedCoin.coin_family,
    };
    this.props
      .fetchNativePrice({ data })
      .then((res: any) => {
        this.setState({
          nativePrice: toFixedExp(res?.fiatCoinPrice?.value, 2),
        });
        consoleLogFunc("chk res native price:::::", res);
      })
      .catch((err: any) => {
        consoleLogFunc("chk err native price:::::", err);
      });
  }

  dynamicApiEndPoint() {
    return this.state.selectedCoin.coin_family == 1
      ? "binancesmartchain"
      : this.state.selectedCoin.coin_family == 7
        ? "qubetics"
        : "polygon";
  }

  dynamicFeesSymbol() {
    return this.state.selectedCoin.coin_family == 1
      ? "BNB"
      : this.state.selectedCoin.coin_family == 7
        ? "TICS"
        : "POL";
  }

  /******************************************************************************************/
  generateFeesAndNonceBnb() {
    this.setState({ isLoading: true });
    const { coin_symbol, wallet_address, token_address, is_token } =
      this.state.selectedCoin;
    let gasEstimationReq = {
      from: wallet_address,
      to: wallet_address,
      amount: "",
    };
    let nonceReq = { amount: "" };
    getData(Constants.ACCESS_TOKEN).then((token) => {
      this.props
        .requestGasEstimation({
          url: `${this.dynamicApiEndPoint()}/${is_token == 0 ? coin_symbol : token_address
            }/gas_estimation`,
          coinSymbol: coin_symbol,
          gasEstimationReq,
          token,
        })
        .then(async (res1: any) => {
          consoleLogFunc("chk gasEstimate res111:::::", res1);
          if (res1.status) {
            try {
              let gasEstimate = res1?.gas_estimate;
              if (this.state.selectedCoin.coin_family != 1) {
                gasEstimate = gasEstimate + 10000;
              }
              if (res1?.resultList == undefined && res1?.gas_price != undefined) {
                consoleLogFunc("res1>>>>>", 'HAS VLAUE');
                res1 = {
                  ...res1,
                  resultList: {
                    safe_gas_price: res1.gas_price,
                    propose_gas_price: res1.gas_price,
                    fast_gas_price: res1.gas_price,
                  },
                };
              }
              const slowGasPrice = parseFloat(res1.resultList?.safe_gas_price < 3 ? 3 : res1.resultList?.safe_gas_price) * 10 ** 9;
              const mediumGasPrice = parseFloat(res1.resultList?.propose_gas_price < 3 ? 3 : (res1.resultList?.propose_gas_price)) * 10 ** 9;
              consoleLogFunc("mediumGasPrice>>>", res1, mediumGasPrice);

              const heightGasPrice =
                parseFloat(
                  res1.resultList?.fast_gas_price < 3
                    ? 3
                    : res1.resultList?.fast_gas_price
                ) *
                10 ** 9;
              consoleLogFunc('heightGasPrice>>>>>>>>>>>>>>', heightGasPrice);
              const feeIs = toFixedExp(
                mediumGasPrice * gasEstimate * this.state.gasFeeMultiplier,
                8
              );
              consoleLogFunc('feeIs>>>>>>>>>>>>>>', feeIs);
              const fee = toFixedExp(
                slowGasPrice * gasEstimate * this.state.gasFeeMultiplier,
                8
              );
              consoleLogFunc('fee>>>>>>>>>>>>>>', fee);
              let bal: any = 0;
              try {
                if (this.state.selectedCoin.coin_family == 1) {
                  bal = await getBnbBal(
                    Singleton.getInstance().defaultBnbAddress
                  );
                } else if (this.state.selectedCoin.coin_family == 7) {
                  bal = await getTicsBal(
                    Singleton.getInstance().defaultBnbAddress
                  );
                } else {
                  bal = await getMaticBal(
                    Singleton.getInstance().defaultMaticAddress
                  );
                }
              } catch (error) {
                consoleLogFunc('error>>>>>>>>>>>>>>', error);
                bal = this.state.selectedCoin.is_token == 1 ? 0 : this.state.balValue;
              }



              consoleLogFunc(parseFloat(fee), 'chk bal res:::::', parseFloat(bal));
              if (is_token != 0 && (parseFloat(fee) > parseFloat(bal))) {
                this.setState({
                  disabled: true,
                  showAlertDialog: true,
                  alertTxt:
                    this.state.selectedCoin.coin_family == 1
                      ? LanguageManager.alertMessages
                        .youhaveInsufficientBnbBalance
                      : LanguageManager.alertMessages
                        .youhaveInsufficientMaticBalance,
                });
              }

              consoleLogFunc("URL>>", `${this.dynamicApiEndPoint()}/${is_token == 0 ? coin_symbol : token_address}/nonce`);

              //  ---------------------------------------------- nonce APi -------------------------------------------------------
              this.props
                .requestNonce({
                  url: `${this.dynamicApiEndPoint()}/${is_token == 0 ? coin_symbol : token_address
                    }/nonce`,
                  coinSymbol: coin_symbol,
                  nonceReq,
                  token,
                })
                .then((res2: any) => {
                  consoleLogFunc('getnonce---', res2.data, res2?.data?.nonce);

                  this.setState({
                    gasEstimate: gasEstimate,
                    gasPrice: mediumGasPrice,
                    isLoading: false,
                    nonce: res2?.data?.nonce,
                    gasPriceForTxnSlow: slowGasPrice,
                    gasPriceForTxnMedium: mediumGasPrice,
                    gasPriceForTxnHigh: heightGasPrice,
                    totalFee: toFixedExp(feeIs, 8),
                  });
                })
                .catch((e: any) => {
                  this.setState({
                    isLoading: false,
                    showAlertDialog: true,
                    alertTxt:
                      e ||
                      LanguageManager.alertMessages
                        .SomethingwentwrongPleasetryagain,
                  });
                });
            } catch (error) {
              consoleLogFunc('error>>>>>>>>>>>>>>', error);
              this.setState({
                isLoading: false,
                showAlertDialog: true,
                alertTxt:
                  error ||
                  LanguageManager.alertMessages
                    .SomethingwentwrongPleasetryagain,
              });
            }
          } else {
            this.setState({
              isLoading: false,
              showAlertDialog: true,
              alertTxt:
                LanguageManager.alertMessages
                  .SomethingwentwrongPleasetryagain,
            });
            return;
          }
        })
        .catch((e: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt:
              e ||
              LanguageManager.alertMessages
                .SomethingwentwrongPleasetryagain,
          });
        });
    });
  }

  /******************************************************************************************/
  checkBiometricAvailabilty() {
    rnBiometrics.isSensorAvailable().then((resultObject) => {
      consoleLogFunc("TouchID is supportedddddddd");
      const { available, biometryType } = resultObject;
      if (available && biometryType === BiometryTypes.TouchID) {
        consoleLogFunc("TouchID is supported");
        this.bimetricPrompt();
      } else if (available && biometryType === BiometryTypes.FaceID) {
        consoleLogFunc("FaceID is supported");
        this.bimetricPrompt();
      } else if (
        available &&
        biometryType === BiometryTypes.Biometrics
      ) {
        consoleLogFunc("Biometrics is supported");
        this.bimetricPrompt();
      } else {
        consoleLogFunc("Biometrics not supported");
      }
    });
  }

  /******************************************************************************************/
  bimetricPrompt() {
    consoleLogFunc("tyoiuoiuo");
    try {
      (Singleton.getInstance() as any)
        .getTouchIDItem()
        .then((res: any) => {
          this.onPinSuccess(res);
        })
        .catch((err: any) => { });
    } catch (e) {
      consoleLogFunc('Device not Support Fingerprint');
    }
  }

  /******************************************************************************************/
  requestCameraPermission() {
    (global as any).openScanner = true;
    Singleton.getInstance()
      .cameraPermission()
      .then((res) => {
        if (res == "granted") {
          Singleton.isCameraOpen = true;
          this.setState({ isVisible: true });
        }
      });
  }

  /******************************************************************************************/
  sendSerializedTxn(tx_raw: any) {
    const { nonce, toAddress, amount, gasEstimate, gasPrice, selectedCoin } =
      this.state;
    let sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultBnbAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: gasEstimate,
      gas_price: gasPrice,
      tx_type: "withdraw",
    };
    consoleLogFunc("sendCoinReq::::", sendCoinReq);
    const { is_token, token_address, coin_symbol } = selectedCoin;
    this.props
      .requestSendCoin({
        url: `${this.dynamicApiEndPoint()}/${is_token == 0 ? selectedCoin.coin_symbol : token_address
          }/send`,
        coinSymbol: coin_symbol,
        sendCoinReq,
      })
      .then((res: any) => {
        consoleLogFunc('requestSendCoin-----TransactionHistory',this.state.selectedCoin);
        (Actions as any).TransactionHistory({
          type: ActionConst.REPLACE,
          selectedCoin: this.state.selectedCoin,
        });
        this.setState({ isLoading: false });
      })
      .catch((e: any) => {
        this.setState({ isLoading: false });
        this.setState({ showAlertDialog: true, alertTxt: e });
      });
  }

  //******************************************************************************************/
  sendTransaction() {
    const { alertMessages } = LanguageManager;
    const { toAddress, amount } = this.state;
    if (toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(toAddress))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAddress,
      });
    else if (
      toAddress.toLowerCase() ==
      Singleton.getInstance().defaultBnbAddress.toLowerCase()
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCannotSendToSameAddress,
      });
    else if (amount.trim().length == 0 || amount == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterAmount,
      });
    else if (isNaN(parseFloat(amount)))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAmount,
      });
    else if (!/^\d*\.?\d*$/.test(amount))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCanEnterOnlyOneDecimal,
      });
    else if (
      parseFloat(amount) > parseFloat(toFixedExp(this.state.balValue, 8))
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    else {
      const newObj = {
        valueInUSD: this.state.valueInUSD,
        amount: this.state.amount,
        totalFee: this.state.totalFee,
        nativePrice: this.state.nativePrice,
        toAddress: this.state.toAddress,
        fromAddress: Singleton.getInstance().defaultBnbAddress,
        feeSymbol: this.dynamicFeesSymbol(),
        fiatAmount: toFixedExp(
          parseFloat(this.state.amount) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
        fiatCoin: toFixedExp(
          parseFloat(this.state.totalFee) * parseFloat(this.state.nativePrice),
          2
        ),
      };
      consoleLogFunc("newObj>>>", newObj);
      this.setState({ showConfirmModal: true, newObj: newObj });
    }
  }

  //******************************************************************************************/
  SendBnb(pin: any) {
    this.setState({ isLoading: true });
    const { gasEstimate, toAddress, amount, nonce, gasPrice } = this.state;
    setTimeout(async () => {
      try {
        let privateKey = await getEncryptedData(
          `${Singleton.getInstance().defaultBnbAddress}_pk`,
          pin
        );
        let txn_raw: any = "";
        if (this.state.selectedCoin.coin_family == 1) {
          const chainId = Constants.network == "testnet" ? 97 : 56;
          txn_raw = await getBnbRaw(amount, toAddress, nonce, gasPrice, gasEstimate, chainId, privateKey)
        } else {//MATIC and TICS
          const chainId = this.state.selectedCoin.coin_family == 7 ? 9030 : 137; //CHAIN ABSTRACTION
          txn_raw = await getMaticRaw(amount, toAddress, nonce, gasPrice, gasEstimate, chainId, privateKey)
        }

        privateKey = "";

        this.sendSerializedTxn(txn_raw);


      } catch (err) {
        this.setState({ isLoading: false });
        this.setState({ showAlertDialog: true, alertTxt: err });
      }
    }, 200);
  }

  //******************************************************************************************/
  SendBep20(pin: any) {
    this.setState({ isLoading: true });

    setTimeout(async () => {
      const { gasEstimate, toAddress, amount, nonce, gasPrice } = this.state;
      const { decimals, token_address } = this.state.selectedCoin;
      consoleLogFunc(gasPrice, "gassprice")

      let privateKey = await getEncryptedData(
        `${Singleton.getInstance().defaultBnbAddress}_pk`,
        pin
      );

      const chainId = this.state.selectedCoin.coin_family == 1 ? 56 : 137;
      const BigNumber = require("bignumber.js");
      let a = new BigNumber(amount);
      let b = new BigNumber(decimals);
      const amountToSend = a.multipliedBy(b).toString();
      bnbDataEncode(token_address, toAddress, amountToSend)
        .then((encodedData) => {
          consoleLogFunc("chk bep encoded Data::::::", encodedData);
          sendTokenBNB(
            token_address,
            encodedData as any,
            nonce,
            gasPrice,
            gasEstimate,
            chainId,
            privateKey
          )
            .then((signedRaw) => {
              consoleLogFunc("chk bep signedRaw::::::", signedRaw);
              privateKey = "";
              this.sendSerializedTxn(signedRaw);
            })
            .catch((err) => {
              privateKey = "";
              this.setState({ isLoading: false });
              this.setState({ showAlertDialog: true, alertTxt: err.message });
            });
        })
        .catch((err) => {
          privateKey = "";
          this.setState({ isLoading: false });
          this.setState({ showAlertDialog: true, alertTxt: err.message });
        });
    }, 200);
  }

  //******************************************************************************************/
  showActualAmount(enteredAmount: any) {
    const amt = exponentialToDecimal(
      enteredAmount * this.state.selectedCoin.currentPriceInMarket
    );
    this.setState({
      valueInUSD: isNaN(enteredAmount)
        ? 0
        : amt < 0.000001
          ? toFixedExp(amt, 8)
          : amt < 0.01
            ? toFixedExp(amt, 4)
            : toFixedExp(amt, 2),
    });
  }

  //******************************************************************************************/
  setToAmountMax() {
    if (this.state.balValue == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.Youdonthaveenoughbalance,
      });
    let val;
    if (this.state.selectedCoin.is_token == 0) {
      val = (
        this.state.balValue -
        this.state.totalFee -
        0.0003
      ).toFixed(8);
      if (val.toString().includes("-")) {
        return this.setState({
          showAlertDialog: true,
          alertTxt:
            LanguageManager.alertMessages
              .YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      this.setState({ amount: ((val as any) * 1).toFixed(6).toString() });
      consoleLogFunc("val", val);
      this.showActualAmount(val);
    } else {
      val = toFixedExp(this.state.balValue, 8);
      if (val.toString().includes("-")) {
        return this.setState({
          showAlertDialog: true,
          alertTxt:
            LanguageManager.alertMessages
              .YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      const decim =
        this.state.selectedCoin.decimals.toString().length - 1 > 18
          ? 8
          : this.state.selectedCoin.decimals.toString().length - 1;

      this.setState({ amount: toFixedExp(val * 1, decim).toString() });
      this.showActualAmount(val);
    }
  }

  //******************************************************************************************/
  onPinSuccess(pin: any) {
    this.setState({ PinModal: false });
    consoleLogFunc("this.state.selectedCoin ", this.state.selectedCoin);
    
    setTimeout(() => {
      this.state.selectedCoin.is_token == 0
        ? this.SendBnb(pin)
        : this.SendBep20(pin);
    }, 1000);
  }

  //******************************************************************************************/
  getAddress = (address: any) => {
    this.setState({ toAddress: address });
  };

  //******************************************************************************************/TODO: -
  onPressAddressBook() {
    this.setState({ showAddressBookModal: true });
  }

  //******************************************************************************************/
  onChangeAmount(val: any) {
    if (val.includes(",")) val = val.replace(",", ".");
    if (val == ".") val = "0.";
    const decim =
      this.state.selectedCoin.decimals.toString().length - 1 > 18
        ? 8
        : this.state.selectedCoin.decimals.toString().length - 1;
    const expression = new RegExp("^\\d*\\.?\\d{0," + decim + "}$");
    if (expression.test(val)) {
      if (/^\d*\.?\d*$/.test(val)) {
        if (val.includes(".") && val.split(".")[1].length > 18) {
          return;
        }
        this.setState({ amount: val, maxclicked: false });
        this.showActualAmount(val);
      }
    }
  }

  //******************************************************************************************/
  onPressConfirm() {
    this.setState({ showConfirmModal: false }, () => {
      setTimeout(() => {
        this.setState({ PinModal: true }, () => {
          if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
        });
      }, 500);
    });

  }

  //******************************************************************************************/
  onMaxClicked() {
    this.setState({ maxclicked: true });
    setTimeout(() => {
      this.setToAmountMax();
    }, 300);
  }

  //******************************************************************************************/
  onClickAction = (type: any) => {
    const { gasPriceForTxnSlow, gasPriceForTxnMedium, gasPriceForTxnHigh } =
      this.state;
    const gasPrice =
      type == "slow"
        ? gasPriceForTxnSlow
        : type == "average"
          ? gasPriceForTxnMedium
          : gasPriceForTxnHigh;
    this.setState(
      {
        selectedFeeType: type == "slow" ? 1 : type == "average" ? 2 : 3,
        gasPriceForTxn: gasPrice,
        totalFee: toFixedExp(
          gasPrice * this.state.gasEstimate * this.state.gasFeeMultiplier,
          8
        ),
      },
      () => {
        if (this.state.maxclicked) this.setToAmountMax();
      }
    );
  };

  //******************************************************************************************/
  getValue = (bal: any) => {
    if (bal > 0) {
      const NewBal =
        bal < 0.000001
          ? toFixedExp(bal, 8)
          : bal < 0.0001
            ? toFixedExp(bal, 6)
            : toFixedExp(bal, 4);
      return NewBal;
    } else return "0.0000";
  };

  typeTextView = (value: any) => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: heightDimen(6),
        }}
      >
        {this.text("Low", "left", "text")}
        {this.text("Average", "center", "text")}
        {this.text("High", "right", "text")}
      </View>
    );
  };

  text = (value: any, textAlign: any, type: any) => {
    return (
      <>
        {type == "text" && (
          <Text
            style={{
              fontSize: 14,
              fontFamily: Fonts.dmSemiBold,
              color: ThemeManager.colors.legalGreyColor,
              flex: 1,
              textAlign: textAlign,
            }}
          >
            {value}
          </Text>
        )}
        {type == "fee" && (
          <Text
            style={{
              fontSize: 10,
              fontFamily: Fonts.dmSemiBold,
              color: ThemeManager.colors.legalGreyColor,
              flex: 1,
              textAlign: textAlign,
            }}
          >
            {value + " " + this.dynamicFeesSymbol()}
          </Text>
        )}
        {type == "fiat" && (
          <Text
            style={{
              fontSize: 10,
              fontFamily: Fonts.dmSemiBold,
              color: ThemeManager.colors.legalGreyColor,
              flex: 1,
              textAlign: textAlign,
            }}
          >
            {value + " " + Singleton.getInstance().CurrencySelected}
          </Text>
        )}
      </>
    );
  };
  typeTextGasView = (key: any) => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnSlow *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier,
            4
          ) <= 0
            ? toFixedExp(
              this.state.gasPriceForTxnSlow *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              6
            )
            : toFixedExp(
              this.state.gasPriceForTxnSlow *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              4
            ),
          "left",
          key
        )}
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnMedium *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier,
            4
          ) <= 0
            ? toFixedExp(
              this.state.gasPriceForTxnMedium *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              6
            )
            : toFixedExp(
              this.state.gasPriceForTxnMedium *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              4
            ),
          "center",
          key
        )}
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnHigh *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier,
            4
          ) <= 0
            ? toFixedExp(
              this.state.gasPriceForTxnHigh *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              6
            )
            : toFixedExp(
              this.state.gasPriceForTxnHigh *
              this.state.gasEstimate *
              this.state.gasFeeMultiplier,
              4
            ),
          "right",
          key
        )}
      </View>
    );
  };
  typeTextUsdView = (key: any) => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnSlow *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier *
            this.state.nativePrice,
            4
          ),
          "left",
          key
        )}
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnMedium *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier *
            this.state.nativePrice,
            4
          ),
          "center",
          key
        )}
        {this.text(
          toFixedExp(
            this.state.gasPriceForTxnHigh *
            this.state.gasEstimate *
            this.state.gasFeeMultiplier *
            this.state.nativePrice,
            4
          ),
          "right",
          key
        )}
      </View>
    );
  };
  onPressItem(item: any, index: any) {
    this.setState({ selected_Index: index });
    setTimeout(() => {
      this.setState({ showContactlModal: false });
      this.getAddress(item?.wallet_address);
    }, 800);
  }

  onPressPaste = () => {
    Clipboard.getString().then((address) => {
      this.setState({
        toAddress: address,
      });
    });
  };

  //******************************************************************************************/
  render() {
    const { walletMain, sendTrx, merchantCard } =
      LanguageManager;
    return (
      <KeyBoardAwareComp>
        <BackgroundImage
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
          <View style={{ flex: 1 }}>
            <HeaderMain
              BackButtonText={
                walletMain.send +
                " " +
                this.state.selectedCoin.coin_symbol?.toUpperCase()
              }
            />
            <KeyboardAwareScrollView keyboardShouldPersistTaps={"always"}>
              <View style={{ flex: 1 }}>
                <View style={styles.mainView}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.txtWallet,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {merchantCard.walletAddress}
                    </Text>
                  </View>
                  <View style={{}}>
                    <View
                      style={[
                        styles.ViewStyle,
                        {
                          borderColor: ThemeManager.colors.inputBorder,
                          backgroundColor: "transparent",
                        },
                      ]}
                    >
                      <InputCustomWithPasteButton
                        value={this.state.toAddress}
                        onChangeText={(val: any) => {
                          this.setState({
                            toAddress: val,
                          });
                        }}
                        placeHolder={merchantCard.walletAddress}
                        customInputStyle={[
                          styles.ViewStyle1,
                          {
                            backgroundColor: "transparent",
                            color: ThemeManager.colors.blackWhiteText,
                          },
                        ]}
                        placeholderTextColor={ThemeManager.colors.inputBorder}
                      />
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          right: 80,
                          top: 17,
                          alignSelf: "center",
                        }}
                        onPress={() => this.onPressPaste()}
                      >
                        <Text
                          style={[
                            styles.txtWallet,
                            {
                              color: ThemeManager.colors.blackWhiteText,
                              fontFamily: Fonts.dmBold,
                            },
                          ]}
                        >
                          {sendTrx.paste}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={this.state.isButtonDisabled}
                        onPress={() => {
                          this.setState({ isButtonDisabled: true });
                          this.onPressAddressBook();
                          setTimeout(() => {
                            this.setState({ isButtonDisabled: false });
                          }, 2000);
                        }}
                        style={{
                          position: "absolute",
                          right: 50,
                          top: 17,
                          alignSelf: "center",
                        }}
                      >
                        <Image
                          source={ThemeManager.ImageIcons.addressBook}
                          style={{
                            tintColor: ThemeManager.colors.blackWhiteText,
                          }}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={this.state.isButtonDisabled}
                        onPress={() => {
                          this.setState({ isButtonDisabled: true });
                          this.requestCameraPermission();
                          setTimeout(() => {
                            this.setState({ isButtonDisabled: false });
                          }, 2000);
                        }}
                        style={styles.scan}
                      >
                        <Image
                          style={{
                            tintColor: ThemeManager.colors.blackWhiteText,
                          }}
                          source={ThemeManager.ImageIcons.scan}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* ------------------------------------------------------------------- */}
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.txtWallet,
                        {
                          height: 40,
                          marginTop: 25,
                          color: ThemeManager.colors.blackWhiteText,
                        },
                      ]}
                    >
                      {sendTrx.Amount}
                    </Text>
                    <View
                      style={[
                        styles.ViewStyle2,
                        {
                          borderColor: ThemeManager.colors.inputBorder,
                          backgroundColor: "transparent",
                        },
                      ]}
                    >
                      <InputCustom
                        value={this.state.amount}
                        onChangeText={(val: any) => {
                          this.onChangeAmount(val);
                        }}
                        placeHolder={sendTrx.enterAmount}
                        placeholderColor={ThemeManager.colors.darkMode}
                        keyboardType="decimal-pad"
                        maxLength={15}
                        customInputStyle={[
                          styles.ViewStyle4,
                          { color: ThemeManager.colors.DarkRed },
                        ]}
                        placeholderTextColor={ThemeManager.colors.inputBorder}
                      />
                      <View style={styles.ViewStyle3}>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          this.onMaxClicked();
                        }}
                        style={styles.maxStyle}
                      >
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.maxText,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {sendTrx.max}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.ViewStyle5}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Image
                          source={ThemeManager.ImageIcons.approxEqual}
                          style={{
                            width: widthDimen(8),
                            height: widthDimen(8),
                            resizeMode: "contain",
                          }}
                        />
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.fiatStyle,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {Singleton.getInstance().CurrencySymbol}
                          {this.state.valueInUSD}
                        </Text>
                      </View>

                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.TextStyle,
                          { color: ThemeManager.colors.grayTextColor },
                        ]}
                      >
                        {sendTrx.Balance}{" "}
                        <Text
                          style={[
                            styles.TextStyle,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {this.getValue(this.state.balValue)}{" "}
                          {this.state.selectedCoin.coin_symbol.toUpperCase()}
                        </Text>
                      </Text>
                    </View>
                    {/* ------------------------------------------------------------------- */}
                    <View style={(styles as any).coinInfo /* BUG PRESERVED: styles.coinInfo does not exist in SendBnbPolStyle */}>
                      <View style={styles.ViewStyle6}>
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.TextStyle1,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {sendTrx.transactionFee}
                        </Text>

                        <View
                          style={{
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: heightDimen(10),
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              this.onClickAction("slow");
                            }}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  backgroundColor:
                                    this.state.selectedFeeType == 1
                                      ? "rgba(94, 209, 210, 0.5)"
                                      : "transparent",
                                  borderRadius:
                                    this.state.selectedFeeType == 1 ? 20 : 10,
                                  height:
                                    this.state.selectedFeeType == 1 ? 30 : 15,
                                  width:
                                    this.state.selectedFeeType == 1 ? 30 : 15,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginLeft:
                                    this.state.selectedFeeType == 1 ? -10 : 0,
                                }}
                              >
                                <LinearGradient
                                  colors={[
                                    this.state.selectedFeeType == 1
                                      ? "#85FFC4"
                                      : "#BC85FF",
                                    "#5CC6FF",
                                    this.state.selectedFeeType == 1
                                      ? "#BC85FF"
                                      : "#85FFC4",
                                  ]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0.25 }}
                                  style={{
                                    borderRadius:
                                      this.state.selectedFeeType == 1 ? 30 : 10,
                                    height:
                                      this.state.selectedFeeType == 1 ? 20 : 15,
                                    width:
                                      this.state.selectedFeeType == 1 ? 20 : 15,
                                  }}
                                />
                              </View>
                              <LinearGradient
                                colors={
                                  this.state.selectedFeeType == 1
                                    ? [
                                      ThemeManager.colors.inputBorder,
                                      ThemeManager.colors.inputBorder,
                                    ]
                                    : ["#85FFC4", "#5CC6FF", "#BC85FF"]
                                }
                                style={{
                                  height: 3,
                                  width: "90%",
                                }}
                              />
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              this.onClickAction("average");
                            }}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  backgroundColor:
                                    this.state.selectedFeeType == 2
                                      ? "rgba(94, 209, 210, 0.5)"
                                      : "transparent",
                                  borderRadius:
                                    this.state.selectedFeeType == 2 ? 20 : 10,
                                  height:
                                    this.state.selectedFeeType == 2 ? 30 : 15,
                                  width:
                                    this.state.selectedFeeType == 2 ? 30 : 15,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginLeft:
                                    this.state.selectedFeeType == 2 ? -10 : 0,
                                }}
                              >
                                <LinearGradient
                                  colors={[
                                    this.state.selectedFeeType == 2 ||
                                      this.state.selectedFeeType == 3
                                      ? "#85FFC4"
                                      : "#76747B",
                                    this.state.selectedFeeType == 2 ||
                                      this.state.selectedFeeType == 3
                                      ? "#5CC6FF"
                                      : "#76747B",
                                    this.state.selectedFeeType == 2 ||
                                      this.state.selectedFeeType == 3
                                      ? "#BC85FF"
                                      : "#76747B",
                                  ]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0.25 }}
                                  style={{
                                    borderRadius:
                                      this.state.selectedFeeType == 2 ? 30 : 10,
                                    height:
                                      this.state.selectedFeeType == 2 ? 20 : 15,
                                    width:
                                      this.state.selectedFeeType == 2 ? 20 : 15,
                                  }}
                                />
                              </View>
                              <LinearGradient
                                colors={
                                  this.state.selectedFeeType == 3
                                    ? ["#85FFC4", "#5CC6FF", "#BC85FF"]
                                    : [
                                      ThemeManager.colors.inputBorder,
                                      ThemeManager.colors.inputBorder,
                                    ]
                                }
                                style={{
                                  height: 3,
                                  width: "90%",
                                }}
                              />
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              this.onClickAction("high");
                            }}
                            activeOpacity={0.8}
                          >
                            <View
                              style={{
                                backgroundColor:
                                  this.state.selectedFeeType == 3
                                    ? "rgba(94, 209, 210, 0.5)"
                                    : Colors.primaryColor,
                                borderRadius:
                                  this.state.selectedFeeType == 3 ? 20 : 10,
                                height: this.state.selectedFeeType == 3 ? 30 : 15,
                                width: this.state.selectedFeeType == 3 ? 30 : 15,
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft:
                                  this.state.selectedFeeType == 3 ? -10 : 0,
                              }}
                            >
                              <LinearGradient
                                colors={[
                                  this.state.selectedFeeType == 3
                                    ? "#85FFC4"
                                    : "#76747B",
                                  this.state.selectedFeeType == 3
                                    ? "#5CC6FF"
                                    : "#76747B",
                                  this.state.selectedFeeType == 3
                                    ? "#BC85FF"
                                    : "#76747B",
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0.25 }}
                                style={{
                                  borderRadius:
                                    this.state.selectedFeeType == 3 ? 30 : 10,
                                  height:
                                    this.state.selectedFeeType == 3 ? 20 : 15,
                                  width:
                                    this.state.selectedFeeType == 3 ? 20 : 15,
                                }}
                              />
                            </View>
                          </TouchableOpacity>
                        </View>
                        {this.typeTextView(undefined)}
                        {this.typeTextGasView("fee")}
                        {this.typeTextUsdView("fiat")}
                      </View>
                    </View>
                    {/* ------------------------------------------------------------------- */}
                  </View>
                </View>
              </View>
            </KeyboardAwareScrollView>

            <View style={styles.ViewStyle8}>
              {this.state.disabled ? (
                <View
                  style={[
                    styles.sendBtnStyle,
                    { backgroundColor: ThemeManager.colors.settingBg },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.sendBtnTextStyle, { color: "gray" }]}
                  >
                    {sendTrx.SEND}
                  </Text>
                </View>
              ) : (
                <Button
                  onPress={() => {
                    this.sendTransaction();
                  }}
                  myStyle={{ marginBottom: heightDimen(50) }}
                  buttontext={sendTrx.SEND}
                />
              )}
            </View>

            {/* --------------------------------Modal for Pin----------------------------------- */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={this.state.PinModal}
              onRequestClose={() => {
                this.setState({ PinModal: false });
              }}
            >
              <View style={{ flex: 1 }}>
                <EnterPinForTransaction
                  onBackClick={() => {
                    this.setState({ PinModal: false });
                  }}
                  closeEnterPin={(pin: any) => {
                    this.onPinSuccess(pin);
                  }}
                />
              </View>
            </Modal>
            {/* --------------------------------ConfirmTxnModal----------------------------------- */}
            <ConfirmTxnModal
              handleBack={() => this.setState({ showConfirmModal: false })}
              showConfirmTxnModal={this.state.showConfirmModal}
              newObj={this.state.newObj}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
            />
            {this.state.showAddressBookModal && <ContactsBook
              handleBack={() => this.setState({ showAddressBookModal: false })}
              showAddressBookModal={this.state.showAddressBookModal}
              newObj={this.state.newObj}
              getAddress={this.getAddress}
              address={Singleton.getInstance().defaultBnbAddress}
              coin_family={this.state.selectedCoin.coin_family}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
              onPressView={(item: any) => {
                this.setState({
                  showAddressBookModal: false,
                  showContactlModal: true,
                  selectedItem: item,
                });
                consoleLogFunc("here==", item);
              }}
              addbook={() => {
                this.setState({ showAddressBookModal: false });
                Actions.currentScene != "AddContact" &&
                  (Actions as any).AddContact({ themeSelected: this.props.themeSelected });
              }}
              navigation={this.props.navigation}
            />
            }
            {this.state.showContactlModal && <AddressModal
              selected_Index={this.state.selected_Index}
              onPressItem={(item: any, index: any) => this.onPressItem(item, index)}
              dismiss={() => this.setState({ showContactlModal: false })}
              item={this.state.selectedItem}
              openModel={this.state.showContactlModal}
            />}

            <Modal
              animationType={"slide"}
              transparent={true}
              visible={this.state.isVisible}
              onRequestClose={() => {
                consoleLogFunc("Modal has been closed.");
              }}
            >
              <View style={[styles.modalView, { flex: 1 }]}>
                <View
                  style={{
                    backgroundColor: ThemeManager.colors.mainBgNew,
                    flex: 1,
                    marginTop: -5,
                  }}
                >
                  <QRCodeScannerNew
                    cameraStyle={styles.cameraStyle}
                    onRead={(event: any) => {
                      const address = event.data;
                      let newAddress = "";
                      consoleLogFunc("address>>", address);

                      if (address.includes(":")) {
                        let address1 = address.split(":");
                        newAddress = address1[1];
                        if (newAddress.includes("?")) {
                          let address1 = newAddress.split("?");
                          newAddress = address1[0];
                        }
                      } else {
                        newAddress = address;
                      }
                      this.setState({ isVisible: false, toAddress: newAddress });
                    }}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      this.setState({ isVisible: false });
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.txtCancel,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {sendTrx.Cancel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <AppAlert
              visible={this.state.showAlertDialog}
              alertTxt={this.state.alertTxt}
              hideAlertDialog={() => {
                this.setState({ showAlertDialog: false });
                if (this.state.isReqSent) {
                  (Actions as any).TransactionHistory({
                    type: ActionConst.REPLACE,
                    selectedCoin: this.state.selectedCoin,
                  });
                }
              }}
            />
            <LoaderView isLoading={this.state.isLoading} />
          </View>
        </BackgroundImage>
      </KeyBoardAwareComp>
    );
  }
}

export default connect(null, {
  requestGasEstimation,
  requestNonce,
  requestSendCoin,
  fetchNativePrice,
})(SendBnbPol);
