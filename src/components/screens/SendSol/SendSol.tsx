/* eslint-disable react-native/no-inline-styles */
import Clipboard from "@react-native-clipboard/clipboard";
import { Component } from "react";
import { BackHandler, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { EventRegister } from "react-native-event-listeners";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  saveSolTransactionId
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Colors, Fonts } from "../../../theme";
import { heightDimen } from "../../../Utils";
import {
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixedExp
} from "../../../Utils/MethodsUtils";
import { sendSOLANA, sendTokenSOLANA, validateSolanaAddress } from "../../../Utils/SolUtils";
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
import styles from "./SendSolStyle";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();



class SendSol extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      newObj: "",
      showConfirmModal: false,
      toAddress: "",
      selectedCoin: this.props.selectedCoin,
      isLoading: false,
      amount: "",
      isVisible: false,
      valueInUSD: 0,
      bioMetricMode: false,
      showAlertDialog: false,
      alertTxt: "",
      PinModal: false,
      isButtonDisabled: false,
      showAddressBookModal: false,
      showContactlModal: false,
      isReqSent: false,
      walletName: '',
      minimumToSend: 0.001,
      reserveAmount: 0.002,
      transactionFee: 0.00005,
    };
  }



  /******************************************************************************************/
  async componentDidMount() {

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
  }

  componentWillUnmount() {
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
      // BUG PRESERVED: getTouchIDItem requires an argument but is called with none
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
  onPinSuccess(pin: any) {
    this.setState({ PinModal: false });
    this.setState({ showConfirmModal: false });
    setTimeout(() => {
      this.state.selectedCoin.is_token == 0 ?
        this.sendSol(pin) :
        this.sendSolToken(pin);

    }, 1000);
  }

  /******************************************************************************************/
  async sendSol(pin: any) {
    this.setState({ isLoading: true });
    getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then((res) => {
      consoleLogFunc("res getEncryptedData", res);
      let mnemonics = res
      sendSOLANA(this.state.toAddress, this.state.amount, mnemonics)
        .then((res) => {
          consoleLogFunc("res sendSOLANA", res);
          this.saveSolTransaction("sol", res)
        })
        .catch((err) => {
          this.setState({ isLoading: false });
          consoleLogFunc("err sendSOLANA", err);
        })
    })
  }
  async sendSolToken(pin: any) {
    this.setState({ isLoading: true });

    getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then((res) => {
      consoleLogFunc("res getEncryptedData--->", res);
      let amount = exponentialToDecimal(this.state.amount * this.state.selectedCoin?.decimals)
            consoleLogFunc("res amount--->", amount);

      if (amount.toString().includes(".")) {
        amount = amount.toString().split(".")[0]
      }
      let mnemonics = res

      sendTokenSOLANA(this.state.toAddress, amount, mnemonics, this.state.selectedCoin?.token_address, this.state.selectedCoin?.decimals)
        .then((res) => {
          consoleLogFunc("res sendSOLANA", res);
          this.saveSolTransaction(this.state.selectedCoin?.token_address, res)
        })
        .catch((err) => {
          consoleLogFunc("err sendSOLANA", err);
          this.setState({ isLoading: false, showAlertDialog: true, alertTxt: err?.message || "Transaction failed. Please try again." });
        })
    })
  }

  /**
   * Saves the transaction ID for a Solana transaction.
   * This function should be called after a successful transaction
   * to record the transaction ID for future reference or verification.
   */
  saveSolTransaction(coin: any, transactionId: any) {
    let data = {
      amount: this.state.amount,
      gas_price: 0.000005,
      from: Singleton.getInstance().defaultSolAddress,
      txid: transactionId,
      to: this.state.toAddress,
      tx_type: "Withdraw",
      tx_status: "Complete"
    }
    this.props.saveSolTransactionId(coin, data)
      .then((res: any) => {
        consoleLogFunc("res saveSolTransactionId", res);
        (Actions as any).TransactionHistory({ type: ActionConst.REPLACE, selectedCoin: this.state.selectedCoin });
        this.setState({ isLoading: false });
      })
      .catch((err: any) => {
        consoleLogFunc("err saveSolTransactionId", err);
        this.setState({ isLoading: false });

      })
  }

  /******************************************************************************************/
  async sendTransaction() {
    const { alertMessages } = LanguageManager;
    if (this.state.toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (
      this.state.toAddress.toLowerCase() ==
      Singleton.getInstance().defaultSolAddress.toLowerCase()
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
      parseFloat(toFixedExp(this.state.selectedCoin.balance, 9))
    ) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    }
    else if (this.state.selectedCoin.is_token == 0 && parseFloat(this.state.amount) < (this.state.minimumToSend)) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: `Minimum amount to send is ${toFixedExp(this.state.minimumToSend, 6)} SOL`,
      });
    }
    else if (this.state.selectedCoin.is_token == 0 && parseFloat(this.state.selectedCoin.balance) - (parseFloat(this.state.amount) + this.state.transactionFee) < this.state.reserveAmount) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: `Have to maintain minimum balance of ${toFixedExp(this.state.reserveAmount + this.state.transactionFee, 6)} SOL`,
      });
    } else {
      const totalFee = this.state.transactionFee
      const newObj = {
        valueInUSD: this.state.valueInUSD,
        amount: this.state.amount,
        totalFee: totalFee,
        nativePrice: this.state.selectedCoin.currentPriceInMarket,
        toAddress: this.state.toAddress,
        fromAddress: Singleton.getInstance().defaultSolAddress,
        feeSymbol: "SOL",
        fiatAmount: toFixedExp(
          parseFloat(this.state.amount) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
        fiatCoin: toFixedExp(
          parseFloat(totalFee) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
      };
      consoleLogFunc("newObj", newObj);
      this.setState({ showConfirmModal: true, newObj: newObj });
    }
  }



  onPressAddressBook() {
    this.setState({ showAddressBookModal: true })
  }






  /******************************************************************************************/
  onMaxClicked() {
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
        this.setState({ amount: val });
        this.showActualAmount(val);
      }
    }
  }


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
                          disabled={this.state.isButtonDisabled}
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


                  {/* BUG PRESERVED: styles.coinInfo does not exist */}
                  <View style={(styles as any).coinInfo}>
                    <View style={styles.ViewStyle6}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.TextStyle1,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}
                      >
                        {sendTrx.transactionFee} {"(SOL)"}

                      </Text>


                      <InputCustom
                        editable={false}
                        value={this.state.transactionFee?.toString()}
                        placeHolder="0.00"
                        placeholderColor={Colors.placeholderColor}
                        keyboardType="decimal-pad"
                        customInputStyle={[
                          styles.ViewStyle7,
                          { color: ThemeManager.colors.TextColor, backgroundColor: "transparent", },
                        ]}
                        placeholderTextColor={ThemeManager.colors.TextColor}
                      />

                    </View>
                  </View>

                </View>
              </View>
            </KeyboardAwareScrollView>

            <View style={styles.ViewStyle8}>
              <Button
                onPress={() => {
                  // need to add check here for empty address
                  if (this.state.toAddress.trim().length == 0){
                    return this.setState({
                      showAlertDialog: true,
                      alertTxt: alertMessages.pleaseEnterWalletAddress,
                    });
                  }
                    
                  if (validateSolanaAddress(this.state.toAddress)) {
                    return this.sendTransaction();
                  } else
                    this.setState({
                      showAlertDialog: true,
                      alertTxt: alertMessages.enterValidSolAddress,
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
              coin_family={5}
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
  saveSolTransactionId
})(SendSol);
