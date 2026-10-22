import { Component } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from 'react-native-event-listeners';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { Images } from '../../../theme/';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import { consoleLogFunc, getData, getEncryptedData } from '../../../Utils/MethodsUtils';
import { AppAlert, OnboardingHeadings } from '../../common';
import SecretCodeInput from '../../subcommon/molecules/secretCodeInput';
import styles from './EnterPinForTransactionStyle';

const DATA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'];
const rnBiometrics = new ReactNativeBiometrics();

class EnterPinForTransaction extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      code: "",
      showAlertDialog: false,
      alertTxt: "",
      secretTxt: [false, false, false, false, false, false],
    };
  }

  //******************************************************************************************/
  componentDidMount() {
    this.setState({ code: "" });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: "",
        secretTxt: [false, false, false, false, false, false],
      });
    });
    if (this.props.checkBiometric) {
      getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
        consoleLogFunc("bio_mode>>>", bio_mode);

        if (bio_mode == "true") {
          setTimeout(()=>{
            this.checkBiometricAvailabilty();
          },1000)
        }
      });
    }
  }

  //******************************************************************************************/
  componentWillUnmount() {
    // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
    (BackHandler as any)?.removeEventListener();
    if (this.backhandle) this.backhandle.remove();
  }

  //******************************************************************************************/
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

  //******************************************************************************************/
  bimetricPrompt() {
    try {
      (Singleton.getInstance() as any)
        .getTouchIDItem()
        .then((res: any) => {
          this.props.closeEnterPin(res);
        })
        .catch((err: any) => {});
    } catch (e) {
      consoleLogFunc("Device not Support Fingerprint");
    }
  }

  //******************************************************************************************/
  didSelect(item: any) {
    this.timeout && clearTimeout(this.timeout);
    this.setState({ itemPressed: item });
    this.timeout = setTimeout(() => {
      this.setState({ itemPressed: "" });
    }, 200);

    if (item == "d") {
    } else if (item == "Forgot?") {
    } else if (item == "Del") {
      let pin = this.state.code;
      let newPin = pin.slice(0, -1);

      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[pin.length - 1] = false;
      this.setState({
        code: newPin,
        itemPressed: newPin.length == 0 ? null : item,
        secretTxt: updatedCircleStates,
      });
    } else {
      let pin = this.state.code;
      pin = pin + item;
      const newCircleStates = [...this.state.secretTxt];
      newCircleStates[this.state.secretTxt.indexOf(false)] = true;
      if (pin.length <= 6) {
        this.setState({
          code: pin,
          secretTxt: newCircleStates,
        });
      }
      if (pin.length >= 6) {
        this.continuePressed(pin);
      }
    }
  }

  //******************************************************************************************/
  continuePressed(enteredPin: any) {
    getEncryptedData(Constants.PIN_LOCK, enteredPin)
      .then((value) => {
        if (enteredPin == value) this.props.closeEnterPin(enteredPin);
        else {
          this.setState({ code: "" });
          this.setState({
            showAlertDialog: true,
            alertTxt: LanguageManager.alertMessages.wrongPIN,
            secretTxt: [false, false, false, false, false, false],
          });
        }
      })
      .catch(() => {
        this.setState({ code: "" });
        this.setState({
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.wrongPIN,
          secretTxt: [false, false, false, false, false, false],
        });
      });
  }

  //******************************************************************************************/
  render() {
    const { pins } = LanguageManager;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <ScrollView 
        contentContainerStyle={{ flexGrow: 1}}
        bounces={false}
        showsVerticalScrollIndicator={false}>
          <View style={[styles.wrap]}>
            <View style={styles.subHeaderStyle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  style={styles.touchStyle}
                  onPress={() => {
                    this.props.onBackClick();
                  }}
                >
                  <Image
                    source={Images.arrowLeft}
                    style={{ tintColor: ThemeManager.colors.blackWhiteText }}
                  />
                </TouchableOpacity>

                <View style={{ width: 10, height: 10 }}></View>
              </View>
            </View>

            <View style={{ marginTop: heightDimen(30) }}>
              <OnboardingHeadings
                title={
                  (this.props?.title ? this.props?.title + " " : "") +
                  pins.confirmSecretCode
                }
                subTitle={
                  pins.please +
                  " " +
                  (this.props?.subtitle ? this.props?.subtitle + " " : "") +
                  pins.enterYourDigitCode
                }
              />
            </View>

            <View
              style={{
                flex: 0.6,
                paddingHorizontal: widthDimen(11),
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
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {
                  return index == 9 ? (
                    <View style={styles.listStyle} />
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
                            height: getDimensionPercentage(20),
                            width: getDimensionPercentage(28),
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
          <AppAlert
            visible={this.state.showAlertDialog}
            alertTxt={this.state.alertTxt}
            hideAlertDialog={() => {
              this.setState({ showAlertDialog: false });
            }}
          />
        </ScrollView>
      </BackgroundImage>
    );
  }
}

export default EnterPinForTransaction;
