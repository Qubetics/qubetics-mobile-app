/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
} from 'react-native';
import styles from './CreatePinSecurityStyle';
import { AppAlert, HeaderMain, OnboardingHeadings } from '../../common';
import { Actions } from '../../../navigation/RootNavigation';
import { ThemeManager } from '../../../../ThemeManager';
import Toast from 'react-native-easy-toast';
import { EventRegister } from 'react-native-event-listeners';
import * as Constants from '../../../Constants';
import { LanguageManager } from '../../../../LanguageManager';
import SecretCodeInput from '../../subcommon/molecules/secretCodeInput';
import {
  getDimensionPercentage as dimen,
  heightDimen,
} from '../../../Utils';
const DATA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'];




class CreatePinSecurity extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      showAlertDialog: false,
      alertTxt: '',
      myPin: '',
      secretTxt: [false, false, false, false, false, false]

    };
  }
  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({ showAlertDialog: false, alertTxt: '' });
    });
    this.props.navigation.addListener('blur', (event: any) => {
      this.setState({
        myPin: '',
        secretTxt: [false, false, false, false, false, false]

      });
    });
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
        secretTxt: updatedCircleStates

      });
    } else {
      let pin = this.state.myPin;
      pin = pin + item;
      if (pin.length <= 6) {
        const newCircleStates = [...this.state.secretTxt];
        newCircleStates[this.state.secretTxt.indexOf(false)] = true;

        this.setState({ myPin: pin, secretTxt: newCircleStates });
        pin.length == 6 ? this.continuePressed(pin) : null;
      }
    }
  }

  /******************************************************************************************/
  continuePressed(pin: any) {
    if(this.props.oldPin == pin) {
      this.setState({ showAlertDialog: true, alertTxt: "The new secret code cannot be the same as your current secret code. Please choose a different passcode.", secretTxt: [false, false, false, false, false, false], myPin: "" });
      return;
    }
    Actions.currentScene != 'ConfirmPinSecurity' && (Actions as any).ConfirmPinSecurity({ pin: pin, themeSelected: this.props.themeSelected, from: "NewSecretCode", oldPin: this.props.oldPin });
    this.setState({ myPin: '' });
  }

  /******************************************************************************************/
  render() {
    const { pins } = LanguageManager;
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain />
        <View style={{
          flex: 1,
          paddingHorizontal: dimen(20),
          marginTop: heightDimen(30)
        }}>
          <OnboardingHeadings title={this.props?.fromScreen == "enterPinSecurity" ? 'New Secret code' : LanguageManager.pins.secretCodeNew} subTitle={pins.pleaseEnterYourDigitCode} />

          {/* -------------------------------------------------------- */}
          <View style={{
            flex: 0.4,

          }}>
            <SecretCodeInput {...({} as any)} secretTxt={this.state.secretTxt} />

          </View>
          {/* -------------------------------------------------------- */}
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
                  <View style={styles.listStyle}><Text style={{ ...styles.pinBlockTextStyle, color: ThemeManager.colors.blackWhiteText }}></Text></View>) : (
                  <TouchableOpacity
                    style={styles.pinBlockStyle}
                    onPress={this.didSelect.bind(this, item)}>
                    {item === 'Del' ? (<Image source={ThemeManager.ImageIcons.deleteIconNew} resizeMode={'contain'} style={{ height: dimen(24), width: dimen(32) }} />) : (<Text allowFontScaling={false} style={[styles.pinBlockTextStyle, { color: ThemeManager.colors.blackWhiteText }]}>{item}</Text>)}


                  </TouchableOpacity>
                );
              }}
            />
          </View>

        </View>
        {/* -------------------------------------------------------- */}
        <Toast
          ref={((toast: any) => (this.toast = toast)) as any}
          position="bottom"
          {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
        />

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

export default CreatePinSecurity;
