/* eslint-disable react-native/no-inline-styles */
import Clipboard from "@react-native-clipboard/clipboard";
import { Component } from "react";
import { BackHandler, Image, Modal, Text, TouchableOpacity, View } from "react-native";
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
  requestBTCgasprice,
  requestSendCoin,
  requestUnspent,
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Colors, Fonts } from "../../../theme/";
import { heightDimen } from "../../../Utils";
import { validateBTCAddress } from "../../../Utils/BtcUtils";
import {
  clearGarbageCollection,
  consoleLogFunc,
  exponentialToDecimal,
  exponentialToDecimalWithoutComma,
  getData,
  getEncryptedData,
  toFixedExp,
} from "../../../Utils/MethodsUtils";
import {
  AddressModal,
  AppAlert,
  Button,
  ConfirmTxnModal,
  HeaderMain,
  InputCustom,
  InputCustomWithPasteButton,
  QRCodeScannerNew
} from "../../common";
import { KeyBoardAwareComp } from "../../common/KeyBoardAwareComp";
import { LoaderView } from "../../common/LoaderView";
import ContactsBook from "../ContactsBook/ContactsBook";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import styles from "./SendBtcStyle";

const rnBiometrics = new ReactNativeBiometrics();
const bitcore = require("bitcore-lib");

let fee = 0;
let inputCount = 0;
let outputCount = 2;
let totalAmountAvailable = 0;
let inputs: any[] = [];
let transactionSize = 0;
let btcTosatoshi = 100000000;
let btcTosatoshiMultiplier = 0.00000001;

