import React, { Component } from "react";
import {
  AppState,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import ReactNativeBiometrics from 'react-native-biometrics';
import DeviceInfo from "react-native-device-info";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  getBannerList,
  getCurrencyPref,
  getNotiStatus,
  getRpcUrl,
  requestCoinList,
  syncBalanceWithChain,
  updateDeviceToken,
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Colors, Images } from "../../../theme/";
import {
  disableScreenshotPrevent,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from "../../../Utils";
import {
  CommaSeprator1,
  consoleLogFunc,
  getData,
  saveData,
} from "../../../Utils/MethodsUtils";
import WalletConnectInstance from "../../../Utils/WalletConnectInstance";
import {
  AppAlert,
  CoinList,
  GradientBorderView,
  LoaderView,
  MainCard,
  TabIcon,
} from "../../common";
import { AppAlertDialog } from "../../common/AppAlertDialog";
import { PortfolioManageButton } from "../../common/SearchToken";
import OnboardingSwiper from "../../subcommon/molecules/onBoardingSwiper";
import styles from "./WalletMainStyle";

const rnBiometrics = new ReactNativeBiometrics();

class WalletMain extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.isFetchingCoinList = false;
    this.state = {

      fiat_bal: "0.00",
      showAlertDialogExit: false,
      refresh: false,
      loading: false,
      showAlertDialog: false,
      alertTxt: "",
      is_notification: false,
      refreshing: false,
      showViewAll: true,
      walletName: "",
      themeSelected: "",
      isHideBalance: false,
      bannerArr: [],
      walletListPage: 1,
      walletListPages: 0,
      paginationLoading: false,
    };
    this.scrollRef = React.createRef();
    this.flatListRef = React.createRef();

  }

  /******************************************************************************************/
  static navigationOptions = () => {
    return {
      header: null,
      tabBarLabel: " ",
      tabBarIcon: ({ focused }: { focused: any }) => (
        <TabIcon
          focused={focused}
          title={LanguageManager.walletMain.Wallet}
          ImgSize={{
            height: 23,
            tintColor: focused
              ? ThemeManager.colors.whiteText
              : ThemeManager.colors.lightWhiteText,
          }}
          activeImg={Images.dashboard_active}
          defaultImg={Images.dashboard_inactive}
          titleColor={{
            color: focused
              ? ThemeManager.colors.whiteText
              : ThemeManager.colors.lightWhiteText,
          }}
        />
      ),
      tabBarOptions: {
        style: {
          borderTopColor: "transparent",
          borderColor: "black",
          backgroundColor: ThemeManager.colors.tabBottomColor,
        },
        keyboardHidesTabBar: true,
      },
    };
  };

  //NotificationPush
  /******************************************************************************************/
  componentDidMount() {
    Singleton?.getInstance()?.isNewerVersion1()
    consoleLogFunc(
      "isPushNotificationEnabled:::::::",
      Singleton.getInstance().isMakerWallet
    );
    this.setState({ bannerArr: [] });
    this.appStateListner = AppState.addEventListener("change", (nextState) => {
      consoleLogFunc("WalletMain.js nextState ------", nextState);
    });
    getData(Constants.WALLET_NAME).then(async (res: any) => {
      this.setState({ walletName: res });
    });

    this.listenerHitWalletApi = EventRegister.addEventListener("hitWalletApi", () => {
      consoleLogFunc("chk current scene:::::", Actions.currentScene);
      Actions.currentScene == "_WalletMain" && this.mywalletList(false);
      Actions.currentScene == "_WalletMain" && this.fetchNotiStatus();
    });
    this.listenerDownModal = EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: "",
        showAlertDialogExit: false,
      });
    });

    this.props?.getCurrencyPref();
    this.checkBiometricAvailability();
    this.checkHideBalance();
    this.initialCallWalletConnect();
    this.mywalletList();
    this.fetchRpc();
    disableScreenshotPrevent();
    this.listenerThemeChanged = EventRegister.addEventListener("getThemeChanged", (data) => {
      consoleLogFunc("data:::::main:: ", data);

      this.setState({ themeSelected: data ? data : 2 });
    });
    this.focusListener = this.props.navigation.addListener('focus', () => {
      consoleLogFunc('focus---main',);

      this.scrollToIndexOne()
      this.onFocus();
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      this.setState({
        showAlertDialogExit: false,
        showAlertDialog: false,
      });

      EventRegister.emit("fromscreen", "");
      this._scrollToTop();
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      this.backhandle = (BackHandler as any)?.removeEventListener(
        "hardwareBackPress",
        this.handleBackButtonClick
      );
      if (this.backhandle) this.backhandle?.remove();
    });
  }

  initialCallWalletConnect = async () => {
    WalletConnectInstance.getInstance();
    EventRegister.addEventListener("requestFromDapp", (data) => {
      getData(Constants.PIN_LOCK).then((res: any) => {
        if (res) {
          if (Actions.currentScene != "EnterPin") {
            Singleton.getInstance()?.walletConnectRef?.showTransactionRequest(
              true,
              data
            );
          } else {
            (global as any).wcTxnData = data;
            (global as any).wcTxnPopup = true;
          }
        }
      });
    });
    let multiWallet = await getData(Constants.MULTI_WALLET_LIST);
    let multiWalletData = [];
    try {
      multiWalletData = JSON.parse(multiWallet || '[]');
    } catch (e) { }
    let currentWallet = multiWalletData.find((el: any) => el?.defaultWallet == true);
    let ethAddress = currentWallet?.loginRequest?.wallet_address;

    getData(`${ethAddress}_FCM`).then(async (res: any) => {
      if (res == "notSaved") {
        const fcmToken = await getData(Constants.DEVICE_TOKEN);
        if (fcmToken) {
          let data = {
            addressList: currentWallet?.loginRequest?.addressList,
            device_token: fcmToken,
            device_id: Singleton.getInstance().unique_id,
          };
          consoleLogFunc("data>>>", data);

          this.props
            .updateDeviceToken(data)
            .then((res: any) => {
              consoleLogFunc("res11111>>>", res);
              (getData as any)(`${ethAddress}_FCM`, "saved");
            })
            .catch((err: any) => {
              consoleLogFunc("ERROR>>>", err);
            });
        }
      }
    });
  };

  componentWillUnmount() {
    this.appStateListner?.remove();
    if (this.focusListener) this.focusListener();
    if (this.blurListener) this.blurListener();
    if (this.listenerHitWalletApi) EventRegister.removeEventListener(this.listenerHitWalletApi);
    if (this.listenerDownModal) EventRegister.removeEventListener(this.listenerDownModal);
    if (this.listenerThemeChanged) EventRegister.removeEventListener(this.listenerThemeChanged);
  }



  /******************************************************************************************/
  async onFocus() {
    if (!this.props.navigation.isFocused()) return;
    consoleLogFunc('onFocus--INSIDE');


    this.checkHideBalance();

    EventRegister.emit("fromscreen", "wallet");
    this.setState({ search: "" });
    Singleton.isPermission = false;
    this.mywalletList(false);

    this.fetchNotiStatus();
    this.fetchBannerList();
    this.backhandle = BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
    getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
      consoleLogFunc("test::::::: ", theme);
      this.setState({ themeSelected: theme });
    });
    getData(Constants.WALLET_NAME).then(async (res: any) => {
      this.setState({ walletName: res });
    });

    this.setState({ refresh: false });
    this.setState({ refresh: !this.state.refresh });
  }

  checkHideBalance() {
    getData(Constants.HIDE_BALANCE).then((res: any) => {
      this.setState({ isHideBalance: res == "true" ? true : false }, () => {
        Singleton.getInstance().isHideBalance = this.state.isHideBalance;
      });
    });
  }

  /* *********************************************_scrollToTop***************************************** */
  _scrollToTop() {
    if (this.scrollRef !== null) {
      if (this.scrollRef.current !== null) {
        this.scrollRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    }
  }
  /* *********************************************_scrollToTopLIST***************************************** */

  scrollToIndexOne = () => {
    try {
      if (
        this.flatListRef?.current &&
        Array.isArray(this.props?.coinList) &&
        this.props.coinList.length > 0
      ) {
        this.flatListRef?.current.scrollToIndex({ index: 0, animated: true });
      }
    } catch (error) {
      consoleLogFunc("scrollToIndexOne error:", error);
    }
  };

  /* *********************************************fetchNotiStatus***************************************** */
  fetchNotiStatus() {
    const data = {
      key: 1,
    };
    consoleLogFunc("data notification :::", data);
    this.props
      .getNotiStatus({ data })
      .then((res: any) => {
        consoleLogFunc("chk noti res:::::: ===", res);
        Singleton.isNotification = res.new_notifications == 1 ? true : false;
        this.setState({
          is_notification: res.new_notifications == 1 ? true : false,
        });
      })
      .catch((err: any) => {
        consoleLogFunc("chk noti err: wallet main::::: ", err);
      });
  }

  /* *********************************************fetchRpc***************************************** */
  fetchRpc() {
    this.props.getRpcUrl({});
  }

  /* *********************************************checkBiometricAvailability***************************************** */
  checkBiometricAvailability() {
    rnBiometrics.isSensorAvailable().then((resultObject) => {
      const { available } = resultObject;
      consoleLogFunc("chk available:::::", available);
      saveData(Constants.BIOMETRIC_SUPPORTED, available ? "true" : false);
    });
  }

  /* *********************************************handleBackButtonClick***************************************** */
  handleBackButtonClick = () => {
    consoleLogFunc("chk Actions.Cut=rrent scene::::::", Actions.currentScene);
    Actions.currentScene == "TransactionHistory"
      ? this.hitPop()
      : this.setState({
        showAlertDialogExit:
          Actions.currentScene == "_WalletMain" ||
            Actions.currentScene == "WalletMain"
            ? true
            : false,
      });
    return true;
  };

  /******************************************************************************************/
  hitPop() {
    consoleLogFunc("herrerere1212");
    Singleton.bottomBar?.navigateTab("WalletMain");
  }
  /************************************** mywalletList ****************************************************/
  mywalletList(isLoading = true) {
    if (this.isFetchingCoinList) {
      consoleLogFunc('mywalletList- already fetching, skipping');
      return;
    }
    this.isFetchingCoinList = true;
    consoleLogFunc('mywalletList-');

    this.setState({ loading: isLoading });
    this.props
      .requestCoinList({})
      .then((response: any) => {
        this.isFetchingCoinList = false;
        const showBal = this.showBalWithBal(response?.totalBalance);
        consoleLogFunc("showBal>>>>>>>>>>>>>>", response?.totalBalance, showBal);

        this.setState({
          loading: false,
          fiat_bal: showBal,
          walletListPage: response?.meta?.page,
          walletListPages: response?.meta?.pages
        });
      })
      .catch((e: any) => {
        this.isFetchingCoinList = false;
        this.setState({
          loading: false,
          fiat_bal: "0.00",
          alertTxt: e,
          showAlertDialog: true,
        });
      });
  }


  /************************************** syncBalance ****************************************************/
  syncBalance = async () => {
    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;
    if (Singleton.lastSyncBalanceTime && now - Singleton.lastSyncBalanceTime < ONE_MINUTE) {
      this.mywalletList(false);
      this.wait(1500).then(() => this.setState({ refreshing: false }));
      return;
    }
    Singleton.lastSyncBalanceTime = now;
    await syncBalanceWithChain()
    this.mywalletList(false);
    this.wait(1500).then(() => this.setState({ refreshing: false }));
  };

  /************************************** onRefresh ****************************************************/
  onRefresh = () => {
    this.setState({ refreshing: true, search: "" });
    this.syncBalance();

  };
  wait = (timeout: any) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  };

  /* *********************************************notiPressed***************************************** */
  notiPressed() {
    Singleton.isNotification = false;
    this.setState({ is_notification: false });
    Actions.currentScene != "NotificationsTab" &&
      (Actions as any).NotificationsTab({ themeSelected: this.state.themeSelected });
  }

  /* *********************************************manage***************************************** */
  manage() {
    Actions.currentScene != "Manage" &&
      (Actions as any).Manage({ themeSelected: this.state.themeSelected });
  }

  /******************************************************************************************/
  toggleNft() {
    Actions.currentScene !== "Nft" &&
      (Actions as any).Nft({ themeSelected: this.state.themeSelected });
  }
  /******************************************************************************************/
  toggleWallet() {
    Actions.currentScene !== "ToggleWalletNew" &&
      (Actions as any).ToggleWalletNew({ themeSelected: this.state.themeSelected });
  }

  /* *********************************************onPressSend***************************************** */
  onPressSend() {
    Actions.currentScene != "SelectCoin" &&
      (Actions as any).SelectCoin({
        action_type: "send",
        themeSelected: this.state.themeSelected,
      });
  }

  /* *********************************************onPressReceive***************************************** */
  onPressReceive() {
    Actions.currentScene != "SelectCoin" &&
      (Actions as any).SelectCoin({
        action_type: "receive",
        themeSelected: this.state.themeSelected,
      });
  }

  /* *********************************************onPressSwap***************************************** */
  onPressSwap() {
    Actions.currentScene != "Swap" && (Actions as any).Swap();
  }

  /* *********************************************hideShowBalance***************************************** */
  onHideShowBalance() {
    consoleLogFunc("onHideShowBalance>>>");
    this.setState({ isHideBalance: !this.state.isHideBalance }, () => {
      Singleton.getInstance().isHideBalance = this.state.isHideBalance;
      saveData(Constants.HIDE_BALANCE, this.state.isHideBalance);
    });
  }

  onPressHistory() {
    Actions.currentScene != "DetailTransaction" &&
      (Actions as any).DetailTransaction({
        themeSelected: this.state.themeSelected,
        symbol: "all",
      });
  }

  /* *********************************************onPressCards***************************************** */

  /******************************************************************************************/
  onEndReached() {
    consoleLogFunc('onEndReached>>>>>>>>>>>>>>',
      this.state.walletListPage < this.state.walletListPages && !this.state.paginationLoading && !this.state.loading,
      this.state.walletListPage, this.state.walletListPages, this.state.paginationLoading, this.state.loading);


    if (this.state.walletListPage < this.state.walletListPages && !this.state.paginationLoading && !this.state.loading) {
      consoleLogFunc("PAGINATION CALLED");

      const page = this.state.walletListPage + 1;
      this.setState({ walletListPage: page, paginationLoading: true }, () => {
        const data = {
          search: this.state.search,
          page: page
        };
        this.fetchList(data);
      });
    }
  }

  /******************************************************************************************/
  getSearchList() {
    let data = {
      search: this.state.search,
      page: 1,
    };
    this.fetchList(data);
  }

  /******************************************************************************************/
  fetchList(data1: any) {
    this.setState({ isLoading: data1?.page == 1 ? true : false }, () => {
      this.props
        .requestCoinList({ data1 })
        .then((response: any) => {
          this.setState({
            isLoading: false,
            paginationLoading: false,
            walletListPages: response?.meta?.pages,
            walletListPage: response?.meta?.page
          });
        })
        .catch((err: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt: err?.message || String(err),
          });
        });
    });
  }
  /******************************************************************************************/
  updateSearch() {
    if (this.timer != undefined) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.getSearchList();
    }, 100);
  }
  showBalWithBal(bal: any) {
    if (bal < 0.000001) {
      return `${CommaSeprator1(bal, 8)}`;
    } else if (bal < 0.01) {
      return `${CommaSeprator1(bal, 4)}`;
    } else {
      return `${CommaSeprator1(bal, 2)}`;
    }
  }

  /******************************************************************************************/
  fetchBannerList() {
    this.props
      .getBannerList()
      .then((response: any) => {
        consoleLogFunc("response:::::fetchBannerList", response);
        if (response?.data?.length > 0) {
          this.setState({ bannerArr: response?.data });
        }
      })
      .catch((err: any) => {

      });
  }


  /******************************************************************************************/

  render() {
    const { walletMain, alertMessages } = LanguageManager;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              width: Dimensions.get("screen").width,
              paddingTop:
                Platform.OS == "ios"
                  ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
                    ? getDimensionPercentage(50)
                    : getDimensionPercentage(20)
                  : getDimensionPercentage(0),
            }}
          >
            <View style={[styles.ViewStyle2]}>
              <View style={[styles.ViewStyle, {}]}>
                <TouchableOpacity
                  onPress={() => {
                    if (Actions.currentScene !== "MyWalletList") {
                      (Actions as any).MyWalletList();
                    }
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GradientBorderView
                      gradientStyle={{
                        height: widthDimen(46),
                        width: widthDimen(46),
                      }}
                      mainStyle={{
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={[
                          styles.walletNameIcon,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}
                      >
                        {this.state.walletName?.charAt(0)?.toUpperCase()}
                      </Text>
                    </GradientBorderView>

                    <Text
                      ellipsizeMode="tail"
                      style={[
                        styles.walletName,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {this.state.walletName}
                    </Text>
                    <Image
                      source={ThemeManager.ImageIcons.newDropDown}
                      style={{
                        resizeMode: "contain",
                        marginLeft: widthDimen(8),
                      }}
                    />
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <TouchableOpacity
                    onPress={() => Actions.currentScene != "Settings" && (Actions as any).Settings()}
                  >
                    <Image source={ThemeManager.ImageIcons.inActiveSetting}
                      style={{ tintColor: Colors.White, resizeMode: "contain", marginRight: widthDimen(8) }} />
                  </TouchableOpacity>




                  <TouchableOpacity
                    onPress={() => this.notiPressed()}
                    style={[styles.touchableStyle]}
                  >
                    <Image
                      style={[styles.imgNoti]}
                      source={
                        Singleton.isNotification ? Images.notiDot : Images.noti
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ marginTop: heightDimen(12) }} />
              <MainCard
                onPressSend={() => this.onPressSend()}
                onPressReceive={() => this.onPressReceive()}
                onPressHistory={() => this.onPressHistory()}
                onPressSwap={() => this.onPressSwap()}
                isHideBalance={this.state.isHideBalance}
                hideBalance={() => this.onHideShowBalance()}
                showBal={this.state.fiat_bal}


              />
            </View>
          </View>
          {this.state?.bannerArr?.length != 0 && (
            <OnboardingSwiper arr={this.state.bannerArr} />
          )}
          <View style={[styles.viewAssets]}>
            <PortfolioManageButton
              marginTop={this.state?.bannerArr?.length != 0 ? -10 : 0}
              isIconsShow={true}
              arrangeWallet={() => {
                this.manage();
              }}
              nft={() => {
                this.toggleNft();
              }}
              manage={() => {
                this.toggleWallet();
              }}
              value={this.state.search}
              onSubmitEditing={(text: any) => {
                // BUG PRESERVED: updateSearch() takes no params; argument is ignored
                // @ts-ignore
                this.updateSearch(this.state.search);
              }}
              onChangeText={(text: any) => {
                this.setState({ search: text, fromSearch: true });
                // BUG PRESERVED: updateSearch() takes no params; argument is ignored
                // @ts-ignore
                this.updateSearch(text);
              }}
            />
          </View>
          <View style={{ marginTop: heightDimen(10) }} />

          <View style={{ flex: 1 }}>
            {/* ------------------------------------------------------------------- */}
            {this.props?.coinList?.length == 0 && (
              <View style={styles.emptyView1}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.txtNoAssets,
                    { color: ThemeManager.colors.TextColor },
                  ]}
                >
                  {this.state.loading ? "" : walletMain.noassetsfound}
                </Text>
              </View>
            )}
            {this.props?.coinList?.length > 0 && (
              <View>
                <CoinList
                  refScroll={this.flatListRef}
                  refreshControl={
                    <RefreshControl
                      enabled={true}
                      refreshing={this.state.refreshing}
                      onRefresh={() => this.onRefresh()}
                    />
                  }
                  onEndReached={() => this.onEndReached()}
                  showTransactionHistory="true"
                  coinList={this.props?.coinList}
                  showFooter={true}
                  themeSelected={this.state.themeSelected}
                  isHideBalance={this.state.isHideBalance}
                  showViewAll={this.props?.coinList?.length > 5 ? true : false}
                  buttonText={
                    this.state.showViewAll
                      ? walletMain.viewAll
                      : walletMain.viewLess
                  }
                  paginationLoading={this.state.paginationLoading}
                  onAddressBookPress={() => {
                    Actions.currentScene !== "AddCustomToken" &&
                      (Actions as any).AddCustomToken({
                        themeSelected: "",
                        from: "walletMain",
                      });
                  }}
                />

              </View>
            )}
            {/* ------------------------------------------------------------------- */}
          </View>
          <AppAlert
              visible={this.state.showAlertDialog}
              alertTxt={this.state.alertTxt}
              hideAlertDialog={() => {
                this.setState({ showAlertDialog: false });
              }}
            />

          {/* ********************************************* Exit Modal **************************************** */}
          <Modal
            visible={this.state.showAlertDialogExit}
            onRequestClose={() => this.setState({ showAlertDialogExit: false })}
            transparent
          >
            <AppAlertDialog
              alertTxt={alertMessages.areYouSureWantToExist}
              hideAlertDialog={() => {
                this.setState({ showAlertDialogExit: false });
              }}
              confirmAlertDialog={() => {
                this.setState({ showAlertDialogExit: false });
                BackHandler.exitApp();
              }}
            />
          </Modal>
        </View>

        <LoaderView isLoading={this.state.loading} />
      </BackgroundImage>
    );
  }
}
const mapStateToProp = (state: any) => {
  const { coinList } = state.walletReducer;
  return { coinList };
};
export default connect(mapStateToProp, {
  requestCoinList,
  getRpcUrl,
  getNotiStatus,
  updateDeviceToken,
  getCurrencyPref,
  getBannerList,
})(WalletMain);
