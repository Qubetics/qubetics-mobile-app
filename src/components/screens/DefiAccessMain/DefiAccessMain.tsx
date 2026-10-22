/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import { BackHandler, Dimensions, FlatList, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import DeviceInfo from 'react-native-device-info';
import { EventRegister } from 'react-native-event-listeners';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { fetchNativePrice } from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Images } from '../../../theme';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import { consoleLogFunc, getData, saveData, toFixedExp } from '../../../Utils/MethodsUtils';
import {
  AppAlert,
  GradientBorderView,
  InputtextSearch,
  Item,
  LoaderView
} from '../../common';
import { ConfirmAlert } from '../../common/ConfirmAlert';
import styles from './DefiAccessMainStyle';

class DefiAccessMain extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      enteredURL: '',
      showAlertDialog: false,
      alertTxt: '',
      defiList: [],
      showLoader: false,
      themeSelected: '',
      showAlertDialogConfirm: false,
      alertTxtConfirm: '',
      maticFiatPrice: 0,
      bnbFiatPrice: 0,
      ethFiatPrice: 0,
      walletName: '',
      historyArray: [],
      isViewAll: false
    };
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    getData(Constants.WALLET_NAME).then(async (res) => {
      this.setState({ walletName: res })
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: '',
        alertTxtConfirm: '',
        showAlertDialogConfirm: false,
      });
    });
    this.focusListener =  this.props.navigation.addListener('focus', () => {
      getData(Constants.FAVORITE).then(response => {
        response ? this.setState({ defiList: JSON.parse(response), isLoading: false }) : null;
      });
      getData(Constants.WALLET_NAME).then(async (res) => {
        this.setState({ walletName: res })
      });
      this.getDappList();
      this.setState({ enteredURL: '' });
      this.backhandle = BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
      EventRegister.addEventListener('getThemeChanged', data => {
        this.setState({ themeSelected: data });
      });
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      this._scrollToTop();
      if (this.backhandle) this.backhandle.remove();
      this.setState({ showLoader: false });
    });
  }

  componentWillUnmount() {
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
    if (this.blurListener) (typeof this.blurListener === 'function' ? this.blurListener() : this.blurListener?.remove?.());
  }
  
  /******************************************************************************************/
  _scrollToTop() {
    if (this.scrollRef !== null) {
      if (this.scrollRef.current !== null) {
        this.state.defiList?.length > 0 &&
          this.scrollRef.current.scrollToIndex({ animated: true, index: 0 });
      }
    }
  }

  /******************************************************************************************/
  handleBackButtonClick() {
    consoleLogFunc('Backhandler Defi');
    Singleton.bottomBar?.navigateTab('WalletMain');
    (Actions as any).Main({ type: ActionConst.RESET });

    return true;
  }

  /******************************************************************************************/
  getDappList() {
    const Ethdata = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: 2,
    };
    const Bnbdata = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: 1,
    };
    const Maticdata = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: 4,
    };
    this.props.fetchNativePrice({ data: Maticdata }).then((Maticdata: any) => {
      this.props.fetchNativePrice({ data: Bnbdata }).then((Bnbdata: any) => {
        this.props.fetchNativePrice({ data: Ethdata }).then((Ethdata: any) => {
          consoleLogFunc('chk Ethdata native price:::::', Ethdata);
          this.setState({ maticFiatPrice: toFixedExp(Maticdata?.fiatCoinPrice?.value, 2), bnbFiatPrice: toFixedExp(Bnbdata?.fiatCoinPrice?.value, 2), ethFiatPrice: toFixedExp(Ethdata?.fiatCoinPrice?.value, 2), });
        });
      })
    }).catch((err: any) => {
      if (err == LanguageManager.alertMessages.pleaseCheckYourNetworkConnection) {
        this.setState({ showAlertDialog: true, alertTxt: LanguageManager.alertMessages.pleaseCheckYourNetworkConnection });
      }
    });

    getData(Constants.DAPP_HISTORY).then(response => {
      if (response) {
        consoleLogFunc("JSON.parse(response)?.length>>>", JSON.parse(response)?.length);

        let historyData = JSON.parse(response);
        if (historyData?.length > 10) {
          historyData = historyData.slice(0, 10)
        }
        this.setState({ historyArray: historyData, isViewAll: JSON.parse(response)?.length > 10 ? true : false });
      };
    })
  }

  notiPressed() {
    Singleton.isNotification = false
    this.setState({ is_notification: false });
    Actions.currentScene != "NotificationsTab" &&
      (Actions as any).NotificationsTab({ themeSelected: this.state.themeSelected });
  }




  /******************************************************************************************/
  validURL(str: any) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    return !!pattern.test(str);
  }

  /******************************************************************************************/
  submitPressed(url: any, item = '') {
    consoleLogFunc(url, 'chk url?.includes::::::', url?.includes('pancake'))
    if (!(global as any).isConnected) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.pleaseCheckYourNetworkConnection,
      });
    }
    Actions.currentScene != 'DappBrowserNew' && (Actions as any).DappBrowserNew({
      item: item,
      url: url,
      themeSelected: this.state.themeSelected,
    });
    this.setState({ enteredURL: '' });
  }

  /******************************************************************************************/
  onSubmit() {
    if (this.validURL(this.state.enteredURL)) {
      if (!this.state.enteredURL.startsWith('http')) {
        this.setState({ enteredURL: 'https://' + this.state.enteredURL }, () =>
          this.submitPressed(this.state.enteredURL),
        );
      } else {
        this.setState({ enteredURL: this.state.enteredURL }, () =>
          this.submitPressed(this.state.enteredURL),
        );
      }
    } else {
      this.setState({ enteredURL: 'https://www.google.com/search?q=' + this.state.enteredURL }, () => this.submitPressed(this.state.enteredURL),);
    }
  }

  /******************************************************************************************/

  /******************************************************************************************/
  callDelete() {
    this.setState({ defiList: [] }, () => {
      saveData(Constants.FAVORITE, JSON.stringify(this.state.defiList));
    });
  }

  /******************************************************************************************/
  render() {
    const { walletMain, setting } = LanguageManager;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <View
          style={{
            width: Dimensions.get('screen').width,
            paddingTop: Platform.OS == 'ios'
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
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>

                  <GradientBorderView
                    gradientStyle={{ height: widthDimen(46), width: widthDimen(46) }}
                    mainStyle={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={[styles.walletNameIcon, { color: ThemeManager.colors.blackWhiteText }]}>{this.state.walletName?.charAt(0)?.toUpperCase()}</Text>

                  </GradientBorderView>
                  <Text
                    ellipsizeMode="tail"
                    style={[styles.walletName, { color: ThemeManager.colors.blackWhiteText }]}
                  >
                    {this.state.walletName}
                  </Text>
                  <Image source={ThemeManager.ImageIcons.newDropDown}
                    style={{ resizeMode: "contain", marginLeft: widthDimen(8) }} />

                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => this.notiPressed()}
                style={[(styles as any).touchableStyle]}
              >

                <Image
                  style={[(styles as any).imgNoti]}
                  source={
                    Singleton.isNotification
                      ? Images.notiDot
                      : Images.noti
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
          <InputtextSearch
            style={{ width: "88%" }}
            placeholder={walletMain.addUrl}
            onSubmitEditing={() => {
              this.onSubmit();
            }}
            value={this.state.enteredURL}
            search={!this.state.enteredURL ? true : false}
            onChangeNumber={(text: any) => {
              this.setState({ enteredURL: text });
            }}
            pressClear={() => {
              this.setState({ enteredURL: "" });
            }}
            autoCapitalize={"none"}
            returnKeyType={"done"}
          />
        </View>
        <View style={{ flex: 1, marginTop: 15, marginBottom: 10, paddingHorizontal: 15 }}>

          <View style={{ justifyContent: "space-between", flexDirection: "row" }}>
            <Text
              style={{
                color: ThemeManager.colors.blackWhiteText,
                ...styles.headerName,
              }}
            >History</Text>

            {this.state.isViewAll && <TouchableOpacity onPress={() => {
              Actions.currentScene != "DappHistory" && (Actions as any).DappHistory({
                themeSelected: this.state.themeSelected,
                maticFiatPrice: this.state.maticFiatPrice,
                bnbFiatPrice: this.state.bnbFiatPrice,
                ethFiatPrice: this.state.ethFiatPrice,
              })
            }}>
              <Text
                style={{
                  ...styles.headerName,
                  fontSize: heightDimen(14),
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >View All</Text>
            </TouchableOpacity>}

          </View>

          <FlatList
            ref={this.scrollRef}
            bounces={false}
            showsVerticalScrollIndicator={false}
            data={this.state.historyArray}

            renderItem={({ item, index }) => {
              return (
                <Item
                  img={item?.iconUrl}
                  title={item.title}
                  index={index}
                  subtitle={item.url}
                  timestamp={item?.timestamp}
                  onDappPress={() => this.submitPressed(item.url, item)}
                  mainView={{ marginBottom: index == this.state.defiList?.length - 1 ? 50 : 0 }}
                />
              );
            }}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => {
              return (
                <View style={styles.emptyView}>
                  {this.state.defiList?.length == 0 && <View style={{ alignItems: "center" }}>
                    <Image source={Images.noContact} />

                    <Text allowFontScaling={false} style={[styles.txtTitle, { color: ThemeManager.colors.blackWhiteText, }]}>
                      No dApp history found
                    </Text>
                  </View>}

                </View>
              );
            }}
          />

        </View>

        {/* /****************************************************************************************** */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
          }}
        />

        {/* /****************************************************************************************** */}
        {this.state.showAlertDialogConfirm && (
          <ConfirmAlert
            {...({} as any)}
            text={setting.yes}
            alertTxt={this.state.alertTxtConfirm}
            hideAlertDialog={() => {
              this.setState({ showAlertDialogConfirm: false });
            }}
            ConfirmAlertDialog={() => {
              this.setState({ showAlertDialogConfirm: false });
              this.callDelete();
            }}
          />
        )}
        <LoaderView isLoading={this.state.isLoading} />

      </BackgroundImage>
    );
  }
}

export default connect(null, { fetchNativePrice })(
  DefiAccessMain,
);
