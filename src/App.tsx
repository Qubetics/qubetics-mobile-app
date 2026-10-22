import { Component } from 'react';
import Router from './Router';
import {
  View,
  AppState,
  NativeEventEmitter,
  NativeModules,
  Image,
  Text,
  Keyboard,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { ThemeManager } from "../ThemeManager";
import { Provider } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { store, persistor } from "./Redux/Reducers";
import { Colors, Images } from "./theme";
import { Actions } from './navigation/RootNavigation';
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  getToken,
  getInitialNotification,
  onNotificationOpenedApp,
  onMessage,
  registerDeviceForRemoteMessages,
  requestPermission,
} from "@react-native-firebase/messaging";
import { EventRegister } from "react-native-event-listeners";
import styles from "./components/screens/Welcome/WelcomeStyle";
import FlashMessage from "react-native-flash-message";
import { AppView, Button } from "./components/common";
import * as Constants from "./Constants";
import { consoleLogFunc, getData, saveData } from "./Utils/MethodsUtils";
import Singleton from "./Singleton";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DeviceInfo from "react-native-device-info";
import { LanguageManager } from "../LanguageManager";
import ReferralModal from "./components/common/ReferralModal";
import { updateRefCode } from "./Redux/Actions";
import { Modal } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { PersistGate } from "redux-persist/integration/react";
import WalletConnectInstance from "./Utils/WalletConnectInstance";
import Toast from "react-native-easy-toast";
import TransactionRequest from "./components/screens/WalletConnection/UiComponents/TransactionRequest";
import { createNotificationChannel, notificationState, consumeSkipPinOnce, registerNotifeeListeners, showNotification } from "./LocalNotification";
import PinAttempt from './components/screens/EnterPin/Common/PinAttempt';
import * as RNScreenshotPrevent from 'react-native-screenshot-prevent';
import { SCREENSHOT_PREVENT_URL } from './EndPoint';

const { ScreenshotDelegate } = NativeModules;
const screenShotEmitter = new NativeEventEmitter(ScreenshotDelegate);

let isFirstLaunch = true;
export default class App extends Component<any, any> {
  appState: any;
  backgroundedAtMonotonic: number | null = null;
  appStateListner: any;
  smartContractCallInterval: any;
  constructor(props: any) {
    super(props);
    this.appState = AppState.currentState;
    this.appState = null;
  }


