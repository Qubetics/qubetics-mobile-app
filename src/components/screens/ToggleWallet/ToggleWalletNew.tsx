import { Component } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  BackHandler,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {
  activeInactiveCoin,
  toogleCoinList
} from "../../../Redux/Actions/WalletAction";
import {
  CommaSeprator1,
  consoleLogFunc,
  getCryptoAddress,
  getData,
} from "../../../Utils/MethodsUtils";
import { Fonts, Images } from "../../../theme";
import {
  LoaderView,
  AppAlert,
  HeaderMain,
  Button,
} from "../../common";
import { connect } from "react-redux";
import { ThemeManager } from "../../../../ThemeManager";
import styles from "./ToggleWalletStyles";
import { Actions } from '../../../navigation/RootNavigation';
import Singleton from "../../../Singleton";
import * as Constants from "../../../Constants";
import { EventRegister } from "react-native-event-listeners";
import { LanguageManager } from "../../../../LanguageManager";
import { SearchToken } from "../../common/SearchToken";
import { horizontalScale } from "../../../layouts/responsive";
import {
  getDimensionPercentage as dimen,
  hasNotchWithIOS,
} from "../../../Utils";
import { Colors } from "../../../theme";

class ToggleWalletNew extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      coinList: [],
      search: "",
      isLoading: true,
      page: 1,
      limit: 25,
      loadList: false,
      totalRecords: "",
      showAlertDialog: false,
      alertText: "",
      txnObj: {
        page: 1,
        limit: 25,
        search: "",
      },
      themeSelected: "",
      isBTCPrivateKeyWallet: false
    };
  }
  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackButtonClick);

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({ search: "", showAlertDialog: false, alertText: "" });
    });
    this.props.navigation.addListener('blur', (event: any) => {
      this.setState({ search: "" });
    });
    this.props.navigation.addListener('focus', (event: any) => {
      consoleLogFunc("focus------")
      this.setState({ search: "" });
      this.setState({ page: 1 });

      this.fetchCoinList(this.state.txnObj);
    });

    getData(Constants.MULTI_WALLET_LIST)
      .then(list => {
        let currentWallet = JSON.parse(list)

        currentWallet = currentWallet.find((res: any) => res?.defaultWallet)
        if (currentWallet?.isPrivateKey && currentWallet?.coinFamily == 3) {
          this.setState({ isBTCPrivateKeyWallet: true })
        }
      })
  }
  handleBackButtonClick() {
    consoleLogFunc('back----');
    Actions.pop()

    return true;
  };
  /* *********************************************fetchCoinList***************************************** */
  fetchCoinList(dataObj: any, fromPagination = false, fromRefresh = false) {
    this.setState({ isLoading: fromRefresh ? false : true });
    consoleLogFunc("dataObj==", dataObj)
    setTimeout(() => {
      this.props
        .toogleCoinList({ dataObj })
        .then(async (response: any) => {
          if (response.data?.length > 0) {

            let newArray: any[] = []
            response.data.map((data: any) => {
              newArray.push(data)
            });
            this.setState({
              coinList: fromPagination
                ? this.state.coinList.concat(newArray)
                : newArray,
              totalRecords: response?.meta?.total,
            });
            setTimeout(() => {
              this.setState({ loadList: true, isLoading: false })
            }, 400);
          } else {
            this.setState({
              isLoading: false,
              loadList: false,
              coinList: fromPagination ? this.state.coinList : [],
            });
          }
        })
        .catch((e: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertText: e,
          });
        });
    }, 150);
  }

  /* *********************************************onPressIcon***************************************** */
  onPressIcon = () => {

    Actions.currentScene != "UpdateWatchList" &&
      (Actions as any).UpdateWatchList({ fromToggle: true });
  };

  manage() {

    Actions.currentScene != "Manage" &&
      (Actions as any).Manage({ themeSelected: this.state.themeSelected });


  }

  /* *********************************************updateSearch***************************************** */
  // BUG PRESERVED: updateSearch takes no params but callers pass the search text
  updateSearch(..._args: any[]) {
    if (this.timer != undefined) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.getSearchList();
    }, 1000);
  }

  /* *********************************************getSearchList***************************************** */
  getSearchList() {
    const data = {
      page: 1,
      limit: 25,
      search: this.state.search?.trim(),
    };
    this.fetchCoinList(data);
  }

  /* *********************************************onLoadEnd***************************************** */
  onLoadEnd = () => {
    consoleLogFunc("this.state.page:::::::::", this.state.page);
    consoleLogFunc("this.state.page:::::::::", this.state.loadList);

    if (this.state.loadList && this.state.page * this.state.limit < this.state.totalRecords) {
      const page = this.state.page + 1;
      this.setState({ page: page, loadList: false }, () => {
        consoleLogFunc("this.state.page:::::::::after", this.state.page);
        if (this.state.coinList.length != this.state.totalRecords) {
          consoleLogFunc("here::::", 1);
          const data = {
            search: this.state.search,
            page: this.state.page,
            limit: this.state.limit,
          };
          this.fetchCoinList(data, true);
        } else {
          consoleLogFunc("here::::", 11);
        }
      });
    }
  };

  /* *********************************************toggleWalletAction***************************************** */
  toggleWalletAction = async (item: any, index: any) => {
    if (!(global as any).isConnected) {
      this.setState({
        showAlertDialog: true,
        alertText:
          LanguageManager.alertMessages.pleaseCheckYourNetworkConnection,
      });
      return;
    }
    this.setState({ isLoading: true });
    setTimeout(() => {
      const status = item.walletStatus == 1 ? 0 : 1;
      let tempCoinList = this.state.coinList;
      tempCoinList[index].walletStatus = status;
      this.setState({ coinList: tempCoinList });
      this.updateListinApi(item.coin_id, status, item.coin_family);
      return;
    }, 150);
  };

  /* *********************************************updateListinApi***************************************** */
  updateListinApi = (coinId: any, isActive: any, coinFamily: any) => {
    const walletAddress = getCryptoAddress(coinFamily);
    this.props
      .activeInactiveCoin({
        coinId: coinId,
        walletAddress: walletAddress,
        isActive: isActive,
      })
      .then((response: any) => {
        consoleLogFunc("response:::", response);
        this.setState({ page: 1 })
        const data = {
          search: this.state.search,
          page: this.state.page,
          limit: this.state.limit,
        };


        this.fetchCoinList(data, false);
      })
      .catch((e: any) => {
        consoleLogFunc("chk e::::::", e);
        if (
          e == LanguageManager.alertMessages.pleaseCheckYourNetworkConnection
        ) {
          this.setState({
            showAlertDialog: true,
            alertText:
              LanguageManager.alertMessages.pleaseCheckYourNetworkConnection,
          });
        }
        this.setState({ isLoading: false });
      });
  };

  //******************************************************************************************/
  onRefresh = () => {
    this.setState({ page: 1 })
    const data = {
      search: this.state.search,
      page: 1,
      limit: this.state.limit,
    };
    this.fetchCoinList(data, false, true);
  };

  //******************************************************************************************/
  render() {
    const { walletMain } = LanguageManager;
    return (
      <BackgroundImage
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        source={ThemeManager.ImageIcons.mainBgImgNew}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, }}
        >
          <HeaderMain
            onPressIcon={() => this.onPressIcon()}
            imgSecond={Images.ic_star_gray}
            imgNew={ThemeManager.ImageIcons.manageNewIcon}
            onPressImgNew={() => this.manage()}
            imgSecondStyle={{ tintColor: ThemeManager.colors.blackWhiteText }}
            imgStyle1={{ tintColor: ThemeManager.colors.blackWhiteText }}
            BackButtonText={walletMain.searchAssets}
            backCallBack={() => Actions.pop()}
          />
          <View style={{ flex: 1, }}>

            {/* -------------------------------------------------------- */}
            <View style={{ marginHorizontal: horizontalScale(22) }}>
              <SearchToken
                isIconsShow={false}
                value={this.state.search}
                onSubmitEditing={(text: any) => {
                  this.updateSearch(this.state.search);
                }}
                onChangeText={(text: any) => {
                  this.setState({ search: text }, () => this.updateSearch(text));
                }}
                viewStyle={{ marginRight: 0 }}
              />
            </View>
            {/* -------------------------------------------------------- */}
            <View style={{ height: '76%', }}>
              {this.state.coinList.length > 0 ? (
                <FlatList
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={(item, index) => index + " "}
                  refreshControl={
                    <RefreshControl
                      refreshing={false}
                      onRefresh={() => {
                        this.onRefresh();
                      }}
                    />
                  }
                  contentContainerStyle={{ marginTop: dimen(15), paddingBottom: 15 }}
                  data={this.state.coinList}
                  onEndReachedThreshold={0.1}
                  ItemSeparatorComponent={() => {
                    return (
                      <View
                        style={[
                          styles.ViewStyle3,
                          { backgroundColor: ThemeManager.colors.grayColor },
                        ]}
                      />
                    );
                  }}
                  onEndReached={() => {
                    this.onLoadEnd();
                  }}
                  renderItem={({ item, index }) => {
                    return (
                      <View
                        // @ts-ignore BUG PRESERVED: resizeMode is not a View prop
                        resizeMode={"contain"}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          flexDirection: 'row',
                          marginHorizontal: horizontalScale(24),
                          backgroundColor: ThemeManager.colors.mnemonicsBg,
                          borderRadius: 10,
                          marginBottom: 10
                        }}

                      >
                        <View
                          style={[
                            styles.ViewStyle,
                            {

                            },
                          ]}
                        >
                          <View style={styles.ViewStyle4}>
                            {item?.coin_image ? (
                              <Image
                                source={{ uri: item?.coin_image }}
                                style={[
                                  styles.imgStyle,
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.imgView,
                                  {
                                    backgroundColor:
                                      ThemeManager.colors.borderUnderLine,
                                  },
                                ]}
                              >
                                <Text
                                  allowFontScaling={false}
                                  style={{ color: ThemeManager.colors.Text }}
                                >
                                  {item?.coin_name?.charAt(0)}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                            <View style={{ alignItems: "flex-start", marginTop: 5 }}>
                              <Text
                                allowFontScaling={false}
                                style={[
                                  styles.coinName,
                                  { color: ThemeManager.colors.blackWhiteText, },
                                ]}
                              >
                                {item?.coin_name.toString().length > 13
                                  ? item?.coin_name.substring(0, 11) + "..."
                                  : item?.coin_name}{" "}
                                {(item?.is_token == 1 || item.coin_family == 1) ? (
                                  <Text
                                    allowFontScaling={false}
                                    style={[styles.TextStyle, { color: ThemeManager.colors.blackWhiteText }]}
                                  >
                                    {item.coin_family == 1
                                      ? " (BEP-20)"
                                      : item.coin_family == 2
                                        ? " (ERC-20)"
                                        : item.coin_family == 6
                                          ? " (TRC-20)"
                                          : item.coin_family == 4
                                            ? " (POL ERC-20)"
                                            : item.coin_family == 5
                                              ? " (SPL)" : item.coin_family == 7
                                                ? " TICS" : null}
                                  </Text>
                                ) : null}
                              </Text>

                              <View style={{ flexDirection: "row" }}>
                                <Text
                                  allowFontScaling={false}
                                  style={{
                                    fontSize: dimen(14),
                                    fontFamily: Fonts.dmRegular,
                                    color: ThemeManager.colors.TextColor,
                                  }}
                                >
                                  {Singleton.getInstance().CurrencySymbol}{CommaSeprator1(
                                    parseFloat(item.fiat_price_data?.value),
                                    2
                                  )}
                                </Text>


                                {item?.fiat_price_data?.price_change_percentage_24h?.toString().includes("-") ? (
                                  <View style={styles.viewStyle2}>

                                    <Text
                                      allowFontScaling={false}
                                      style={[
                                        styles.titleTextStyleNew,
                                        { color: Colors.lossColor, paddingLeft: 2 },
                                      ]}
                                    >
                                      {'-'}{item?.fiat_price_data?.price_change_percentage_24h
                                        ? item?.fiat_price_data?.price_change_percentage_24h
                                          .toFixed(2)
                                          .toString()
                                          .replace(/[-]/g, "")
                                        : 0.0}
                                      %
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.viewStyle2}>

                                    <Text
                                      allowFontScaling={false}
                                      style={[
                                        styles.titleTextStyleNew,
                                        { color: Colors.profitColor, },
                                      ]}
                                    >{'+'}{item?.fiat_price_data?.price_change_percentage_24h
                                      ? (item?.fiat_price_data?.price_change_percentage_24h).toFixed(2)
                                      : 0.0}
                                      %
                                    </Text>
                                  </View>
                                )}




                              </View>

                            </View>
                            <TouchableOpacity
                              disabled={Singleton.getInstance().isMakerWallet}
                              style={{ flex: 0.2, alignItems: "flex-end" }}
                              onPress={() => {
                                this.toggleWalletAction(item, index);
                              }}
                            >
                              <Image
                                source={
                                  item?.walletStatus == 1
                                    ? ThemeManager.ImageIcons.toggleNewIcon
                                    : ThemeManager.ImageIcons.toggleOff
                                }
                                style={styles.toggleimg}
                                resizeMode="contain"
                              />
                            </TouchableOpacity>
                          </View>

                        </View>
                      </View>
                    );
                  }}
                />
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.textStyle,
                    { color: ThemeManager.colors.grayTextColor },
                  ]}
                >
                  {this.state.isLoading ? "" : walletMain.Noasset}
                </Text>
              )}
            </View>
            <View style={{ marginHorizontal: 24, marginBottom: hasNotchWithIOS() ? dimen(52) : dimen(30) }}>
              <Button
                disabled={Singleton.getInstance().isMakerWallet || this.state.isBTCPrivateKeyWallet}
                onPress={() => {
                  Actions.currentScene !== "AddCustomToken" &&
                    (Actions as any).AddCustomToken({ themeSelected: "" });
                }}
                customStyle={{ marginTop: 20 }}
                buttontext={LanguageManager.addressBook.addCustomToken}
              />
            </View>
            {/* -------------------------------------------------------- */}
          </View>

          <LoaderView isLoading={this.state.isLoading} />

          <AppAlert
            visible={this.state.showAlertDialog}
            alertTxt={this.state.alertText}
            hideAlertDialog={() => {
              this.setState({ showAlertDialog: false });
            }}
          />
        </KeyboardAvoidingView>
      </BackgroundImage>
    );
  }
}
export default connect(null, { toogleCoinList, activeInactiveCoin })(
  ToggleWalletNew
);
