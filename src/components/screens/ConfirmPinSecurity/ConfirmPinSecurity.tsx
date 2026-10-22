/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { ThemeManager } from '../../../../ThemeManager';
import { Colors } from '../../../theme';
import { AppAlert, HeaderMain, OnboardingHeadings } from '../../common';
import styles from './ConfirmPinSecurityStyle';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from '../../../../LanguageManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { dimen, getDimensionPercentage, heightDimen } from '../../../Utils';
import { consoleLogFunc, getData, getEncryptedData, saveData, saveEncryptedData } from '../../../Utils/MethodsUtils';
import SecretCodeInput from '../../subcommon/molecules/secretCodeInput';

const DATA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'];

class ConfirmPinSecurity extends Component<any, any> {
  timeout: any;
  focusListener: any;
  // BUG PRESERVED: forgotPassword is never defined on this class; this.forgotPassword() throws TypeError
  forgotPassword: any;
  constructor(props: any) {
    super(props);
    this.state = {
      showAlertDialog: false,
      alertTxt: '',
      myPin: '',
      showButton: false,
      showSuccess: false,
      secretTxt: [false, false, false, false, false, false]

    };
  }
  componentDidMount() {
    consoleLogFunc("🔐 CONFIRM PIN SECURITY ==>");
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.setState({ myPin: '', showButton: false });
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: '',
        myPin: '',
        showButton: false,
        showSuccess: false,
        secretTxt: [false, false, false, false, false, false]

      });
    });
  }
  componentWillUnmount() {
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
  }

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
      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[pin.length - 1] = false;

      this.setState({
        myPin: newPin,

        itemPressed: newPin.length == 0 ? null : item,
        showButton: false,
        secretTxt: updatedCircleStates

      });
    } else {
      let pin = this.state.myPin;
      pin = pin + item;
      if (pin.length <= 6) {
        const newCircleStates = [...this.state.secretTxt];
        newCircleStates[this.state.secretTxt.indexOf(false)] = true;
        pin.length == 6 ? this.continuePressed(pin) : null;
        this.setState({ showButton: pin.length == 6 ? true : false, myPin: pin, secretTxt: newCircleStates });
      }
    }
  }

  /******************************************************************************************/
  hideAlert() {
    this.setState({ showAlertDialog: false });
    if (this.state.showButton == true) {
      this.setState({ myPin: '', secretTxt: [false, false, false, false, false, false] });
      if (this.state.alertTxt != LanguageManager.alertMessages.enteredPINDoesNotMatch) {
        Actions.pop();
        Actions.pop();
      }

    }
  }

  /******************************************************************************************/
  continuePressed(pin: any) {

    // return
    if (pin == this.props.pin) {
      this.updateSensitiveInfo(this.props?.oldPin, pin)
      saveEncryptedData(Constants.PIN_LOCK, pin, pin);
      getData(Constants.BIOMETRIC_MODE).then(async bio_mode => {
        if (bio_mode == 'true') {
          await Singleton.getInstance().deleteKeyChainData()
          try {
            await Singleton.getInstance().handleSetItemUsingTouchIDOnPress(pin)
          } catch (error) {
            consoleLogFunc('error in handleSetItemUsingTouchIDOnPress--11', error);
            saveData(Constants.BIOMETRIC_MODE, 'false')
          }
        }
      })




      this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.PINChangedSuccessfully,
        showSuccess: true,
      });
    } else if (pin != this.props.pin) {
      this.setState({ myPin: '', secretTxt: [false, false, false, false, false, false] });
      this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.enteredPINDoesNotMatch,
        showButton: false,
        showSuccess: false,
      });
    }
  }

  updateSensitiveInfo = async (oldPin: any, newPin: any) => {
    let multiWallet = await getData(Constants.MULTI_WALLET_LIST)
    let multiWalletData = JSON.parse(multiWallet)
    multiWalletData.map(async (walletObj: any) => {
      let ethPvtKey = await getEncryptedData(`${walletObj?.login_data?.defaultEthAddress}_pk`, oldPin);
      await saveEncryptedData(`${walletObj?.login_data?.defaultEthAddress}_pk`, ethPvtKey, newPin);
      let btcPvtKey = await getEncryptedData(`${walletObj?.login_data?.defaultBtcAddress}_pk`, oldPin);
      await saveEncryptedData(`${walletObj?.login_data?.defaultBtcAddress}_pk`, btcPvtKey, newPin);
      let tronPvtKey = await getEncryptedData(`${walletObj?.login_data?.defaultTrxAddress}_pk`, oldPin);
      await saveEncryptedData(`${walletObj?.login_data?.defaultTrxAddress}_pk`, tronPvtKey, newPin);
      let mnemonics = await getEncryptedData(`${walletObj?.login_data?.defaultEthAddress}`, oldPin);
      await saveEncryptedData(walletObj?.login_data?.defaultSolAddress, mnemonics, newPin);
      await saveEncryptedData(walletObj?.login_data?.defaultEthAddress, mnemonics, newPin);
      setTimeout(() => {
        ethPvtKey = ""
        btcPvtKey = ""
        tronPvtKey = ""
        mnemonics = ""
      }, 1500);
    })
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
          paddingHorizontal: dimen(20),
          marginTop: heightDimen(30)
        }}>

          <OnboardingHeadings title={this.props?.from == "NewSecretCode" ? 'Confirm code' : LanguageManager.pins.secretCodeNew} subTitle={pins.pleaseEnterYourDigitCode} />

          {/* -------------------------------------------------------- */}
          <View style={{
            flex: 0.4,
          }}>
            <SecretCodeInput secretTxt={this.state.secretTxt} {...({} as any)} />

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
                return index == 9 ? (<View style={styles.listStyle}><Text style={{ ...styles.pinBlockTextStyle, color: ThemeManager.colors.blackWhiteText }}></Text></View>) : (
                  <TouchableOpacity
                    style={styles.pinBlockStyle}
                    onPress={this.didSelect.bind(this, item)}>
                    {item === 'Del' ? (<Image source={ThemeManager.ImageIcons.deleteIconNew} resizeMode={'contain'} style={{ height: getDimensionPercentage(24), width: getDimensionPercentage(32) }} />) : (<Text allowFontScaling={false} style={[styles.pinBlockTextStyle, { color: ThemeManager.colors.blackWhiteText }]}>{item}</Text>)}
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* -------------------------------------------------------- */}
        </View>

        {/* -------------------------------------------------------- */}
        <AppAlert
          visible={this.state.showAlertDialog}
          showSuccess={this.state.showSuccess}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => { this.hideAlert() }}
        />
      </BackgroundImage>
    );
  }
}

export default ConfirmPinSecurity;