  /******************************************************************************************/
  async componentDidMount() {
    const uniqueId = await DeviceInfo.getUniqueId();
    Singleton.getInstance().unique_id = uniqueId;
    WalletConnectInstance.getInstance();
    NetInfo.addEventListener(this.checkConnection);
    if (!__DEV__) RNScreenshotPrevent.enableSecureView(SCREENSHOT_PREVENT_URL);

    screenShotEmitter.addListener('screenshotEvent', this.screenShotEmitter);
    this.checkTheme();
    this.checkDefaultLanguage();
    this.requestUserPermission();
    registerNotifeeListeners()
    this.notification();
    getData(Constants.AUTO_LOCK_TIMEOUT).then((res: any) => {
      let time = JSON?.parse?.(res);
      if (!!time) {
        Singleton.getInstance().dappDisconnectTimeout = Number(time);
        EventRegister.emit('turnOffDapp');
      }
    });


    Linking.addEventListener("url", this.handleDeepLink);
    this.addDeepLinkListener();
    this.appStateListner = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setTimeout(
          () => {
            isFirstLaunch = false;
          },
          isFirstLaunch ? 4000 : 0
        );
      }
      this.handleAppStateChange(nextState);
    });
  }

  /******************************************************************************************/
  componentWillUnmount() {
    this.appStateListner?.remove();
  }

  /******************************************************************************************/
  checkTheme() {
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      if (theme) {
        theme == 1
          ? ThemeManager.setLanguage('darkMode')
          : ThemeManager.setLanguage('lightMode');
        EventRegister.emit('getThemeChanged', theme);
        saveData(Constants.DARK_MODE_STATUS, theme);
      } else {
        ThemeManager.setLanguage('darkMode');
        EventRegister.emit('getThemeChanged', '1');
        saveData(Constants.DARK_MODE_STATUS, 1);
      }
    });
  }

  /******************************************************************************************/
  async checkDefaultLanguage() {
    const defaultLanguage = await getData(Constants.SELECTED_LANGUAGE);
    if (defaultLanguage) {
      LanguageManager.setLanguage(
        defaultLanguage == 'en' ? 'English' : 'Spanish',
      );
    } else {
      LanguageManager.setLanguage('English');
      saveData(Constants.SELECTED_LANGUAGE, 'en');
    }
  }

  /******************************************************************************************/
  screenShotEmitter = (event: any) => {
    EventRegister.emit(Constants.DOWN_MODAL, 'yes');
    Singleton.getInstance().updateAlert?.showWarning();
  };

  /******************************************************************************************/
  async requestUserPermission() {
    createNotificationChannel()
    // Register device for remote messages
    // Firebase v22+ removed the v8 namespaced API (`messaging()`); use the modular API.
    const fcm = getMessaging(getApp());
    await registerDeviceForRemoteMessages(fcm);
    await requestPermission(fcm);

    getToken(fcm)
      .then(fcmToken => {
        fcmToken && saveData(Constants.DEVICE_TOKEN, fcmToken);
      })
      .catch(() => { });
  }

  /******************************************************************************************/
  checkConnection = (state: any) => {
    (global as any).isConnected = state.isConnected;
    (global as any).isInternetReachable =
      state.isInternetReachable == null ? true : state.isInternetReachable;
  };

  /******************************************************************************************/
  notification() {
    const fcm = getMessaging(getApp());
    getInitialNotification(fcm)
      .then((notificationOpen) => {

      });
    onNotificationOpenedApp(fcm, (remoteMessage) => {
      getData(Constants.ACCESS_TOKEN).then((token: any) => {
        if (token) {
          (Actions as any).Main({ type: 'reset' });
        } else {
          (Actions as any).Onboarding({ type: 'reset' });
        }
      });
    });
    //work when app is in forground mode
    onMessage(fcm, async (remoteMessage) => {
      showNotification(
        remoteMessage.notification!.title,
        remoteMessage.notification!.body,
        remoteMessage.messageId,
      );
      getData(Constants.ACCESS_TOKEN).then((token: any) => {
        if (token) EventRegister.emit('hitWalletApi', '');
      });
    });
  }

  /******************************************************************************************/
  handleAppStateChange = (nextAppState: any) => {
    if (nextAppState == 'background') {
      let time = new Date().getTime();
      saveData(Constants.LAST_TIME, time);
      // Monotonic reading: immune to clock changes, but may pause during device sleep.
      this.backgroundedAtMonotonic = performance.now();
    }

    if (
      (this.appState == 'active' || this.appState == 'inactive') &&
      nextAppState == 'background'
    ) {
      Keyboard.dismiss();
      EventRegister.emit(Constants.DOWN_MODAL, 'yes');
      Singleton.getInstance().updateRefModal?.hideRefModal();
      Singleton.isPermission ? null : (Singleton.isCameraOpen = false);
    }
    if (this.appState == "background" && nextAppState == "active") {
      // Skip PIN once if navigation came from a foreground notification press
      if (consumeSkipPinOnce()) {
        this.appState = nextAppState;
        return;
      }

      Singleton.getInstance().updateRefModal?.hideRefModal();
      Singleton.getInstance().updateAlertModal?.hideCustomAlert();
      getData(Constants.ACCESS_TOKEN).then((access_token: any) => {
        getData(Constants.PIN_LOCK).then((pin: any) => {
          if (!pin || pin?.length < 6) {
            return;
          }
          if (access_token != null) {
            EventRegister.emit('enableTouchable', true);
            if (Singleton.isCameraOpen) {
              Singleton.isCameraOpen = false;
              return;
            }
            getData(Constants.PIN_TIMEOUT).then((timeOut: any) => {
              getData(Constants.LAST_TIME).then((res: any) => {
                const pin_timeout = timeOut || 0;
                const diff = new Date().getTime() - res;
                const monotonicDiff =
                  this.backgroundedAtMonotonic === null
                    ? 0
                    : performance.now() - this.backgroundedAtMonotonic;
                // Wall clock covers device sleep; a negative diff means the clock
                // moved backwards. The monotonic diff covers clock tampering.
                const shouldLock =
                  !res ||
                  diff < 0 ||
                  diff > pin_timeout ||
                  monotonicDiff > pin_timeout;
                if (shouldLock) {
                  setTimeout(() => {
                    Actions.currentScene != "EnterPin" &&
                      (Actions as any).EnterPin();
                  }, 20);
                }
              });
            });
          }
        });
      });
    }
    this.appState = nextAppState;
  };

  addDeepLinkListener = () => {
    consoleLogFunc('INSIDE----addDeepLinkListener--APP');

    setTimeout(() => {
      Linking.getInitialURL()
        .then(async url => {
          const walletData = await getData(Constants.MULTI_WALLET_LIST);
          const walletArray =
            typeof walletData === 'string'
              ? JSON.parse(walletData)
              : walletData || [];

          if (url) {
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                getData(Constants.LOGIN_DATA)
                  .then((res: any) => {
                    if (res) {
                      let selectedWallet = walletArray?.filter(
                        (res: any) => res?.defaultWallet === true,
                      );
                      const defaultWallet = walletArray?.find(
                        (el: any) => el.defaultWallet == true,
                      );
                      const decodedLink = decodeURIComponent(url);
                      const link = this.parseLink(decodedLink);
                      if (
                        selectedWallet !== null ||
                        (!selectedWallet && defaultWallet)
                      ) {
                        if (link?.includes('relay')) {
                          setTimeout(() => {
                            if (this.smartContractCallInterval?.current) {
                              clearInterval(this.smartContractCallInterval);
                            }

                            this.smartContractCallInterval = setInterval(() => {
                              if (
                                Actions.currentScene !== 'EnterPin' &&
                                Actions.currentScene !== 'Splash'
                              ) {
                                clearInterval(this.smartContractCallInterval);
                                if (
                                  Actions.currentScene !== 'WalletConnection'
                                ) {
                                  (Actions as any).WalletConnection({
                                    walletConnectUri: link,
                                  });
                                } else {
                                  EventRegister.emitEvent(
                                    'wallet_connect_event',
                                    link,
                                  );
                                }
                              }
                            }, 2000);
                          }, 2000);
                        }
                      } else {
                        Singleton.getInstance().showToast?.show(
                          'Wallet connect is not supported in watch only wallet.',
                        );
                      }
                    } else {
                      setTimeout(() => {
                        Singleton.getInstance().showToast?.show(
                          'Please create or import wallet to connect with Wallet Connect.',
                        );
                      }, 5000);
                    }
                  })
                  .catch(() => { });
              } else {
                (global as any).requestFromDeepLink = true;
              }
            });
          }
        })
        .catch(() => { });
    }, 2000);
  };

  handleDeepLink = async (event: any) => {
    const walletData = await getData(Constants.MULTI_WALLET_LIST);
    const walletArray =
      typeof walletData === 'string'
        ? JSON.parse(walletData)
        : walletData || [];
    getData(Constants.LOGIN_DATA)
      .then((res: any) => {
        if (res) {
          let selectedWallet = walletArray?.filter(
            (res: any) => res?.defaultWallet === true,
          );
          const defaultWallet = walletArray?.find(
            (el: any) => el.defaultWallet == true,
          );
          const decodedLink = decodeURIComponent(event.url);
          const link = this.parseLink(decodedLink);

          if (selectedWallet !== null || (!selectedWallet && defaultWallet)) {
            if (link?.includes('relay')) {
              setTimeout(() => {
                if (this.smartContractCallInterval?.current) {
                  clearInterval(this.smartContractCallInterval);
                }

                this.smartContractCallInterval = setInterval(() => {
                  if (
                    Actions.currentScene !== 'EnterPin' &&
                    Actions.currentScene !== 'Splash'
                  ) {
                    clearInterval(this.smartContractCallInterval);
                    if (Actions.currentScene !== 'WalletConnection') {
                      (Actions as any).WalletConnection({ walletConnectUri: link });
                    } else {
                      EventRegister.emitEvent('wallet_connect_event', link);
                    }
                  }
                }, 2000);
              }, 2000);
            } else {
              (global as any).requestFromDeepLink = true;
            }
          } else {
            Singleton.getInstance().showToast.show(
              'Wallet connect is not supported in watch only wallet.',
            );
          }
        } else {
          setTimeout(() => {
            Singleton.getInstance().showToast.show(
              'Please create or import wallet to connect with Wallet Connect.',
            );
          }, 1000);
        }
      })
      .catch(() => { });
  };

  parseLink = (link: any) => {
    return link.includes('qubetics')
      ? link
        .replace('qubetics:///wc?uri=', '')
        .replace('qubetics://wc?uri=', '')
        .replace('qubetics://app/wc?uri=', '')
      : link;
  };
  /******************************************************************************************/
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate
            loading={<View style={{ flex: 1 }} />}
            persistor={persistor}>
            <SafeAreaProvider>
              <AppView>
                <AvoidScreenshot
                  ref={(refs) => {
                    Singleton.getInstance().updateAlert = refs;
                  }}
                />
                <RefModal
                  ref={(refs) => {
                    Singleton.getInstance().updateRefModal = refs;
                  }}
                />
                <TransactionRequest
                  ref={(refs) => {
                    Singleton.getInstance().walletConnectRef = refs
                  }}
                />
                <AppUpdate ref={((refs: any) => (Singleton.getInstance().isUpdateApp = refs)) as any} />
                <Toast
                  position="bottom"
                  positionValue={250}
                  fadeInDuration={750}
                  fadeOutDuration={1000}
                  opacity={0.8}
                  ref={(refs) => { Singleton.getInstance().showToast = refs }}
                />
                <PinAttempt />
                <Router />
              </AppView>
            </SafeAreaProvider>
          </PersistGate>
        </Provider>
        <FlashMessage position="top" />
      </View>
    );
  }
}

