/* eslint-disable react-native/no-inline-styles */
import { Component } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from "react-native-event-listeners";
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  sendCosmosAddress,
} from "../../../Redux/Actions";
import { store } from "../../../Redux/Reducers";
import Singleton from "../../../Singleton";
import { getDimensionPercentage, resetPinAttempts, updatePinState, widthDimen } from "../../../Utils";
import {
  clearStorage,
  consoleLogFunc,
  getData,
  getEncryptedData,
  saveData,
} from "../../../Utils/MethodsUtils";
import { createAddressFromMnemonic } from "../../../Utils/MnemonicsUtilsCosmos";
import { AppAlert, LoaderView, OnboardingHeadings } from "../../common";
import { ConfirmAlert } from "../../common/ConfirmAlert";
import SecretCodeInput from "../../subcommon/molecules/secretCodeInput";
import styles from "./EnterPinStyle";
import { getAccessToken, loginWithCosmosWallet } from "../../Api/VPN/api/authWithCosmosWallet";
import { signCosmosMessage } from "../../../Utils/MnemonicsUtils";

const DATA = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "Del"];
const rnBiometrics = new ReactNativeBiometrics();

class EnterPin extends Component<any, any> {
  [key: string]: any;
  state: any = {
    myPin: "",
    showAlertDialog: false,
    alertTxt: "",
    themeSelected: "",
    showAlertDialogConfirm: false,
    alertTxtConfirm: "",
    isLoading: false,
    secretTxt: [false, false, false, false, false, false],
  };

