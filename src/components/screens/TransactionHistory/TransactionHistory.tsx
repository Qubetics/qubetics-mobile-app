/* eslint-disable react-native/no-inline-styles */
import {Component} from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import DeviceInfo from 'react-native-device-info';
import {EventRegister} from 'react-native-event-listeners';
import {Actions} from '../../../navigation/RootNavigation';
import {connect} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import {
  TransactionList,
  AppAlert,
  LoaderView,
  HeaderMain,
} from '../../common';
import {
  CommaSeprator1,
  consoleLogFunc,
  exponentialToDecimal,
  getCryptoAddress,
  getData,
  saveData,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import {
  getTransactionList,
  getCoinDetails,
  getUserBalance,
  getCurrencyPref,
} from '../../../Redux/Actions';
import styles from './TransactionHistoryStyle';
import {Images} from '../../../theme';
import Singleton from '../../../Singleton';
import {
  getDimensionPercentage,
} from '../../../Utils';
import {moderateScale, verticalScale} from '../../../layouts/responsive';
import images from '../../../theme/Images';

// Brighter than the theme profit/loss colors so the 24h change stays readable on the dark coin card.
const PRICE_CHANGE_PROFIT_COLOR = '#2EEA74';
const PRICE_CHANGE_LOSS_COLOR = '#FF5A5F';
import {updateWatchList} from '../../../Redux/Actions';
import PortfolioButtonUntyped from '../../subcommon/atoms/PortfolioButton';
// PortfolioButton is a JS component whose props are inferred as all-required
const PortfolioButton: any = PortfolioButtonUntyped;
import GraphComponent from '../../common/GraphComponent';
import {CosmoModalSend} from '../../common/CosmoModalSend';
import Clipboard from '@react-native-clipboard/clipboard';

class TransactionHistory extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      selectedCoin: this.props.selectedCoin,
      isLoading: true,
      transactionList: [],
      showAlertDialog: false,
      isSwapAvailable: true,
      alertTxt: '',
      totalRecords: '',
      loadList: false,
      page: 1,
      limit: 25,
      isDisable: false,
      isSelectedWishList: !!this.props.selectedCoin?.coin?.watchlist_data,
      dataObj: {
        status: '',
        coin_id: this.props.selectedCoin.coin_id,
        coin_type: this.props.selectedCoin.coin_symbol,
        coin_family: [this.props.selectedCoin.coin_family],
        trnx_type: '',
        from_date: '',
        to_date: '',
        addrsListKeys: [
          this.props.selectedCoin.wallet_address,
          Singleton.getInstance().defaultCosmosAddress,
        ],
        page: 1,
        limit: 25,
      },
      showSuccess: false,
      balance: this.props.selectedCoin?.balance,
      buttonClicked: false,
      showFullGraph: false,
      graphData: {graph_pair: '', graph_source: ''},
      isCosmosModal: false,
      showShare: false,
      setSelectedAddress: this.props.selectedCoin.wallet_address,
      isSelectAddress: false,
    };
  }

  //******************************************************************************************/
  componentDidMount() {
    consoleLogFunc('TransactionHistory--props--', this.props.selectedCoin);

    EventRegister.addEventListener('hitWalletApi', () => {
      this.fetchUpdatedBalance();
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: '',
        showSuccess: false,
        isCosmosModal: false,
      });
      Share.dismissedAction;
    });

    getData('txnHistory').then(txnHistory => {
      if (txnHistory) this.setState({transactionList: JSON.parse(txnHistory)});
    });

    if (Singleton.getInstance()?.CurrencySelected != 'USD') {
      this.props?.getCurrencyPref();
    }

    this.focus = this.props.navigation.addListener('focus', (event: any) => {
      this.setState({buttonClicked: false});
      this.backhandle = BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
      this.fetchTxnHistory(this.state.dataObj);
      this.fetchUpdatedBalance();
      this.setState({isDisable: false});
    });
    this.unfocus = this.props.navigation.addListener('blur', () => {
      this.setState({showFullGraph: false});
    });
    EventRegister.addEventListener('enableTouchable', data => {
      this.setState({isDisable: false});
    });
  }

  getUserBalanceFunction() {
    this.setState({isLoading: true});
    return new Promise((resolve, reject) => {
      const item = this.props.selectedCoin;
      const data = {
        wallet_address: item?.wallet_address,
        coin_id: item?.coin_id,
      };
      this.props
        .getUserBalance({data})
        .then((res: any) => {
          this.setState({isLoading: false});

          resolve(res == 0 ? this.state.balance : res);
        })
        .catch((err: any) => {
          consoleLogFunc('BALANCE_ERR>>>>', this.state.balance, err);
          this.setState({isLoading: false});

          resolve(this.state.balance);
        });
    });
  }
  /******************************************************************************************/
  handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    Actions.pop();
    return true;
  };

  /******************************************************************************************/
  fetchTxnHistory(getTxnReq: any, fromPagination = false) {
    this.setState({isLoading: true});
    setTimeout(() => {
      this.props
        .getTransactionList({getTxnReq})
        .then((res: any) => {
          if (res.data.length > 0) {
            this.setState({
              totalRecords: res.meta.total,
              loadList: true,
              transactionList: fromPagination
                ? this.state.transactionList.concat(res.data)
                : res.data,
            });
          } else {
            this.setState({
              transactionList: fromPagination ? this.state.transactionList : [],
            });
          }
          setTimeout(() => {
            this.setState({isLoading: false});
          }, 400);
        })
        .catch((e: any) => {
          this.setState({isLoading: false, loadList: false});
        });
    }, 150);
  }

  /******************************************************************************************/
  componentWillUnmount() {
    this.backhandle?.remove();
    typeof this.focus === 'function' ? this.focus() : this.focus?.remove?.();
    typeof this.unfocus === 'function'
      ? this.unfocus()
      : this.unfocus?.remove?.();
  }

  /******************************************************************************************/
  fetchUpdatedBalance() {
    const item = this.props.selectedCoin;
    const data = {
      wallet_address: item?.wallet_address,
      coin_id: item?.coin_id,
      cmc_id: item?.coin?.cmc_id,
      fiat_currency: 'USD',
    };
    this.props
      .getCoinDetails({data})
      .then((res: any) => {

        this.setState({
          balance: res?.data?.balance,
          graphData: {
            ...res?.data?.coin,
            graph: res?.graph,
            cmc_id: item?.coin?.cmc_id,
            moralis: res?.moralis,
          },
          isSwapAvailable:
            res?.data?.coin?.for_swap == 1 ||
            res?.data?.coin?.cross_chain_data != null,
        });
      })
      .catch((err: any) => {
        consoleLogFunc('chk getCoinDetails err::::', err);
      });
  }

  /******************************************************************************************/
  fetchNextPageData() {
    if (this.state.loadList) {
      const page = this.state.page + 1;
      this.setState({page: page, loadList: false}, () => {
        if (this.state.transactionList.length != this.state.totalRecords) {
          const data = {
            status: '',
            coin_id: this.props.selectedCoin.coin_id,
            coin_type: this.props.selectedCoin.coin_symbol,
            coin_family: [this.props.selectedCoin.coin_family],
            trnx_type: '',
            from_date: '',
            to_date: '',
            addrsListKeys: [
              this.props.selectedCoin.wallet_address,
              Singleton.getInstance().defaultCosmosAddress,
            ],
            page: this.state.page,
            limit: this.state.limit,
          };
          this.fetchTxnHistory(data, true);
        } else {
          consoleLogFunc('here::::', 11);
        }
      });
    }
  }

  /******************************************************************************************/
  shareAddress(addressTxt: any, address: any) {
    const symbol =
      this.state.selectedCoin.is_token == 1
        ? this.state.selectedCoin.coin_family == 2
          ? ' ERC-20'
          : this.state.selectedCoin.coin_family == 1
          ? ' BEP-20'
          : this.state.selectedCoin.coin_family == 4
          ? ' POL ERC-20'
          : this.state.selectedCoin.coin_family == 6
          ? 'TRC-20'
          : this.state.selectedCoin.coin_family == 5
          ? ' SPL(SOL)'
          : this.state.selectedCoin.coin_family == 7
          ? ' TICS'
          : ''
        : (Constants.COIN_INFO_BY_FAMILY as any)[this.state.selectedCoin.coin_family]
            .coin_symbol;
    try {
      this.setState({isDisable: true});
      Singleton.isPermission = true;

      // BUG PRESERVED: Share.share is not awaited, so result.action is undefined
      const result: any = Share.share({
        message:
          'Qubetics wallet\nMy ' +
          symbol?.toUpperCase() +
          ' Address:' +
          address,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error: any) {
      this.setState({showAlertDialog: true, alertTxt: error.message});
    }
  }

  /******************************************************************************************/
  set_Text_Into_Clipboard = async () => {
    await Clipboard.setString(this.state.selectedCoin.wallet_address);
    this.setState({
      showAlertDialog: true,
      alertTxt: LanguageManager.alertMessages.walletAddressCopied,
      showSuccess: true,
    });
  };

  /******************************************************************************************/
  async navigateToTransactionScreen() {
    let balance = await this.getUserBalanceFunction();
    let selectedCoin = this.state.selectedCoin;
    selectedCoin = {...selectedCoin, balance: balance};
    if (
      selectedCoin.coin_family == 1 ||
      selectedCoin.coin_family == 4 ||
      selectedCoin.coin_family == 7
    ) {
      if (selectedCoin.coin_family == 7) {
        this.setState({
          isCosmosModal: true,
        });
      } else {
        Actions.currentScene != 'SendBnbPol' &&
          (Actions as any).SendBnbPol({
            selectedCoin: selectedCoin,
            themeSelected: this.props.themeSelected,
          });
      }
    } else if (selectedCoin.coin_family == 2) {
      Actions.currentScene != 'Send' &&
        (Actions as any).Send({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
        });
    } else if (selectedCoin.coin_family == 3) {
      Actions.currentScene != 'SendBtc' &&
        (Actions as any).SendBtc({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
        });
    } else if (selectedCoin.coin_family == 5) {
      Actions.currentScene != 'SendSol' &&
        (Actions as any).SendSol({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
        });
    } else if (selectedCoin.coin_family == 6) {
      Actions.currentScene != 'SendTrx' &&
        (Actions as any).SendTrx({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
        });
    }
  }

  /******************************************************************************************/
  getTagLabel() {
    const {selectedCoin} = this.state;
    if (selectedCoin.coin_family == 2 && selectedCoin.is_token == 1) {
      return 'ERC-20';
    } else if (selectedCoin.coin_family == 1 && selectedCoin.is_token == 1) {
      return 'BEP-20';
    } else if (selectedCoin.coin_family == 4 && selectedCoin.is_token == 1) {
      return 'POL ERC-20';
    } else if (selectedCoin.coin_family == 6 && selectedCoin.is_token == 1) {
      return 'TRC-20';
    } else if (selectedCoin.coin_family == 5 && selectedCoin.is_token == 1) {
      return 'SPL';
    } else if (selectedCoin.coin_family == 7 && selectedCoin.is_token == 1) {
      return 'TICS';
    } else {
      return '';
    }
  }

  itemPressedOnIcon(item: any, index: any) {
    const {walletMain} = LanguageManager;
    this.setState({
      showShare: false,
      buttonClicked: true,
    });
    if (item?.toLowerCase() == walletMain.send.toLowerCase()) {
      return this.navigateToTransactionScreen();
    } else if (item?.toLowerCase() == walletMain.receive.toLowerCase()) {
      Actions.currentScene != 'Receive' &&
        (Actions as any).Receive({
          selectedCoin: this.state.selectedCoin,
          themeSelected: this.state.themeSelected,
        });
    }
    setTimeout(() => {
      this.setState({buttonClicked: false});
    }, 1000);
  }

  /******************************************************************************************/
  getValue = (bal: any) => {
    if (bal > 0) {
      const NewBal =
        bal < 0.000001
          ? toFixedExp(bal, 8)
          : bal < 0.0001
          ? toFixedExp(bal, 6)
          : toFixedExp(bal, 4);
      return NewBal;
    } else return '0.0000';
  };

  /******************************************************************************************/
  getFiatValue(bal: any) {
    if (bal > 0) {
      const NewBal =
        bal < 0.000001
          ? toFixedExp(bal, 8)
          : bal < 0.0001
          ? toFixedExp(bal, 6)
          : toFixedExp(bal, 2);
      return NewBal;
    } else return '0.00';
  }

  /******************************************************************************************/
  getFiatValueWithComma(bal: any) {
    if (bal > 0) {
      const NewBal =
        bal < 0.0000001
          ? toFixedExp(bal, 12)
          : bal < 0.000001
          ? CommaSeprator1(bal, 8)
          : bal < 0.001
          ? CommaSeprator1(bal, 6)
          : bal < 0.01
          ? CommaSeprator1(bal, 4)
          : CommaSeprator1(bal, 2);
      return NewBal;
    } else return '0.00';
  }

  onPressStar() {
    this.setState({isLoading: true});
    this.setState({isSelectedWishList: !this.state.isSelectedWishList});
    setTimeout(() => {
      const Arr = [];
      const data1: any = {};
      data1['coin_id'] = this.props.selectedCoin.coin_id;
      (data1['address'] = getCryptoAddress(
        this.props.selectedCoin.coin_family,
      )), // item.coin_family == 3 ? Singleton.getInstance().defaultBtcAddress : item.coin_family == 5 ? Singleton.getInstance().defaultLtcAddress : Singleton.getInstance().defaultEthAddress;
        (data1['status'] = !this.state.isSelectedWishList ? 0 : 1);
      Arr.push(data1);
      const data = {
        data: Arr,
      };
      this.props
        .updateWatchList({data})
        .then((res: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt:
              LanguageManager.alertMessages.watchlistUpdatedSuccessfully,
            isPop: true,
            showSuccess: true,
          });
        })
        .catch((err: any) => {
          this.setState({isSelectedWishList: false});
          this.setState({
            isLoading: false,
            alertTxt: err,
            showSuccess: false,
          });
        });
    }, 150);
  }

  getLastSelectedCoins = async () => {
    try {
      const address =
        Singleton.getInstance().defaultEthAddress ||
        Singleton.getInstance().defaultBnbAddress;
      const result = await getData(Constants.CROSS_CHAIN_LAST_PAIRS);
      const data = JSON.parse(result);
      return {
        from: data?.[address]?.from || '1',
        to: data?.[address]?.to || '2',
      };
    } catch (error: any) {
      return {from: '1', to: '2'};
    }
  };

  saveLastSelectedCoins = async (from: any, to: any) => {
    const address =
      Singleton.getInstance().defaultEthAddress ||
      Singleton.getInstance().defaultBnbAddress;
    let data = await getData(Constants.CROSS_CHAIN_LAST_PAIRS);
    data = data ? JSON.parse(data) : {};
    const savedCoin = JSON.stringify({...data, [address]: {from, to}});
    consoleLogFunc('savedCoin>>>>', savedCoin);
    saveData(Constants.CROSS_CHAIN_LAST_PAIRS, savedCoin);

    setTimeout(() => {
      this.setState({isLoading: false}, () => {
        Actions.jump('Main', {screen: 'Swap'});
      });
    }, 1000);
  };
  onGraphClose = () => {
    this.setState({showFullGraph: false});
  };

  /******************************************************************************************/
  itemPressedCosmos(item: any, index: any) {
    let selectedCoin = this.state.selectedCoin;
    this.setState({isCosmosModal: false});
    if (item?.key == 'evm') {
      Actions.currentScene != 'SendBnbPol' &&
        (Actions as any).SendBnbPol({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
          balance: this.state.balance,
        });
    } else {
      Actions.currentScene != 'SendCosmos' &&
        (Actions as any).SendCosmos({
          selectedCoin: selectedCoin,
          themeSelected: this.props.themeSelected,
          balance: this.state.balance,
        });
    }
  }
  /******************************************************************************************/
  set_selectedText_Into_Clipboard = async (address: any) => {
    await Clipboard.setString(address);
    this.setState({
      showAlertDialog: true,
      alertTxt: LanguageManager.alertMessages.walletAddressCopied,
      showSuccess: true,
    });
  };

  /******************************************************************************************/
  shareAddressTics(addressTxt: any, address: any) {
    const symbol =
      this.state.selectedCoin.is_token == 1
        ? this.state.selectedCoin.coin_family == 2
          ? ' ERC-20'
          : this.state.selectedCoin.coin_family == 1
          ? ' BEP-20'
          : this.state.selectedCoin.coin_family == 4
          ? ' POL ERC-20'
          : this.state.selectedCoin.coin_family == 6
          ? 'TRC-20'
          : this.state.selectedCoin.coin_family == 5
          ? ' SPL(SOL)'
          : this.state.selectedCoin.coin_family == 7
          ? ' TICS'
          : ''
        : (Constants.COIN_INFO_BY_FAMILY as any)[this.state.selectedCoin.coin_family]
            .coin_symbol;
    try {
      this.setState({isDisable: true});
      Singleton.isPermission = true;

      // BUG PRESERVED: Share.share is not awaited, so result.action is undefined
      const result: any = Share.share({
        message:
          'Qubetics wallet\nMy ' +
          symbol?.toUpperCase() +
          ' Address:' +
          address,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error: any) {
      this.setState({showAlertDialog: true, alertTxt: error.message});
    }
  }

  /******************************************************************************************/
  itemPressedDropDown(item: any, index: any) {
    this.setState({isCosmosModal: false, isSelectAddress: true});
    this.setState({setSelectedAddress: item?.address});
  }
  /******************************************************************************************/

  render() {
    const {sendTrx} = LanguageManager;
    const {selectedCoin} = this.state;
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
        <View style={{flex: 1}}>
          <HeaderMain
            backCallBack={() => {
              Actions.pop();
            }}
            BackButtonText={`${
              selectedCoin.coin_name.toString().length > 12
                ? selectedCoin.coin_name.substring(0, 10) + '...'
                : selectedCoin.coin_name
            } (${selectedCoin.coin_symbol?.toUpperCase()})`}
            imgSecond={

              this.state.isSelectedWishList
                ? images.ic_star_active
                : images.ic_star_gray

            }
            imgSecondStyle={{
              tintColor: this.state.isSelectedWishList
                ? ThemeManager.colors.primaryColor
                : ThemeManager.colors.blackWhiteText,
            }}
            imgNew={images.graphIcon}
            onPressImgNew={() => {
              if (
                this.state.graphData.graph_pair ||
                this.state.graphData.pair_address ||
                this.state.graphData.graph?.length > 0
              ) {
                this.setState({showFullGraph: true});
              } else {
                this.setState({
                  showAlertDialog: true,
                  alertTxt: 'No data available',
                });
              }
            }}
            imgSecondTouchableProps={{
              disabled: Singleton.getInstance().isMakerWallet,
            }}
            onPressIcon={() => this.onPressStar()}
          />
          <View style={[styles.coinInfoTextt]}>
            <BackgroundImage
              style={styles.gradient}
              source={ThemeManager.ImageIcons.homeSubBg}>
              <View style={{...styles.ViewStyle, marginTop: 0}}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.coinStyle,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {selectedCoin.is_token == 0
                    ? LanguageManager.walletMain?.coin
                    : this.getTagLabel()}
                </Text>
                <View style={{flexDirection: 'row'}}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.coinStyle,
                      {color: ThemeManager.colors.blackWhiteText},
                    ]}>
                    {Singleton.getInstance().CurrencySymbol}
                    {this.getFiatValueWithComma(
                      selectedCoin.currentPriceInMarket,
                    )}
                  </Text>
                  {selectedCoin.price_change_percentage_24h
                    ?.toString()
                    .includes('-') ? (
                    <View style={styles.viewStyle2}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.titleTextStyleNew,
                          {
                            color: PRICE_CHANGE_LOSS_COLOR,
                            paddingLeft: 2,
                            paddingRight: 0,
                          },
                        ]}>
                        {'-'}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.titleTextStyleNew,
                          {color: PRICE_CHANGE_LOSS_COLOR, paddingLeft: 2},
                        ]}>
                        {selectedCoin.price_change_percentage_24h
                          ? selectedCoin.price_change_percentage_24h
                              .toFixed(2)
                              .toString()
                              .replace(/[-]/g, '')
                          : 0.0}
                        %
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.viewStyle2}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          {
                            color: PRICE_CHANGE_PROFIT_COLOR,
                            marginBottom:
                              Platform.OS == 'ios'
                                ? DeviceInfo.hasNotch() ||
                                  DeviceInfo.hasDynamicIsland()
                                  ? getDimensionPercentage(3)
                                  : getDimensionPercentage(5)
                                : getDimensionPercentage(0),
                          },
                        ]}>
                        {'+'}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.titleTextStyleNew,
                          {color: PRICE_CHANGE_PROFIT_COLOR},
                        ]}>
                        {selectedCoin.price_change_percentage_24h
                          ? selectedCoin.price_change_percentage_24h.toFixed(2)
                          : 0.0}
                        %
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {selectedCoin.coin_image ? (
                <Image
                  style={styles.ImgStyle1}
                  source={{uri: selectedCoin.coin_image}}
                />
              ) : (
                <View
                  style={[
                    styles.ImgStyle,
                    {backgroundColor: ThemeManager.colors.Mainbg},
                  ]}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.coinSymbolStyle,
                      {
                        color: ThemeManager.colors.blackWhiteText,
                        textTransform: 'capitalize',
                        paddingLeft: 0,
                      },
                    ]}>
                    {selectedCoin.coin_symbol?.substring(0, 1)}
                  </Text>
                </View>
              )}

              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.coinInfoValue,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {this.getValue(this.state.balance)}{' '}
                  {selectedCoin.coin_symbol.toUpperCase()}
                </Text>
              </View>
              <View style={{flexDirection: 'row'}}>
                <Image
                  style={styles.aprroxEqualIconStyle}
                  source={ThemeManager.ImageIcons.approxEqual}
                />
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.coinInfoUSDValue,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {Singleton.getInstance().CurrencySymbol}{' '}
                  {this.getFiatValue(
                    exponentialToDecimal(
                      this.state.balance * selectedCoin.currentPriceInMarket,
                    ),
                  )}{' '}
                </Text>
              </View>

              {/* *************Send Receive Swap **************** */}

            </BackgroundImage>
            <View style={styles.sendReceiveSwapview}>
              <View style={styles.styleRow}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <PortfolioButton
                    image={Images.walletSendIcon}
                    text={LanguageManager.walletMain.send}
                    onPress={() => this.itemPressedOnIcon('send', '0')}
                    imageStyle={{
                      ...styles.sendReceiveBtnWrap,
                      borderColor: ThemeManager.colors.darkBg,
                    }}
                  />

                  <PortfolioButton
                    image={Images.walletReceiveIcon}
                    text={LanguageManager.walletMain.receive}
                    color={ThemeManager.colors.blackWhiteText}
                    onPress={() => this.itemPressedOnIcon('Receive', '2')}
                    imageStyle={{
                      ...styles.sendReceiveBtnWrap,
                      borderColor: ThemeManager.colors.darkBg,
                    }}
                  />
                  {this.state.isSwapAvailable && (
                    <PortfolioButton
                      image={Images.walletTradeIcon}
                      isSwapAvailable={this.state.isSwapAvailable}
                      text={LanguageManager.merchantCard.trade}
                      onPress={() => {
                        if (this.state.isSwapAvailable) {
                          const data = {
                            isOnChain:
                              selectedCoin?.coin_family == 1 ||
                              selectedCoin?.coin_family == 2 ||
                              selectedCoin?.coin_family == 4
                                ? true
                                : false,
                            selectedCoin,
                          };
                          Singleton.getInstance().swapSelectedCoin = data;
                          if (data.isOnChain) {
                            Actions.jump('Main', {screen: 'Swap'});
                          } else {
                            this.setState({isLoading: true}, async () => {
                              const lastSelectedCoins =
                                await this.getLastSelectedCoins();
                              let firstCoinId = selectedCoin?.coin_id;
                              let secondCoinId = lastSelectedCoins.to;
                              if (firstCoinId == secondCoinId) {
                                secondCoinId = lastSelectedCoins.from;
                              }
                              this.saveLastSelectedCoins(
                                firstCoinId,
                                secondCoinId,
                              );
                            });
                          }
                        }
                      }}
                      imageStyle={{
                        ...styles.sendReceiveBtnWrap,
                        borderColor: ThemeManager.colors.darkBg,
                      }}
                    />
                  )}
                </View>
              </View>
            </View>

            <View
              style={{
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: 'row',
                marginHorizontal: 15,
                marginTop: verticalScale(20),
                height: verticalScale(50),
                backgroundColor: ThemeManager.colors.mnemonicsBg,
              }}
              // @ts-ignore BUG PRESERVED: source is not a View prop
              source={ThemeManager.ImageIcons.sendCardMain}>
              <View
                style={[
                  styles.addressWrap,
                  {
                  },
                ]}>
                <View style={[styles.addressItem]}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[
                      styles.addressItemText,
                      {color: ThemeManager.colors.blackWhiteText},
                    ]}>
                    {this.state.isSelectAddress
                      ? this.state.setSelectedAddress
                      : selectedCoin.wallet_address}
                  </Text>
                </View>

                {selectedCoin?.coin_family == 7 ? (
                  <>
                    <TouchableOpacity
                      style={{padding: 10}}
                      onPress={() =>
                        this.setState({
                          isCosmosModal: !this.state.isCosmosModal,
                          showShare: true,
                        })
                      }>
                      <Image source={images.dropdown} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.addressButtons}>
                    <TouchableOpacity
                      style={styles.addButtons}
                      onPress={() => this.set_Text_Into_Clipboard()}>
                      <Image
                        source={images.copy1}
                        resizeMode={'contain'}
                        style={{
                          height: moderateScale(20),
                          width: moderateScale(22),
                          resizeMode: 'contain',
                        }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={
                        Platform.OS == 'ios' ? false : this.state.isDisable
                      }
                      style={styles.addButtons}
                      onPress={() => {
                        clearTimeout(this.shareAddressRef);
                        this.shareAddressRef = setTimeout(() => {
                          this.shareAddress(
                            selectedCoin.coin_name,
                            selectedCoin.wallet_address,
                          );
                        }, 800);
                      }}>
                      <Image
                        source={images.share}
                        resizeMode={'contain'}
                        style={{
                          height: moderateScale(20),
                          width: moderateScale(26),
                          resizeMode: 'contain',
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={{flex: 1, marginTop: getDimensionPercentage(24)}}>
              {this.state.transactionList?.length > 0 && (
                <View style={styles.ViewStyle}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.transactionHistoryTitle,
                      {color: ThemeManager.colors.blackWhiteText},
                    ]}>
                    {sendTrx?.transactions}
                  </Text>
                </View>
              )}

              <TransactionList
                selectedCoin={this.props.selectedCoin}
                txnList={this.state.transactionList}
                themeSelected={this.props.themeSelected}
                onScroll={() => {
                  this.fetchNextPageData();
                }}
                isLoading={this.state.isLoading}
              />
            </View>

            <GraphComponent
              headerText={`${
                selectedCoin.coin_name.toString().length > 12
                  ? selectedCoin.coin_name.substring(0, 10) + '...'
                  : selectedCoin.coin_name
              } (${selectedCoin.coin_symbol?.toUpperCase()})`}
              openModel={this.state.showFullGraph}
              graphData={this.state.graphData}
              selectedCoin={selectedCoin}
              onPressClose={this.onGraphClose}
            />

            <AppAlert
              visible={this.state.showAlertDialog}
              showSuccess={this.state.showSuccess}
              alertTxt={this.state.alertTxt}
              hideAlertDialog={() => {
                this.setState({showAlertDialog: false});
              }}
            />
          </View>
          <LoaderView isLoading={this.state.isLoading} />
        </View>

        {this.state.isCosmosModal && (
          <CosmoModalSend
            onPressIn={() =>
              this.setState({isCosmosModal: false, showShare: false})
            }
            openModel={this.state.isCosmosModal}
            showShare={this.state.showShare}
            onPressItem={(item: any, index: any) => {
              !this.state.showShare
                ? this.itemPressedCosmos(item, index)
                : this.itemPressedDropDown(item, index);
            }}
            copy={(item: any) => {
              this.setState({isCosmosModal: false, showShare: false});
              setTimeout(() => {
                this.set_selectedText_Into_Clipboard(item?.address);
              }, 100);
            }}
            Share={(item: any) => {
              this.setState({isCosmosModal: false, showShare: false});
              clearTimeout(this.shareAddressRef);
              this.shareAddressRef = setTimeout(() => {
                this.shareAddressTics(selectedCoin.coin_name, item.address);
              }, 800);
            }}
          />
        )}
      </BackgroundImage>
    );
  }
}
export default connect(null, {
  getTransactionList,
  getCoinDetails,
  getUserBalance,
  updateWatchList,
  getCurrencyPref,
})(TransactionHistory);