/******************************************************************************************/
class AvoidScreenshot extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      showAlert: false,
    };
  }

  /******************************************************************************************/
  showWarning() {
    this.setState({ showAlert: true });
  }

  /******************************************************************************************/
  render() {
    if (!this.state.showAlert) return null;
    return (
      <View style={styles.safeAreaView}>
        <View
          style={[
            styles.screenmain,
            { backgroundColor: ThemeManager.colors.mainBgNew },
          ]}>
          <Image
            style={{
              marginBottom: 40,
              tintColor: ThemeManager.colors.sheetTopLine,
            }}
            source={Images.modal_top_line}
          />
          <Image
            style={{ width: 100, height: 100 }}
            source={Images.logo}
            resizeMode={'contain'}
          />
          <Text
            allowFontScaling={false}
            style={[
              styles.secreenshotText,
              { color: ThemeManager.colors.blackWhiteText },
            ]}>
            {LanguageManager.walletMain.screenshot}
          </Text>
          <Text
            allowFontScaling={false}
            style={[
              styles.secreenshotsubText,
              { color: ThemeManager.colors.blackWhiteText },
            ]}>
            {LanguageManager.walletMain.screenShotMsg}
          </Text>
          <View style={styles.line} />
          <Button
            myStyle={{ width: Dimensions.get('window').width - 40, marginTop: 20, marginBottom: 30 }}
            buttontext={LanguageManager.walletMain.iUnder}
            onPress={() => {
              this.setState({ showAlert: false });
            }}
          />
        </View>
      </View>
    );
  }
}