  /******************************************************************************************/
  async componentDidMount() {
    consoleLogFunc("🔐 ENTER PIN ==>");
    this.setState({ myPin: "" });
    Singleton?.getInstance()?.isNewerVersion1();
    EventRegister.addEventListener("getThemeChanged", (data) => {
      consoleLogFunc("chk theme status enter pin:::::", data);
      this.setState({ themeSelected: data });
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialogConfirm: false,
        alertTxtConfirm: "",
        showAlertDialog: false,
        alertTxt: "",
        secretTxt: [false, false, false, false, false, false],
        myPin: "",
      });
    });
    Keyboard.dismiss();
    const SELECTED_CURRENCY = await getData(Constants.SELECTED_CURRENCY);
    const SELECTED_SYMBOL = await getData(Constants.SELECTED_SYMBOL);
    Singleton.getInstance().CurrencySymbol = SELECTED_SYMBOL;
    Singleton.getInstance().CurrencySelected = SELECTED_CURRENCY;
    getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
      if (bio_mode != "false") this.checkBiometricAvailabilty();
    });
    this.backhandle = BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.backhandle = BackHandler.addEventListener(
        "hardwareBackPress",
        this.handleBackButtonClick
      );
      this.setState({ myPin: "", secretTxt: [false, false, false, false, false, false] });
      getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
        consoleLogFunc("chk theme status enter pin focus:::::", theme);
        this.setState({ themeSelected: theme });
      });
      EventRegister.emit("enableTouchable", true);
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      consoleLogFunc("chk blur enter pin:::::");
      if (this.backhandle) this.backhandle?.remove();
    });
  }
  /******************************************************************************************/
  componentWillUnmount() {
    this.setState({ myPin: "" });
    if (this.backhandle) this.backhandle?.remove();
    if (typeof this.focusListener === 'function') this.focusListener();
    if (typeof this.blurListener === 'function') this.blurListener();
  }

  /******************************************************************************************/
  handleBackButtonClick() {
    return true;
  }

  /* *********************************************checkBiometricAvailabilty***************************************** */
  checkBiometricAvailabilty() {
    consoleLogFunc("🔐 checkBiometricAvailabilty ==>");
    rnBiometrics.isSensorAvailable().then((resultObject) => {
      consoleLogFunc("🔐 checkBiometricAvailabilty resultObject ==>", resultObject);
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

  bimetricPrompt() {
    try {
      (Singleton.getInstance() as any)
        .getTouchIDItem()
        .then((res: any) => {
          setTimeout(() => {
            Keyboard.dismiss();
          }, 500);
          Singleton.isCameraOpen = false;
          consoleLogFunc("successful biometrics provided");
          if (res) {
            consoleLogFunc("successful biometrics provided");
            this.generateCosmosAddress(res);
            this.postRefreshToken();
          } else {
            consoleLogFunc("user cancelled biometric prompt");
          }
        })
        .catch((err: any) => {
          Singleton.isCameraOpen = false;
          consoleLogFunc("biometrics failed or cancelled", err);
        });
    } catch (e) {
      Singleton.isCameraOpen = false;
      consoleLogFunc("Device not Support Fingerprint");
    }
  }

  /* *********************************************cosmos Address***************************************** */
  generateCosmosAddress(pin: any) {
    let cosmos_obj;
    getData(Constants.COSMOS_ADDRESS).then(async (address) => {
      consoleLogFunc("biometrics--address", address);

      if (address == undefined || address == null || address?.length == 0) {
        getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then(
          async (response) => {
            let mnemonics = response;
            cosmos_obj = await createAddressFromMnemonic(mnemonics);
            let cosmos_address = cosmos_obj?.address;
            this.checkIsDVPNCreated(cosmos_address, pin)
            saveData(Constants.COSMOS_ADDRESS, cosmos_address);
            Singleton.getInstance().defaultCosmosAddress = cosmos_obj?.address;
            let data = {
              evmWalletAddress: Singleton.getInstance().defaultTicsAddress,
              nativeWalletAddress: cosmos_address,
            };
            const apiRes = await store.dispatch(sendCosmosAddress(data));
            consoleLogFunc("biometrics--apiRes", apiRes);
          }
        );
      }
      else {
        Singleton.getInstance().defaultCosmosAddress = address;
        this.checkIsDVPNCreated(address, pin)
      }
    });
  }

  checkIsDVPNCreated(address: any, pin: any,) {
    try {
      getAccessToken(address).then((token) => {
        if (token == null || token == undefined || token == "") {
          getEncryptedData(address, pin).then(
            async (mnemonics) => {
              const { pubKey, signature } = await signCosmosMessage(
                mnemonics?.toLowerCase()?.trim(),
                address,
                address,
              );
              try {
                await loginWithCosmosWallet({
                  wallet_address: address,
                  pubKey: pubKey,
                  signatureBase64: signature,
                });
              } catch (err) {
                console.error('Login error:', err);

              }
            }
          );
        }
      });
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  /* *********************************************didSelect***************************************** */
  didSelect(item: any) {
    this.timeout && clearTimeout(this.timeout);
    this.setState({ itemPressed: item });
    this.timeout = setTimeout(() => {
      this.setState({ itemPressed: "" });
    }, 200);

    if (item == "d") {
    } else if (item == "Forgot?") {
    } else if (item == "Del") {
      let pin = this.state.myPin;
      let newPin = pin.slice(0, -1);
      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[pin.length - 1] = false;

      this.setState({
        myPin: newPin,
        itemPressed: newPin.length == 0 ? null : item,
        secretTxt: updatedCircleStates,
      });
    } else {
      let pin = this.state.myPin;
      pin = pin + item;
      const newCircleStates = [...this.state.secretTxt];
      newCircleStates[this.state.secretTxt.indexOf(false)] = true;
      this.setState({
        showButton: pin.length == 6 ? true : false,
        myPin: pin,
        secretTxt: newCircleStates,
      });
      if (pin.length == 6) {
        getEncryptedData(Constants.PIN_LOCK, pin)
          .then((value) => {
            if (pin == value) {
              this.postRefreshToken();
              this.generateCosmosAddress(pin);
              resetPinAttempts()
            } else {
              this.handleWrongPinAttempt(newCircleStates)
            }
          })
          .catch((err) => {
            consoleLogFunc("ERR>", err)
            this.handleWrongPinAttempt(newCircleStates)
          });
      }
    }
  }

  handleWrongPinAttempt = (..._args: any[]) => {

    consoleLogFunc("handleWrongPinAttempt")

    updatePinState().then((res) => {
      this.setState({
        myPin: "",
        showAlertDialog: true,
        alertTxt: `Wrong PIN ${res?.attemptsLeft} attempts left`,
        secretTxt: [false, false, false, false, false, false],
      });

      if (res?.status === 'updated') {
        EventRegister.emit('pinAttempt')
      }


    })
  }

  /* *********************************************postRefreshToken***************************************** */
  async postRefreshToken() {
    let myReferralCode = "";
    await getData(Constants.LOGIN_DATA).then(async (res) => {
      consoleLogFunc(
        "postRefreshToken res ------",
        res,
        Singleton.getInstance().unique_id
      );
      let response;
      if (res) {
        response = JSON.parse(res);
      } else {
        console.error("postRefreshToken JSON parse err -----");
        this.setState({
          showAlertDialogConfirm: true,
          alertTxtConfirm: "Something went wrong, please try again later",
        });
        return;
      }
      Singleton.getInstance().defaultEthAddress =
        response?.defaultEthAddress || response?.defaultBnbAddress;
      Singleton.getInstance().defaultMaticAddress =
        response.defaultMaticAddress;
      Singleton.getInstance().defaultSolAddress = response.defaultSolAddress;
      Singleton.getInstance().defaultBnbAddress = response.defaultBnbAddress;
      Singleton.getInstance().defaultBtcAddress = response.defaultBtcAddress;
      Singleton.getInstance().defaultTrxAddress = response.defaultTrxAddress;
      Singleton.getInstance().defaultTicsAddress = response?.defaultEthAddress || response?.defaultBnbAddress;
      if (response?.defaultCosmosAddress) {
        Singleton.getInstance().defaultCosmosAddress = response?.defaultCosmosAddress;
      }
      Singleton.getInstance().walletName = response.walletName;
      Singleton.getInstance().refCode = response.refCode;
      myReferralCode = response.refCode;
    });
    if ((global as any).isForgot) {
      (global as any).isForgot = false;
      consoleLogFunc("Actions postRefreshToken  isForgot");
      (Actions as any).Main({ type: ActionConst.RESET });
    } else {
      (global as any).isForgot = false;
      if ((global as any).notify) {
        (Actions as any).currentScene != "NotificationsTab" &&
          (Actions as any).NotificationsTab({ themeSelected: this.state.themeSelected });
      } else {
        if (this.props?.from == "welcome") {
          (Actions as any).Main({ type: "reset" });
        } else {
          consoleLogFunc("Actions postRefreshToken poping", this.props?.from);
          consoleLogFunc("Navigation Stack State:", JSON.stringify(this.props.navigation.getState()));
          if (this.props.navigation.canGoBack()) {
            (Actions as any).pop();
          } else {
            consoleLogFunc("Cannot pop, resetting to Main");
            (Actions as any).Main({ type: "reset" });
          }
          if ((global as any).wcTxnPopup) {
            Singleton.getInstance()?.walletConnectRef?.showTransactionRequest(
              true,
              (global as any).wcTxnData
            );
          }
        }
      }
    }
    if (
      (global as any).isRefLink == true &&
      Singleton.getInstance().userRefCode != myReferralCode
    ) {
      return Singleton.getInstance().updateRefModal.showRefModal();
    } else if ((global as any).showErr == true) {
      Singleton.getInstance().updateRefModal?.hideRefModal();
      Singleton.getInstance().updateAlertModal?.showCustom_Alert();
      return;
    }
  }

  /* *********************************************logout***************************************** */
  logout() {
    this.setState({ showAlertDialogConfirm: false, isLoading: true });
    setTimeout(() => {
      getData(Constants.DEVICE_TOKEN).then((device_token) => {
        let data = {
          deviceToken: device_token,
        };
        clearStorage();
        saveData(Constants.DEVICE_TOKEN, data.deviceToken);
      });
    }, 150);
  }

  render() {
    const { alertMessages, pins } =
      LanguageManager;
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <BackgroundImage
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
          <View style={[styles.wrap, { paddingHorizontal: widthDimen(20) }]}>
            <View style={[styles.subHeaderStyle]}>
              <OnboardingHeadings
                title={(this.props?.title || "") + " " + pins.confirmSecretCode}
                subTitle={pins.pleaseEnterYourDigitCode}
              />
            </View>

            <View
              style={{
                flex: 0.4
              }}
            >
              <SecretCodeInput {...({ secretTxt: this.state.secretTxt } as any)} />
            </View>

            <View style={[styles.pin_wrap]}>
              <FlatList
                data={DATA}
                numColumns={3}
                bounces={false}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                keyExtractor={(item, index) => index + ""}
                renderItem={({ item, index }) => {
                  return index == 9 ? (
                    <View style={styles.listStyle}>
                      <Text
                        style={{
                          ...styles.pinBlockTextStyle,
                          color: ThemeManager.colors.blackWhiteText,
                        }}
                      ></Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.pinBlockStyle}
                      onPress={this.didSelect.bind(this, item)}
                    >
                      {item === "Del" ? (
                        <Image
                          source={ThemeManager.ImageIcons.deleteIconNew}
                          resizeMode={"contain"}
                          style={{
                            height: getDimensionPercentage(24),
                            width: getDimensionPercentage(32),
                          }}
                        />
                      ) : (
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.pinBlockTextStyle,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {item}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </BackgroundImage>

        {/* -------------------------------------------------------- */}
        {this.state.showAlertDialogConfirm && (
          <ConfirmAlert
            {...({} as any)}
            text={alertMessages.Ok}
            alertTxt={this.state.alertTxtConfirm}
            hideAlertDialog={() => {
              this.setState({ showAlertDialogConfirm: false });
            }}
            ConfirmAlertDialog={() => {
              this.logout();
            }}
          />
        )}

        {/* -------------------------------------------------------- */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false, myPin: "", secretTxt: [false, false, false, false, false, false] });
          }}
        />
        <LoaderView isLoading={this.state.isLoading} />
      </ScrollView>
    );
  }
}

export default connect(null)(EnterPin);
