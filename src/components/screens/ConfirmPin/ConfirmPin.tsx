/* eslint-disable react-native/no-inline-styles */
import { BlurView } from '@react-native-community/blur';
import { Component } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from 'react-native-event-listeners';
import FastImage from 'react-native-fast-image';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { updateLanguage } from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Colors, Fonts, Images } from '../../../theme/';
import { getDimensionPercentage } from '../../../Utils';
import { consoleLogFunc, createPrivateKeyWalletLocal, createUserWalletLocal, getData, saveData, saveEncryptedData } from '../../../Utils/MethodsUtils';
import { AppAlert, HeaderMain, OnboardingHeadings } from '../../common';
import { CongratsModel } from '../../common/CongratsModel';
import SecretCodeInput from '../../subcommon/molecules/secretCodeInput';
import styles from './ConfirmPinStyle';

const DATA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'];
const rnBiometrics = new ReactNativeBiometrics();

class ConfirmPin extends Component<any, any> {
  timeout: any;
  // BUG PRESERVED: forgotPassword is never defined on this class; this.forgotPassword() throws TypeError
  forgotPassword: any;
  constructor(props: any) {
    super(props);
    this.state = {
      showAlertDialog: false,
      alertTxt: '',
      myPin: '',
      showCongrats: false,
      themeSelected: '',
      itemPressed: '',
      toggleStatus: false,
      showView: false,
      showLangModal: false,
      languageList: [],
      defaultCurrency: 'en',
      showREfModal: false,
      alreadyUsed: false,
      secretTxt: [false, false, false, false, false, false],
      disableCongratClick: false
    }
  }

  /******************************************************************************************/
  async componentDidMount() {
    consoleLogFunc("🔐 CONFIRM PIN ==>");
    this.setState({
      secretTxt: [false, false, false, false, false, false],
      showCongrats: false,
     
    });

    this.checkBiometricAvailabilty();

    const SELECTED_CURRENCY = await getData(Constants.SELECTED_CURRENCY);
    const SELECTED_SYMBOL = await getData(Constants.SELECTED_SYMBOL);
    Singleton.getInstance().CurrencySymbol = SELECTED_SYMBOL;
    Singleton.getInstance().CurrencySelected = SELECTED_CURRENCY;
    EventRegister.addEventListener('getThemeChanged', data => {
      this.setState({ themeSelected: data });
    })
  }
  /******************************************************************************************/
  checkBiometricAvailabilty() {
    rnBiometrics.isSensorAvailable().then(resultObject => {
      const { available, biometryType } = resultObject;
      if (available && biometryType === BiometryTypes.TouchID) {
        consoleLogFunc('TouchID is supported');
      } else if (available && biometryType === BiometryTypes.FaceID) {
        consoleLogFunc('FaceID is supported');
      } else if (available && biometryType === BiometryTypes.Biometrics) {
        consoleLogFunc('Biometrics is supported');
      } else {
        consoleLogFunc('Biometrics not supported');
      }
      consoleLogFunc('chk available:::::', available);
      this.setState({ showView: available ? true : false });
      saveData(Constants.BIOMETRIC_SUPPORTED, available ? 'true' : false);
      getData(Constants.BIOMETRIC_MODE).then(res => {
        consoleLogFunc('chk biometric mode:::::', res);
        this.setState({ toggleStatus: res == 'true' ? true : false });
      })
    });
  }

  /******************************************************************************************/
  pinMismatch = async () => {
    this.setState({
      secretTxt: [false, false, false, false, false, false]
    });
    this.showError(LanguageManager.alertMessages.enteredPINDoesNotMatch);
  };

  /******************************************************************************************/
  didSelect(item: any) {
    this.timeout && clearTimeout(this.timeout);
    this.setState({ itemPressed: item });
    this.timeout = setTimeout(() => {
      this.setState({ itemPressed: '' });
    }, 200);
    if (item == 'd') {
    } else if (item == 'Forgot?') {
      this.forgotPassword();
    } else if (item == 'Del') {
      let pin = this.state.myPin;
      let newPin = pin.slice(0, -1);
      const updatePin = pin;
      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[updatePin.length - 1] = false; // Mark the last circle as false
      this.setState({
        myPin: newPin,
        secretTxt: updatedCircleStates
      });
    } else {
      let pin = this.state.myPin;
      if (pin.length < 6) {
        pin = pin + item;
        const newCircleStates = [...this.state.secretTxt];
        newCircleStates[this.state.secretTxt.indexOf(false)] = true;
        this.setState({ myPin: pin, secretTxt: newCircleStates });
        pin.length == 6 && this.continuePressed()
      }
    }
  }