/******************************************************************************************/
class RefModal extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      showRef: false,
      refCode: Singleton.getInstance().userRefCode,
      showAlertDialog: false,
      alertTxt: '',
      isLoading: false,
    };
  }

  /******************************************************************************************/
  showRefModal() {
    this.setState({
      showRef: true,
      refCode: Singleton.getInstance().userRefCode,
    });
  }

  /******************************************************************************************/
  hideRefModal() {
    getData(Constants.ACCESS_TOKEN).then((access_token: any) => {
      access_token ? (Singleton.getInstance().userRefCode = '') : null;
    });
    this.setState({ showRef: false, refCode: '' });
    (global as any).isRefLink = false;
    (global as any).showErr = false;
  }

  /******************************************************************************************/
  confirmRef() {
    const { refCode } = this.state;
    if (refCode.trim().length == 0) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.pleaseEnterReferralCode,
      });
    } else if (refCode.trim().length < 8) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.enterValidRefCode,
      });
    } else {
      this.setState({ isLoading: true });
      setTimeout(async () => {
        const data = {
          device_id: Singleton.getInstance().unique_id,
          user_id: await getData(Constants.USER_ID),
          referral_code: refCode,
        };
        store
          .dispatch(updateRefCode({ data }))
          .then((res: any) => {
            this.setState({
              isLoading: false,
              showAlertDialog: true,
              alertTxt: LanguageManager.referral.addSuccess,
            });
            (global as any).isRefLink = false;
          })
          .catch(err => {
            this.setState({
              isLoading: false,
              showAlertDialog: true,
              alertTxt: err,
            });
          });
      }, 200);
    }
  }

  /******************************************************************************************/
  render() {
    if (!this.state.showRef) return null;
    return (
      <ReferralModal
        editable={false}
        showReferralModal={this.state.showRef}
        handleBack={() => {
          this.setState({ showRef: false, refCode: '' });
          (global as any).isRefLink = false;
        }}
        onChangeText={(text: any) => this.setState({ refCode: text.replace(/\s/g, '') })}
        onPress={() => this.confirmRef()}
        value={Singleton.getInstance().userRefCode}
        Txt={this.state.alertTxt}
        showAlert={this.state.showAlertDialog}
        hideAlertDialog={() => {
          if (this.state.alertTxt == LanguageManager.referral.addSuccess) {
            this.setState({ showRef: false });
          }
          this.setState({ showAlertDialog: false, alertTxt: '' });
        }}
        isLoading={this.state.isLoading}
      />
    );
  }
}

