/* eslint-disable react-native/no-inline-styles */
import { Component } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import { widthDimen } from "../../../Utils";
import { consoleLogFunc, getData, getEncryptedData } from "../../../Utils/MethodsUtils";
import { AppAlert, HeaderMain, OnboardingHeadings } from "../../common";
import styles from "./EnterPinSecurityStyle";

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import Singleton from "../../../Singleton";
import {
  getDimensionPercentage as dimen,
  heightDimen
} from "../../../Utils";
import SecretCodeInput from "../../subcommon/molecules/secretCodeInput";

const DATA = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "Del"];
const rnBiometrics = new ReactNativeBiometrics();

class EnterPinSecurity extends Component<any, any> {
  [key: string]: any;
  state: any = {
    myPin: "",
    showAlertDialog: false,
    alertTxt: "",
    themeSelected: "",
    multiWallet: [],
    secretTxt: [false, false, false, false, false, false],
  };

  /******************************************************************************************/
  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        myPin: "",
        showAlertDialog: false,
        alertTxt: "",
        secretTxt: [false, false, false, false, false, false],
      });
    });

    getData(Constants.BIOMETRIC_MODE).then(bio_mode => {
      if (bio_mode != 'false') this.checkBiometricAvailabilty();
    });
    this.focusListener = this.props.navigation.addListener('focus', () => {
      getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
        this.setState({ themeSelected: theme });
      });
      getData(Constants.MULTI_WALLET_LIST).then((multiWalletArray) => {
        this.setState({ multiWallet: JSON.parse(multiWalletArray) });
      });
      this.backhandle = BackHandler.addEventListener(
        "hardwareBackPress",
        this.handleBackButtonClick
      );
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      if (this.backhandle) this.backhandle.remove();
    });
    EventRegister.addEventListener("getThemeChanged", (data) => {
      this.setState({ themeSelected: data });
    });
  }

  /******************************************************************************************/
  componentWillUnmount() {
    // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
    (BackHandler as any)?.removeEventListener();
    if (this.backhandle) this.backhandle.remove();
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
    if (this.blurListener) (typeof this.blurListener === 'function' ? this.blurListener() : this.blurListener?.remove?.());
  }

  /******************************************************************************************/
  handleBackButtonClick() {
    (Actions as any).pop();
    return true;
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
        this.continuePressed(res)
      }).catch((err: any) => {
      })
    } catch (e) {
      consoleLogFunc("Device not Support Fingerprint");
    }
  }

  /******************************************************************************************/
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
      const newPin = pin.slice(0, -1);
      const updatePin = pin;

      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[updatePin.length - 1] = false;
      this.setState({
        myPin: newPin,
        itemPressed: newPin.length == 0 ? null : item,
        secretTxt: updatedCircleStates,
      });
    } else {
      let pin = this.state.myPin;
      pin = pin + item;
      if (pin.length <= 6) {
        const newCircleStates = [...this.state.secretTxt];
        newCircleStates[this.state.secretTxt.indexOf(false)] = true;
        pin.length == 6 ? this.continuePressed(pin) : null;
        this.setState({
          myPin: pin,
          secretTxt: newCircleStates,
        });
        this.setState({
          myPin: pin,
        });
      }
    }
  }

  returnPinByProps(enteredPin: any) {
    if (Singleton.getInstance().walletPinCallback) {
      Singleton.getInstance().walletPinCallback(enteredPin);
      Singleton.getInstance().walletPinCallback = null;
    } else {
      this.props?.walletPin?.(enteredPin)
    }
    (Actions as any).pop()
  }


  /******************************************************************************************/
  continuePressed(enteredPin: any) {
    getEncryptedData(Constants.PIN_LOCK, enteredPin).then((value) => {
      if (enteredPin == value) {
        this.props?.fromScreen != undefined &&
          (this.props?.fromScreen == "Security") ? this.returnPinByProps(enteredPin) :
          this.props?.fromScreen == "WalletManage"
            ? this.props.selectionType == "mnemonics"
              ? (Actions as any).replace("ShowRecoveryPhrase", {
                walletItem: this.props.walletItem,
                pin: enteredPin
              })
              : (Actions as any).replace("ExportPrivateKeys", {
                walletItem: this.props.walletItem,
                pin: enteredPin
              })
            : (Actions as any).replace("CreatePinSecurity", {
              themeSelected: this.state.themeSelected,
              fromScreen: 'enterPinSecurity',
              oldPin: enteredPin
            });
      } else {
        this.setState({
          myPin: "",
          secretTxt: [false, false, false, false, false, false],
        });
        this.setState({
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.wrongPIN,
          secretTxt: [false, false, false, false, false, false]
        });
      }
    })
      .catch(() => {
        this.setState({
          myPin: "",
          secretTxt: [false, false, false, false, false, false],
        });
        this.setState({
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.wrongPIN,
          secretTxt: [false, false, false, false, false, false]
        });
      });;
  }

  /******************************************************************************************/
  render() {
    const { pins } = LanguageManager;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >

        <HeaderMain />
        <View style={{
          flex: 1,
          paddingHorizontal: widthDimen(20),
          marginTop: heightDimen(30)
        }}>
          <OnboardingHeadings
            title={this.props?.fromScreen == "WalletManage" ? 'Confirm Code' : !!this.props?.walletPin ? 'Enter Secret Code' : this.props?.from == 'Security' ? LanguageManager.pins.confirmOldSecretCode : "Your Secret Code"} subTitle={pins.pleaseEnterYourDigitCode} />

          <View
            style={{
              flex: 0.4,
            }}
          >
            <SecretCodeInput {...({ secretTxt: this.state.secretTxt } as any)} />
          </View>
          <View style={[styles.pin_wrap]}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={DATA}
              numColumns={3}
              bounces={false}
              scrollEnabled={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => {
                return index == 9 ? (
                  <View style={styles.listStyle}>
                    <Text style={{ ...styles.pinBlockTextStyle, color: ThemeManager.colors.blackWhiteText }}>.</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pinBlockStyle}
                    onPress={this.didSelect.bind(this, item)}
                  >
                    {item === "Del" ? (
                      <Image source={ThemeManager.ImageIcons.deleteIconNew} resizeMode={'contain'} style={{ height: dimen(24), width: dimen(32) }} />
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
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
          }}
        />
      </BackgroundImage>
    );
  }
}

export default EnterPinSecurity;