  /******************************************************************************************/
  showError(msg: any) {
    this.setState({ showAlertDialog: true, alertTxt: msg });
  }

  /******************************************************************************************/
  async onSwipeSuccess() {
    consoleLogFunc("onSwipeSuccess =======", )
    // create user local wallet here
    const createWalletData = {
      resp: this.props?.walletApiRes,
      walletData: this.props?.walletData,
      walletName: this.props?.walletName,
      pin: this.state.myPin,
    };

    if (this.props?.isPrivateKey) {
      await createPrivateKeyWalletLocal(createWalletData);
    } else {
      await createUserWalletLocal(createWalletData);
    }

    // saving this as it is being used to check if user is logged in
    // here value is such that the length checks are also passed - pinSet
    saveData(Constants.PIN_LOCK, 'pinSet');
    getData(Constants.BIOMETRIC_MODE).then(async bio_mode => {
      if (bio_mode == 'true') {
        try {
          await Singleton.getInstance().handleSetItemUsingTouchIDOnPress(this.state.myPin)
        } catch (error) {
          consoleLogFunc('error in handleSetItemUsingTouchIDOnPress', error);
          saveData(Constants.BIOMETRIC_MODE, 'false')
        }
      }
    })

    saveEncryptedData(Constants.PIN_LOCK, this.state.myPin, this.state.myPin);
    EventRegister.emit('theme', ThemeManager.colors.colorVariation);
    consoleLogFunc('Singleton.getInstance().userRefCode::::::::', Singleton.getInstance().userRefCode);
    if ((global as any).isDeepLink == true) {
      if (Singleton.getInstance().refCode != Singleton.getInstance().userRefCode) {
        (Singleton.getInstance().userRefCode && this.state.showREfModal) ? Singleton.getInstance().updateRefModal?.showRefModal() : null
      }
    }
    Actions.currentScene != "Main" && (Actions as any).Main({ type: ActionConst.RESET });
    saveData(Constants.AUTO_LOCK_TIMEOUT, 300000);
    Singleton.getInstance().dappDisconnectTimeout = 300000;
    EventRegister.emit("turnOffDapp");

    this.setState({ showCongrats: false }, () => {
      if ((global as any).isDeepLink == true) {
        if (this.state.alreadyUsed) {
          Singleton.getInstance().updateRefModal?.hideRefModal();
          Singleton.getInstance().updateAlertModal?.showCustom_Alert();
        }
      }
    });

  }

  /******************************************************************************************/
  togglePress() {
    this.setState({ toggleStatus: !this.state.toggleStatus }, () => {
      saveData(Constants.BIOMETRIC_MODE, this.state.toggleStatus.toString());
    });
  }

  /******************************************************************************************/
  continuePressed() {
    setTimeout(() => {
      if (this.state.myPin == this.props.pin) {

        setTimeout(() => {
          this.setState({ showCongrats: true })
        }, 500);
      } else if (this.state.myPin != this.props.pin) {
        this.setState({ myPin: '' });
        this.pinMismatch();
      }
    }, 50);
  }

  /******************************************************************************************/

  /******************************************************************************************/
  async itemPressed(item: any, _index?: any) {
    if (!(global as any).isConnected) {
      return this.setState({ showAlertDialog: true, alertTxt: LanguageManager.alertMessages.pleaseCheckYourNetworkConnection });
    }
    LanguageManager.setLanguage(item.name);
    const data = {
      fiat_currency: await getData(Constants.SELECTED_CURRENCY)
    }
    this.props.updateLanguage({ data }).then((res: any) => {
      this.setState({ defaultCurrency: item.code, showLangModal: false, showCongrats: true })
      saveData(Constants.SELECTED_LANGUAGE, item.code);
    }).catch((err: any) => {
      consoleLogFunc('chk updateLanguage err:::::', err)

    })
  }