class SendBtc extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      newObj: "",
      showConfirmModal: false,
      myAddress: this.props.selectedCoin.wallet_address,
      toAddress: this.props?.preFillAddress || "",
      selectedCoin: this.props.selectedCoin,
      isLoading: false,
      selectedFeeType: 2,
      selectedFee: "",
      amount: "",
      gasEstimate: 0,
      gas_gwei_price: 0,
      nonce: 0,
      isVisible: false,
      marketPriceSelectedCurrency: 0,
      valueInUSD: 0,
      selectedDropDownIndex: 1,
      SliderValue: 0,
      btcFeeObj: null,
      bioMetricMode: false,
      showAlertDialog: false,
      alertTxt: "",
      maxclicked: false,
      PinModal: false,
      isButtonDisabled: false,
      showAddressBookModal: false,
      showContactlModal: false,
      isReqSent: false,
      walletName: '',

    };
    this.isMakerWallet = Singleton.getInstance().isMakerWallet
  }



  /******************************************************************************************/
  async componentDidMount() {

    getData(Constants.LOGIN_DATA).then((res) => {
      const result = JSON.parse(res);
      consoleLogFunc("LOGIN_DATA ------");
      this.setState({
        makerUserId: result?.makerUserId,
      });
    });
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
        showAddressBookModal: false

      });
    });
    getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
      if (bio_mode == "false") this.setState({ bioMetricMode: false });
      else this.setState({ bioMetricMode: true });
    });
    this.focusListener = this.props.navigation.addListener('focus', async () => {
      BackHandler.addEventListener("hardwareBackPress", this.handleBackButtonClick);
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      this.setState({ isVisible: false, PinModal: false });
    });
    this.getbtcFeesAndUnspentTransaction();
    this.setState({
      marketPriceSelectedCurrency: this.state.selectedCoin.currentPriceInMarket,
    });
  }

  componentWillUnmount() {
    clearGarbageCollection()
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
    if (this.blurListener) (typeof this.blurListener === 'function' ? this.blurListener() : this.blurListener?.remove?.());
  }

  handleBackButtonClick() {
    consoleLogFunc("backhandler>>>>>>");
    Actions.pop()

    return true;
  };

  /******************************************************************************************/

  /******************************************************************************************/
  onPressConfirm() {
    this.setState({ showConfirmModal: false }, () => {
      setTimeout(() => {
        this.setState({ PinModal: true }, () => {
          if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
        });
      }, 500);
    });

  }

  onPressItem(item: any, index: any) {
    this.setState({ selected_Index: index });
    setTimeout(() => {
      this.setState({ showContactlModal: false });
      this.getAddress(item?.wallet_address);
    }, 800);
  }

  /******************************************************************************************/
  getbtcFeesAndUnspentTransaction() {
    inputCount = 0;
    inputs = [];

    consoleLogFunc("requestBTCgasprice>>",);

    /******************************get btc fees****************************** */
    this.props
      .requestBTCgasprice()
      .then((res: any) => {
        consoleLogFunc("res>?>>>", res);

        if (res.regular) {
          this.setState({
            btcFeeObj: res,
            SliderValue: res.priority,
          });
        } else {
          this.setState({
            btcFeeObj: null,
            SliderValue: 50,
          });
        }
        /******************************get unspent transaction****************************** */
        getData(Constants.ACCESS_TOKEN).then((token) => {
          consoleLogFunc('getbtcFeesAndUnspentTransaction----', this.state.myAddress);

          this.props
            .requestUnspent(
              this.state.myAddress,
              token,
              this.state.selectedCoin.coin_symbol
            )
            .then((res: any) => {
              consoleLogFunc("response unspent>>>>>>", res);
              totalAmountAvailable = 0;

              res.data.forEach(async (element: any) => {
                let utxo: any = {};
                utxo.satoshis = Math.floor(Number(element.satoshis));
                utxo.script = element.scriptPubKey;
                utxo.address = element.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.vout;
                utxo.tx_raw = element.tx_raw;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
              });
              this.setState({ isLoading: false });
              consoleLogFunc("------input", JSON.stringify(inputs));
              consoleLogFunc("------inputCount", inputCount);
              consoleLogFunc("------outputCount", outputCount);
              transactionSize =
                inputCount * 146 + outputCount * 34 + 10 - inputCount;
            })
            .catch((e: any) => {
              this.setState({ isLoading: false });
            });
        });
      })
      .catch((e: any) => {
        consoleLogFunc("e>?>>>", e);

        this.setState({ isLoading: false });
      });
  }

  /******************************************************************************************/
  checkBiometricAvailabilty() {
    rnBiometrics.isSensorAvailable().then((resultObject) => {
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
    try {
      (Singleton.getInstance() as any).getTouchIDItem().then((res: any) => {
        this.onPinSuccess(res);
      }).catch((err: any) => {
      })
    } catch (e) {
      consoleLogFunc('Device not Support Fingerprint');
    }
  }

  /******************************************************************************************/
  requestCameraPermission() {
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
  setToAmountMax(SliderValue: any) {
    consoleLogFunc("s ", this.state.selectedCoin.balance);
    consoleLogFunc("transactionSize ", transactionSize);
    consoleLogFunc("SliderValue ", SliderValue);
    if (this.state.selectedCoin.balance == 0 || this.state.maxclicked == false)
      return;
    let val;
    if (this.state.selectedDropDownIndex == 0)
      val = (
        (this.state.selectedCoin.balance -
          this.convertSatoshiinCoinForm(transactionSize * SliderValue)) *
        this.state.marketPriceSelectedCurrency
      ).toFixed(8);
    else
      val = (
        this.state.selectedCoin.balance -
        this.convertSatoshiinCoinForm(transactionSize * SliderValue) -
        0.00002
      ).toFixed(8);
    consoleLogFunc(transactionSize * SliderValue);
    if (val.toString().includes("-")) {
      return this.setState({
        showAlertDialog: true,
        alertTxt:
          LanguageManager.alertMessages
            .YoudonthaveEnoughbalanceAmountTransactionFee,
      });
    }
    consoleLogFunc("val ", val);
    this.setState({ amount: ((val as any) * 1).toFixed(6).toString() });
    this.showActualAmount(val);
  }

  /******************************************************************************************/
  convertSatoshiinCoinForm(satoshisvalue: any) {
    const val = parseFloat(
      exponentialToDecimalWithoutComma(satoshisvalue / btcTosatoshi)
    );
    return val;
  }

  /******************************************************************************************/
  sendSerializedTxn(
    nonce: any,
    tx_raw: any,
    myAddress: any,
    toAddress: any,
    amount: any,
    gasEstimate: any,
    gas_gwei_price: any,
    coin_symbol: any,
    userToken: any
  ) {
    const sendCoinReq = {
      nonce: nonce,
      tx_raw: `${tx_raw}`,
      from: myAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: gasEstimate,
      eth_gas_price: gas_gwei_price,
      tx_type: "withdraw",
    };
    consoleLogFunc("sendCoinReq:::::>>>>>", sendCoinReq);
    this.props
      .requestSendCoin({
        url: `bitcoin/${coin_symbol}/send`,
        coinSymbol: coin_symbol,
        sendCoinReq,
        token: userToken,
      })
      .then((res: any) => {
        consoleLogFunc("coin_symbol::::", coin_symbol);
        consoleLogFunc("this.state.amount::::", this.state.amount);
        consoleLogFunc("this.state.selectedFee::::", this.state.selectedFee);
        (Actions as any).TransactionHistory({ type: ActionConst.REPLACE, selectedCoin: this.state.selectedCoin });
        this.setState({ isLoading: false });
      })
      .catch((e: any) => {
        this.setState({ isLoading: false });
        this.setState({
          showAlertDialog: true,
          alertTxt:
            e || LanguageManager.alertMessages.failedtoInitiateTransaction,
        });
      });
  }

  /******************************************************************************************/
  onPinSuccess(pin: any) {
    this.setState({ PinModal: false });
    setTimeout(() => {
      this.sendBtc(pin);
    }, 1000);
  }

  /******************************************************************************************/
  async sendBtc(pin: any) {
    const {
      nonce,
      myAddress,
      toAddress,
      amount,
      gasEstimate,
      gas_gwei_price,
      selectedCoin,
    } = this.state;
    let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBtcAddress}_pk`, pin);
    fee = transactionSize * this.state.SliderValue;
    consoleLogFunc("----fee", fee);
    consoleLogFunc("----transactionSize", transactionSize);
    consoleLogFunc("----SliderValue", this.state.SliderValue);
    consoleLogFunc("----totalAmountAvailable", totalAmountAvailable);
    consoleLogFunc("----eee22", Math.round(this.state.amount * btcTosatoshi));
    consoleLogFunc("----eee22btcTosatoshi==", btcTosatoshi);

    consoleLogFunc(
      "after fee",
      totalAmountAvailable - Math.round(this.state.amount * btcTosatoshi) - fee
    );
    if (
      totalAmountAvailable -
      Math.round(this.state.amount * btcTosatoshi) -
      fee <
      0

    ) {
      consoleLogFunc("---aaaaaa>>>>");
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.balancetooLowforThisTransaction,
      });
    }
    consoleLogFunc("-----1");
    this.setState({ isLoading: true });
    setTimeout(async () => {
      consoleLogFunc("-----2", amount, toAddress, myAddress);

      let serializedTransaction;
      try {
        const transaction = new bitcore.Transaction();
        transaction.from(inputs);
        transaction.to(
          this.state.toAddress,
          Math.round(this.state.amount * btcTosatoshi)
        );
        transaction.change(this.state.myAddress);
        transaction.fee(fee);
        transaction.sign(privateKey);
        serializedTransaction = transaction.serialize();

        consoleLogFunc('--------------serializeBTC', serializedTransaction)

      } catch (e) {
        consoleLogFunc(e);
        this.setState({
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.failedtoInitiateTransaction,
        });
        this.setState({ isLoading: false });
        return;
      }

      getData(Constants.ACCESS_TOKEN)
        .then((token) => {
          privateKey = ""
          this.sendSerializedTxn(
            nonce,
            serializedTransaction,
            myAddress,
            toAddress,
            amount,
            gasEstimate,
            gas_gwei_price,
            selectedCoin.coin_symbol,
            token
          );
        })
        .catch((err) => {
          privateKey = ""
          this.setState({
            showAlertDialog: true,
            alertTxt: LanguageManager.alertMessages.failedtoInitiateTransaction,
          });

          this.setState({ isLoading: false });
        });
    }, 200);
  }

  /******************************************************************************************/
  async sendTransaction() {

    consoleLogFunc("sendTransaction----->>>", this.state.toAddress.toLowerCase(),
      Singleton.getInstance().defaultBtcAddress.toLowerCase());

    const { alertMessages } = LanguageManager;
    if (this.state.toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (
      this.state.toAddress.toLowerCase() ==
      Singleton.getInstance().defaultBtcAddress.toLowerCase()
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCannotSendToSameAddress,
      });
    else if (this.state.amount.trim().length == 0 || this.state.amount == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterAmount,
      });
    else if (isNaN(parseFloat(this.state.amount)))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAmount,
      });
    else if (!/^\d*\.?\d*$/.test(this.state.amount)) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCanEnterOnlyOneDecimal,
      });
    } else if (
      parseFloat(this.state.amount) >
      parseFloat(toFixedExp(this.state.selectedCoin.balance, 8))
    ) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    } else {
      const totalFee =
        transactionSize * this.state.SliderValue * btcTosatoshiMultiplier;
      const newObj = {
        valueInUSD: this.state.valueInUSD,
        amount: this.state.amount,
        totalFee: totalFee,
        nativePrice: this.state.selectedCoin.currentPriceInMarket,
        toAddress: this.state.toAddress,
        fromAddress: Singleton.getInstance().defaultBtcAddress,
        feeSymbol: "BTC",
        fiatAmount: toFixedExp(
          parseFloat(this.state.amount) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
        fiatCoin: toFixedExp(
          parseFloat(totalFee as any) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
      };
      this.setState({ showConfirmModal: true, newObj: newObj });
    }
  }

  /******************************************************************************************/
  convertSatoshiToUsd(satoshisvalue: any) {
    if (!transactionSize) {
      return "";
    }
    const val = (
      exponentialToDecimalWithoutComma((satoshisvalue / btcTosatoshi) * transactionSize) *
      this.state.marketPriceSelectedCurrency
    ).toFixed(5);
    consoleLogFunc(
      'convertSatoshiToUsd -----', satoshisvalue,
      exponentialToDecimalWithoutComma((satoshisvalue / btcTosatoshi) * transactionSize) *
      this.state.marketPriceSelectedCurrency
    );
    return val;
  }

  /******************************************************************************************/


  onPressAddressBook() {
    this.setState({ showAddressBookModal: true })
  }






  /******************************************************************************************/
  onMaxClicked() {
    this.setState({ maxclicked: true });
    setTimeout(() => {
      this.setToAmountMax(this.state.SliderValue);
    }, 300);
  }

  /******************************************************************************************/
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

  /******************************************************************************************/
  onClickAction = (type: any) => {
    this.setState({
      selectedFeeType: type == "slow" ? 1 : type == "average" ? 2 : 3,
      SliderValue:
        type == "slow"
          ? this.state.btcFeeObj.regular
          : type == "average"
            ? this.state.btcFeeObj.priority
            : this.state.btcFeeObj.limits.max,
    });
    if (this.state.maxclicked) {
      this.setToAmountMax(
        type == "slow"
          ? this.state.btcFeeObj.regular
          : type == "average"
            ? this.state.btcFeeObj.priority
            : this.state.btcFeeObj.limits.max
      );
    }
  };

  /******************************************************************************************/
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

  /******************************************************************************************/
  getAddress = (address: any) => {
    this.setState({ toAddress: address });
  };

  /******************************************************************************************/
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

  onPressPaste = () => {
    Clipboard.getString().then((address) => {
      this.setState({
        toAddress: address,
      })
    })
  }

  /******************************************************************************************/
  render() {
    const {
      alertMessages,
      walletMain,
      sendTrx,
      merchantCard,
      placeholderAndLabels,
    } = LanguageManager;
    return (
      <KeyBoardAwareComp>
        <BackgroundImage
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
          <View style={{ flex: 1, }}>
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
                  <View style={{}}>
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
                    <View style={{ flex: 1 }}>
                      <View
                        style={[
                          styles.ViewStyle,
                          { backgroundColor: "transparent", borderColor: ThemeManager.colors.inputBorder, }
                        ]}
                      >
                        <InputCustomWithPasteButton
                          value={this.state.toAddress}
                          onChangeText={(val: any) => {
                            this.setState({
                              toAddress: val,
                            });
                          }}
                          placeHolder={placeholderAndLabels.pasteWalletaddress}
                          customInputStyle={[
                            styles.ViewStyle1,
                            {
                              backgroundColor: "transparent",
                              color: ThemeManager.colors.blackWhiteText,
                            },
                          ]}
                          onPastePress={(val: any) => {
                            this.setState({ toAddress: val });
                          }}
                          placeholderTextColor={ThemeManager.colors.inputBorder}
                        />
                        <TouchableOpacity
                          style={{ position: "absolute", right: 80, top: 17, alignSelf: "center" }}
                          onPress={() => this.onPressPaste()}>
                          <Text style={[styles.txtWallet, { color: ThemeManager.colors.blackWhiteText, fontFamily: Fonts.dmBold }]}>
                            {sendTrx.paste}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={this.state.isButtonDisabled || Singleton.getInstance().isMakerWallet}
                          onPress={() => {
                            this.setState({ isButtonDisabled: true })
                            this.onPressAddressBook()
                            setTimeout(() => {
                              this.setState({ isButtonDisabled: false });
                            }, 2000);

                          }

                          }
                          style={{ position: "absolute", right: 50, top: 17 }}
                        >
                          <Image source={ThemeManager.ImageIcons.addressBook} style={{ tintColor: ThemeManager.colors.blackWhiteText }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => this.requestCameraPermission()}
                          style={styles.scan}
                        >
                          <Image
                            style={{ tintColor: ThemeManager.colors.blackWhiteText }}
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
                        {sendTrx.enterAmount}
                      </Text>

                      <View
                        style={[
                          styles.ViewStyle2,
                          { borderColor: ThemeManager.colors.inputBorder, backgroundColor: "transparent" }
                        ]}
                      >
                        <InputCustom
                          value={this.state.amount}
                          onChangeText={(val: any) => {
                            this.onChangeAmount(val);
                          }}
                          placeHolder={sendTrx.enterAmount}
                          placeholderColor={Colors.placeholderColor}
                          keyboardType="decimal-pad"
                          maxLength={15}
                          customInputStyle={[
                            styles.ViewStyle4,
                            { color: ThemeManager.colors.settingsText },
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
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.fiatStyle,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          ≈ {Singleton.getInstance().CurrencySymbol}
                          {this.state.valueInUSD}
                        </Text>
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
                            {this.getValue(this.state.selectedCoin?.balance)}{" "}
                            {this.state.selectedCoin.coin_symbol.toUpperCase()}
                          </Text>
                        </Text>
                      </View>

                    </View>
                  </View>

                  {/* ------------------------------------------------------------------- */}
                  {this.state.btcFeeObj && (
                    <View style={(styles as any).coinInfo /* BUG PRESERVED: styles.coinInfo does not exist in SendBtcStyle */}>
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
                        <View style={{ justifyContent: "space-between" }}>
                          <LinearGradient
                            style={[
                              styles.feeView,
                              {
                                borderColor:
                                  this.state.selectedFeeType == 1
                                    ? ThemeManager.colors.primaryColor
                                    : ThemeManager.colors.nmemonicsInputColor,
                                backgroundColor:
                                  this.state.selectedFeeType == 1
                                    ? ThemeManager.colors.grayBlackNew
                                    : ThemeManager.colors.nmemonicsInputColor,
                                marginTop: 15,
                              },
                            ]}
                            colors={["#101010", "#18171F"]}
                          >
                            <TouchableOpacity
                              onPress={() => this.onClickAction("slow")}
                              style={{ paddingVertical: 10,    paddingHorizontal: 20,
 }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  color:
                                    this.state.selectedFeeType == 1
                                      ? ThemeManager.colors.TextColor
                                      : ThemeManager.colors.blackWhiteText,
                                  fontSize: 14,
                                  fontFamily: Fonts.dmMedium,
                                }}
                              >
                                {sendTrx.slow}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 5,
                                }}
                              >
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 1
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhiteText,
                                    },
                                  ]}
                                >
                                  {this.state.btcFeeObj.regular
                                    ? this.state.btcFeeObj.regular
                                    : 0}{" "}
                                  sat/byte{" "}
                                </Text>
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 1
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhiteText,
                                    },
                                  ]}
                                >
                                  {this.convertSatoshiToUsd(
                                    this.state.btcFeeObj.regular
                                  )}{" "}
                                  {Singleton.getInstance().CurrencySelected}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>

                          <LinearGradient
                            style={[
                              styles.feeView,
                              {
                                borderColor:
                                  this.state.selectedFeeType == 2
                                    ? ThemeManager.colors.primaryColor
                                    : ThemeManager.colors.nmemonicsInputColor,
                                backgroundColor:
                                  this.state.selectedFeeType == 2
                                    ? ThemeManager.colors.grayBlackNew
                                    : ThemeManager.colors.nmemonicsInputColor,
                              },
                            ]}
                            colors={["#101010", "#18171F"]}
                          >
                            <TouchableOpacity
                              onPress={() => this.onClickAction("average")}
                              style={{ paddingVertical: 10 ,    paddingHorizontal: 20,
}}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  color:
                                    this.state.selectedFeeType == 2
                                      ? ThemeManager.colors.TextColor
                                      : ThemeManager.colors.blackWhiteText,
                                  marginTop: 5,
                                  fontSize: 14,
                                  fontFamily: Fonts.dmMedium,
                                }}
                              >
                                {sendTrx.Average}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 5,
                                }}
                              >
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 2
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhiteText,
                                    },
                                  ]}
                                >
                                  {this.state.btcFeeObj.priority
                                    ? this.state.btcFeeObj.priority
                                    : 0}{" "}
                                  sat/byte{" "}
                                </Text>
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 2
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhitePure,
                                    },
                                  ]}
                                >
                                  {this.convertSatoshiToUsd(
                                    this.state.btcFeeObj.priority
                                  )}{" "}
                                  {Singleton.getInstance().CurrencySelected}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>

                          <LinearGradient
                            style={[
                              styles.feeView,
                              {
                                borderColor:
                                  this.state.selectedFeeType == 3
                                    ? ThemeManager.colors.primaryColor
                                    : ThemeManager.colors.nmemonicsInputColor,
                                backgroundColor:
                                  this.state.selectedFeeType == 3
                                    ? ThemeManager.colors.grayBlackNew
                                    : ThemeManager.colors.nmemonicsInputColor,
                              },
                            ]}
                            colors={["#101010", "#18171F"]}
                          >
                            <TouchableOpacity
                              onPress={() => this.onClickAction("high")}
                              style={{ paddingVertical: 10 ,    paddingHorizontal: 20,
}}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  color:
                                    this.state.selectedFeeType == 3
                                      ? ThemeManager.colors.TextColor
                                      : ThemeManager.colors.blackWhiteText,
                                  marginTop: 5,
                                  fontSize: 14,
                                  fontFamily: Fonts.dmMedium,
                                }}
                              >
                                {sendTrx.Fast}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 5,
                                }}
                              >
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 3
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhiteText,
                                    },
                                  ]}
                                >
                                  {this.state.btcFeeObj.limits.max
                                    ? this.state.btcFeeObj.limits.max
                                    : 0}{" "}
                                  sat/byte{" "}
                                </Text>
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.TextStyle2,
                                    {
                                      color:
                                        this.state.selectedFeeType == 3
                                          ? ThemeManager.colors.primaryColor
                                          : ThemeManager.colors.blackWhiteText,
                                    },
                                  ]}
                                >
                                  {this.convertSatoshiToUsd(
                                    this.state.btcFeeObj.limits.max
                                  )}{" "}
                                  {Singleton.getInstance().CurrencySelected}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </LinearGradient>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </KeyboardAwareScrollView>

            <View style={styles.ViewStyle8}>
              <Button
                onPress={() => {
                  if (validateBTCAddress(this.state.toAddress)) { //CHAIN ABSTRACTION
                    return this.sendTransaction();
                  } else
                    this.setState({
                      showAlertDialog: true,
                      alertTxt: alertMessages.enterValidBTCaddress,
                    });
                }}
                myStyle={{ marginBottom: heightDimen(50) }}
                buttontext={sendTrx.SEND}
              />
            </View>



            {this.state.showAddressBookModal && <ContactsBook
              handleBack={() => this.setState({ showAddressBookModal: false })}
              showAddressBookModal={this.state.showAddressBookModal}
              newObj={this.state.newObj}
              getAddress={this.getAddress}
              address={Singleton.getInstance().defaultBtcAddress}
              coin_family={3}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
              onPressView={(item: any) => {
                this.setState({ showAddressBookModal: false, showContactlModal: true, selectedItem: item });
                consoleLogFunc('here==', item);
              }}
              addbook={() => {
                this.setState({ showAddressBookModal: false })
                Actions.currentScene != 'AddContact' && (Actions as any).AddContact({ themeSelected: this.props.themeSelected, });
              }}
              navigation={this.props.navigation}
            />}

            {this.state.showContactlModal && <AddressModal
              selected_Index={this.state.selected_Index}
              onPressItem={(item: any, index: any) => this.onPressItem(item, index)}
              dismiss={() => this.setState({ showContactlModal: false })}
              item={this.state.selectedItem}
              openModel={this.state.showContactlModal}
            />}






            {/* --------------------------------ConfirmTxnModal----------------------------------- */}
            <ConfirmTxnModal
              handleBack={() => this.setState({ showConfirmModal: false })}
              showConfirmTxnModal={this.state.showConfirmModal}
              newObj={this.state.newObj}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
            />

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
                  style={{ backgroundColor: ThemeManager.colors.mainBgNew, flex: 1, marginTop: -5 }}
                >
                  <QRCodeScannerNew
                    cameraStyle={styles.cameraStyle}
                    onRead={(event: any) => {
                      const address = event.data;
                      let newAddress = ''
                      if (address.includes(':')) {
                        let address1 = address.split(':')
                        newAddress = address1[1];
                        if (newAddress.includes('?')) {
                          let address1 = newAddress.split('?')
                          newAddress = address1[0];
                        }
                      }
                      else {
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
                    <Text allowFontScaling={false} style={[styles.txtCancel, , { color: ThemeManager.colors.blackWhiteText }]}>
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

const mapStateToProp = (state: any) => {
  const { gasPriceList } = state.sendCoinReducer;
  return { gasPriceList };
};

export default connect(mapStateToProp, {
  requestUnspent,
  requestSendCoin,
  requestBTCgasprice,
})(SendBtc);