class AppUpdate extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      isVisible: false,
    };
  }
  showUpdateApp = () => {
    this.setState({
      isVisible: true,
    });
  };
  routeOnStores() {
    Linking.openURL(
      Platform.OS == 'android'
        ? Constants.ANDROID_STORE_LINK
        : Constants.APP_STORE_LINK,
    ).catch(err => console.error('An error occurred', err));
  }
  render() {
    return (
      <Modal
        statusBarTranslucent
        animationType="fade"
        transparent={true}
        visible={this.state.isVisible}
        onRequestClose={() => { }}>
        <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={3}
          reducedTransparencyFallbackColor="white"
        />
        <View style={[styles.centeredView]}>
          <View
            style={[
              styles.modalView,
              {
                backgroundColor: ThemeManager.colors.Mainbg,
                borderColor: ThemeManager.colors.Mainbg,
              },
            ]}>
            <View style={{ alignItems: 'center' }}>
              <Image style={{ height: 20, width: 20 }} source={Images.infoIcon} />
              <Text
                allowFontScaling={false}
                style={[
                  styles.modalTitle,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}>
                {'App Update Required'}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.subTitle,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}>
                {'For continued use of this app, please update the app now'}
              </Text>
            </View>
            <Button
              onPress={async () => {
                this.routeOnStores();
              }}
              buttontext={'Ok'}
            />
          </View>
        </View>
      </Modal>
    );
  }
}