  /******************************************************************************************/
  render() {
    const { pins, commonText } = LanguageManager;
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain />

        <View style={[styles.wrap]}>
          <OnboardingHeadings title={pins.confirmSecretCode1} subTitle={pins.pleaseEnterYourDigitCode} />

          <View style={{
            flex: 0.4,
          }}>
            <SecretCodeInput secretTxt={this.state.secretTxt}
              biometric={this.state.showView} togglePress={() => { this.togglePress() }} toggleStatus={this.state.toggleStatus}
            />

          </View>

          {/* -------------------------------------------------------- */}
          <View style={[styles.pin_wrap]}>
            <FlatList
              data={DATA}
              numColumns={3}
              bounces={false}
              scrollEnabled={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => {
                return index == 9 ? (<View style={styles.listStyle}>
                  <Text style={{ ...styles.pinBlockTextStyle, color: ThemeManager.colors.blackWhiteText }}></Text></View>) : (
                  <TouchableOpacity
                    style={styles.pinBlockStyle}
                    onPress={this.didSelect.bind(this, item)}>
                    {item === 'Del' ? (<Image source={ThemeManager.ImageIcons.deleteIconNew} resizeMode={'contain'} style={{ height: getDimensionPercentage(24), width: getDimensionPercentage(32) }} />) : (<Text allowFontScaling={false} style={[styles.pinBlockTextStyle, { color: ThemeManager.colors.blackWhiteText }]}>{item}</Text>)}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>

        {/* -------------------------------------------------------- */}


        {/* -------------------------------------------------------- */}

        {/* -------------------------------------------------------- */}
        {this.state.showCongrats && <CongratsModel
          openModel={this.state.showCongrats}
          importwallet={this.props.screenName == 'createWallet' ? false : true}
          title={this.props?.fromForgot != undefined ? 'Pin Changed\nSuccessfully.' : commonText.walletImportedSuccessfully}
          onPress={() => { 
            this.setState({ disableCongratClick: true }, () => {
              this.onSwipeSuccess() 
            })
          }}
          disableCongratClick={this.state.disableCongratClick}
        />}

        {/* -------------------------------------------------------- */}
        <Modal
          visible={this.state.showLangModal}
          onRequestClose={() => this.setState({ showLangModal: false })}
          transparent>
          <BlurView
            style={styles.blurView}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="white"
          />
          <View
            style={[styles.centeredView]}>
            <View style={styles.modalView}>
              <View style={styles.ViewStyle1}>
                <TouchableOpacity style={styles.touchableStyle1} onPress={() => this.setState({ showLangModal: false, showCongrats: true })}>
                  <Image resizeMode="contain" source={Images.CancelIcon} />
                </TouchableOpacity>
                <Text allowFontScaling={false} style={[styles.modalTitle, { fontFamily: Fonts.dmBold, color: ThemeManager.colors.settingsText }]}>{'Select Language'}</Text>
                {this.state.languageList?.map((item: any, index: any) => {
                  return (
                    <View key={index + ''} style={[styles.wallet_item, { borderColor: ThemeManager.colors.underLineColor }]}>
                      <TouchableOpacity onPress={() => { item.code?.toLowerCase() == this.state.defaultCurrency?.toLowerCase() ? '' : this.itemPressed(item, index) }} style={styles.touchableStyle2}>
                        <View style={[styles.ViewStyle]}>
                          <View style={{ flexDirection: 'row' }}>
                            <FastImage style={styles.imgStyle} source={{ uri: item.image }} />
                            <Text allowFontScaling={false} style={[styles.wallet_itemText, { color: ThemeManager.colors.whiteText }]}>{item.name}</Text>
                          </View>
                          {item.code?.toLowerCase() == this.state.defaultCurrency?.toLowerCase() && (<Image source={Images.done} style={{ tintColor: Colors.successColor }} />)}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity style={[styles.touchableStyle]} onPress={() => this.setState({ showLangModal: false, showCongrats: true })}>
                  <Text allowFontScaling={false} style={[styles.wallet_itemText, { color: ThemeManager.colors.whiteText, textDecorationLine: 'underline' }]}>{'Continue'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* -------------------------------------------------------- */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => { this.setState({ showAlertDialog: false }) }}
        />
      </ImageBackground>
    );
  }
}

export default connect(null, { updateLanguage })(ConfirmPin);
