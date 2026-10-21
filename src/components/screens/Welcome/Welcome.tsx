import JailMonkey from 'jail-monkey';
import Lottie from 'lottie-react-native';
import React, {Component} from 'react';
import {
  BackHandler,
  Dimensions,
  NativeModules,
  Platform,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {EventRegister} from 'react-native-event-listeners';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {Actions} from '../../../navigation/RootNavigation';
import Video from 'react-native-video';
import {connect} from 'react-redux';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import {requestWalletLogin} from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import {Colors, Images} from '../../../theme/';
import images from '../../../theme/Images';
import {
  consoleLogFunc,
  getData,
  saveData,
} from '../../../Utils/MethodsUtils';
import {AppAlert} from '../../common';
import styles from './WelcomeStyle';

/** Audit: warning when wallet is run on rooted/jailbroken device. */
const ROOT_JAILBREAK_WARNING =
  'Your device is rooted or jailbroken. For your security, this wallet cannot be used on modified devices.';

class Welcome extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.splashAnimationRef = React.createRef();
    this.playTimer = null;
    this.state = {
      alertTxt: '',
      showAlertDialog3: false,
    };
  }

  componentWillUnmount() {
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    this.splashAnimationRef?.current?.pause?.();
  }
  /******************************************************************************************/
  async componentDidMount() {
    this.playTimer = setTimeout(() => {
      this.splashAnimationRef?.current?.play?.();
    }, 100);
    this.backhandle = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      consoleLogFunc('chk theme::::status', theme);

      if (theme) {
        consoleLogFunc('predefined======', theme);

        theme == 1
          ? ThemeManager.setLanguage('darkMode')
          : ThemeManager.setLanguage('lightMode');
        EventRegister.emit('getThemeChanged', theme);
        EventRegister.emit('theme', theme == 1 ? '#0C0C0D' : Colors.White);

        saveData(Constants.DARK_MODE_STATUS, theme);
      } else {
        consoleLogFunc('bydefault======');
        ThemeManager.setLanguage('darkMode');
        EventRegister.emit('getThemeChanged', '1');
        EventRegister.emit('theme', '#0C0C0D');
        saveData(Constants.DARK_MODE_STATUS, 1);
      }
    });
    if (ThemeManager.colors.theme == 'light') {
      changeNavigationBarColor('#ffffff');
    } else {
      changeNavigationBarColor('#121117');
    }
    this.navigateApp();
  }

  handleBackButtonClick() {
    return false;
  }

  /******************************************************************************************/
  async navigateApp() {
    if (__DEV__) {
      this.navigate();
      return;
    }
    if (Platform.OS === 'android') {
      if (await DeviceInfo.isEmulator()) {
        this.setState({
          alertTxt: ROOT_JAILBREAK_WARNING,
          showAlertDialog3: true,
        });
        return;
      }
      const EncryptionModule = NativeModules.EncryptionModule;
      if (!EncryptionModule?.rootStatus) {
        this.setState({
          alertTxt: ROOT_JAILBREAK_WARNING,
          showAlertDialog3: true,
        });
        return;
      }
      try {
        const res = await EncryptionModule.rootStatus();
        if (res === 'It is not rooted device') {
          this.moveForward();
        } else {
          this.setState({
            alertTxt: ROOT_JAILBREAK_WARNING,
            showAlertDialog3: true,
          });
        }
      } catch (err) {
        consoleLogFunc('-----------root check error--------', err);
        this.setState({
          alertTxt: ROOT_JAILBREAK_WARNING,
          showAlertDialog3: true,
        });
      }
      return;
    }
    this.moveForward();
  }

  /******************************************************************************************/
  moveForward() {
    EventRegister.emit('fromscreen', 'welcome');
    if (JailMonkey.isJailBroken()) {
      this.setState({alertTxt: ROOT_JAILBREAK_WARNING, showAlertDialog3: true});
    } else {
      this.navigate();
    }
  }

  /******************************************************************************************/
  navigate() {
    getData(Constants.ACCESS_TOKEN).then(value => {
      getData(Constants.PIN_LOCK).then(pin => {
        if (value && pin) {
          getData(Constants.ACTIVE_ADDRESS_LIST).then(addressList => {
            consoleLogFunc('addressList:::::', addressList);
            const addressArr = addressList ? JSON.parse(addressList) : [];
            const isHavingBnb = addressArr?.find(
              (item: any) => item?.symbol?.toLowerCase() == 'bnb',
            );
            consoleLogFunc('isHavingBnb::::::::', isHavingBnb);
            if (addressArr.length > 0) {
              this.moveToApp(value, pin);
            } else {
              this.createWallet(value, pin);
            }
          });
        } else {
          this.moveToApp(value, pin);
        }
      });
    });
    this.createRefLink();
  }

  /******************************************************************************************/
  createRefLink = async () => {};
  /******************************************************************************************/
  async moveToApp(value: any, pin: any, fromCreate = false) {
    if (value && pin) {
      const newUser = await getData(Constants.NEW_USER);
      if (newUser == null) {
        saveData(Constants.NEW_USER, 'true');
        saveData(Constants.BIOMETRIC_MODE, 'false');
      }

      if (fromCreate) {
        Actions.currentScene != 'EnterPin' &&
          (Actions as any).EnterPin({from: 'welcome'});
      } else {
        setTimeout(() => {
          Actions.currentScene != 'EnterPin' &&
            (Actions as any).EnterPin({from: 'welcome'});
          EventRegister.emit('fromscreen', '');
        }, 4500);
      }
    } else {
      fromCreate
        ? Actions.currentScene != 'Onboarding' &&
          (Actions as any).Onboarding({type: 'reset'})
        : setTimeout(() => {
            Actions.currentScene != 'Onboarding' &&
              (Actions as any).Onboarding({type: 'reset'});
            EventRegister.emit('fromscreen', '');
          }, 4500);
    }
  }

  /******************************************************************************************/
  createWallet(value: any, pin: any) {
    getData(Constants.MULTI_WALLET_LIST).then(async list => {
      getData(Constants.LOGIN_DATA).then(async res => {
        const response = JSON.parse(res);
        const WallList = JSON.parse(list);
        const defaultWallet = WallList?.find(
          (item: any) => item?.defaultWallet == true,
        );
        consoleLogFunc('defaultWallet::::::::', defaultWallet);
        consoleLogFunc('response::::::::', response);

        const web3Res = defaultWallet?.web3Res;
        const data = {
          device_id: Singleton.getInstance().unique_id,
          login_type: web3Res?.userInfo?.typeOfLogin,
          social_id: web3Res?.sessionId,
          email: web3Res?.userInfo?.email,
          wallet_address: response.defaultEthAddress,
          device_token: (await getData(Constants.DEVICE_TOKEN)) || '',
          wallet_name: web3Res?.userInfo?.name || 'Basic',
          referral_code: response.refCode,
          addressList: [
            {
              symbol: 'bnb',
              address: response.defaultEthAddress,
              coin_family: 1,
            },
            {
              symbol: 'eth',
              address: response.defaultEthAddress,
              coin_family: 2,
            },
            {
              symbol: 'btc',
              address: response.defaultBtcAddress,
              coin_family: 3,
            },
            // BUG PRESERVED: walletData is not declared in scope (ReferenceError at runtime)
            // @ts-ignore
            {symbol: 'pol', address: walletData.eth_address, coin_family: 4},
            // @ts-ignore
            {symbol: 'sol', address: walletData.sol_address, coin_family: 5},
            {
              symbol: 'trx',
              address: response.defaultTrxAddress,
              coin_family: 6,
            },
            // @ts-ignore
            {symbol: 'tics', address: walletData.eth_address, coin_family: 7},
            {
              symbol: 'tics',
              // @ts-ignore
              address: walletData.cosmos_address,
              coin_family: 7,
            },
          ],
        };
        const addrsListKeys = [
          response.defaultEthAddress,
          response.defaultEthAddress,
          response.defaultEthAddress,
          response.defaultBtcAddress,
          response.defaultTrxAddress,
          response.defaultSolAddress,
          response.defaultTicsAddress,
          response.defaultCosmosAddress,
        ];
        const coinFamilyKeys = [1, 2, 3, 4, 5, 6, 7];
        this.props.requestWalletLogin({data}).then((res2: any) => {
          Singleton.getInstance().defaultBnbAddress =
            response.defaultEthAddress;
          const login_data = {
            access_token: res2.data.token,
            defaultEthAddress: response.defaultEthAddress,
            defaultTrxAddress: response.defaultTrxAddress,
            defaultBnbAddress: response.defaultEthAddress,
            defaultMaticAddress: response.defaultEthAddress,
            walletName: web3Res?.userInfo?.name || 'Basic',
            userId: res2.data.userId,
            userEmail: web3Res?.userInfo?.email,
            refCode: response.refCode,
          };
          const Wallet_Array = [
            {
              walletName: web3Res?.userInfo?.name || 'Basic',
              loginRequest: data,
              defaultWallet: true,
              user_jwtToken: res2.data?.token,
              user_refreshToken: res2.data?.token,
              userEmail: web3Res.userInfo?.email,
              typeOfLogin: web3Res?.userInfo?.typeOfLogin,
              addrsListKeys: addrsListKeys,
              coinFamilyKeys: coinFamilyKeys,
              login_data: login_data,
              web3Res: defaultWallet?.web3Res,
            },
          ];
          saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(Wallet_Array));
          saveData(Constants.ACCESS_TOKEN, res2.data.token);
          saveData(
            Constants.ACTIVE_ADDRESS_LIST,
            JSON.stringify(data.addressList),
          );
          saveData(Constants.ADDRESS_LIST, JSON.stringify(addrsListKeys));
          saveData(Constants.COIN_FAMILY_LIST, JSON.stringify(coinFamilyKeys));
          saveData(Constants.LOGIN_DATA, JSON.stringify(login_data));
          saveData(Constants.REFRESH_TOKEN, res2.data.refreshToken);
          Singleton.getInstance().walletName =
            web3Res?.userInfo?.name || 'Basic';
          this.moveToApp(value, pin, true);
        });
      });
    });
  }

  /******************************************************************************************/
  render() {
    consoleLogFunc('Welcome.js render');
    return (
      <>
        <View
          style={{
            height: Dimensions.get('screen').height,
            width: Dimensions.get('screen').width,
            backgroundColor: ThemeManager.colors.mainBgNew,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Video
            source={images.tickAnimation}
            style={styles.backgroundVideo}
            resizeMode="cover"
            useTextureView={true}
          />
          <Lottie
            ref={this.splashAnimationRef}
            style={{height: 280,width: 280,zIndex: 1}}
            source={Images.splashLogo}
            autoPlay
            loop={false}
          />
        </View>
        <AppAlert
          visible={this.state.showAlertDialog3}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({showAlertDialog3: false}, () =>
              BackHandler.exitApp(),
            );
          }}
        />
      </>
    );
  }
}

export default connect(null, {requestWalletLogin})(Welcome);
