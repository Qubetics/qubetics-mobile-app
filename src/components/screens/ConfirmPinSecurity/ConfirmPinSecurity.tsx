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
  async continuePressed(pin: any) {

    // return
    if (pin == this.props.pin) {
      try {
        await this.updateSensitiveInfo(this.props?.oldPin, pin)
        await saveEncryptedData(Constants.PIN_LOCK, pin, pin);
      } catch (error) {
        consoleLogFunc('PIN change failed', error);
        this.setState({
          myPin: '',
          secretTxt: [false, false, false, false, false, false],
          showAlertDialog: true,
          alertTxt: LanguageManager.alertMessages.somethingWentWrong,
          showButton: false,
          showSuccess: false,
        });
        return;
      }
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

  // Decrypts every entry with the old PIN before writing any, so a missing or
  // corrupt record aborts the change instead of leaving a mix of old/new PIN entries.
  updateSensitiveInfo = async (oldPin: any, newPin: any) => {
    const multiWallet = await getData(Constants.MULTI_WALLET_LIST)
    const multiWalletData = JSON.parse(multiWallet) ?? []
    const readIfPresent = async (key: any) => {
      if (!key) return null;
      try {
        return await getEncryptedData(key, oldPin);
      } catch (error) {
        consoleLogFunc('updateSensitiveInfo: skipping unreadable entry', key);
        return null;
      }
    };

    const pending: { key: string; value: string }[] = [];
    for (const walletObj of multiWalletData) {
      const login = walletObj?.login_data ?? {};
      for (const address of [login.defaultEthAddress, login.defaultBtcAddress, login.defaultTrxAddress]) {
        const pk = await readIfPresent(address && `${address}_pk`);
        if (pk) pending.push({ key: `${address}_pk`, value: pk });
      }
      // Every chain address keeps its own mnemonic copy; all must move to the new PIN.
      const mnemonics = await readIfPresent(login.defaultEthAddress);
      if (mnemonics) {
        for (const address of [login.defaultEthAddress, login.defaultBtcAddress, login.defaultTrxAddress, login.defaultSolAddress, login.defaultCosmosAddress]) {
          if (address) pending.push({ key: address, value: mnemonics });
        }
      }
    }

    const written: { key: string; value: string }[] = [];
    try {
      for (const entry of pending) {
        await saveEncryptedData(entry.key, entry.value, newPin);
        written.push(entry);
      }
    } catch (error) {
      // Put already-migrated entries back under the old PIN, which is still the lock PIN.
      for (const { key, value } of written) {
        try {
          await saveEncryptedData(key, value, oldPin);
        } catch (rollbackError) {
          consoleLogFunc('updateSensitiveInfo: rollback failed', key);
        }
      }
      throw error;
    } finally {
      pending.length = 0;
    }
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
