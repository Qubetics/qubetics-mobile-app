/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import {
  FlatList,
  View,
  Image,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  ImageBackground,
  Modal,
} from 'react-native';
import {
  consoleLogFunc,
  getData,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import { Images } from '../../../theme';
import moment from 'moment';
import { ThemeManager } from '../../../../ThemeManager';
import { AppAlert, HeaderMain, GradientBorderView } from '../../common';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { LoaderView } from '../../common/LoaderView';
import styles from './DetailTransactionStyle';
import { getTransactionList, getDVPNList } from '../../../Redux/Actions';
import { connect } from 'react-redux';
import { Actions } from '../../../navigation/RootNavigation';
import { TICS_EXPLORER_URL_LINK } from '../../../EndPoint';
import { EventRegister } from 'react-native-event-listeners';
import { LanguageManager } from '../../../../LanguageManager';
import { BackHandler } from 'react-native';
import ApplyFilter from './ApplyFilter';
import { heightDimen, widthDimen } from '../../../Utils';
import images from '../../../theme/Images';
import Clipboard from '@react-native-clipboard/clipboard';
import GradientText from '../../common/GradientText';
import TransactionDetail from './TransactionDetail';
import DVpnView from './DVpnView';

const TAB_TITLES = ['Transactions', "Chain abstraction",]; //"dVPN", 'Chain abstraction', 
/******************************************************************************************/
function capitalizeFirstLetter(string: any) {
  const text = string ? string?.charAt(0)?.toUpperCase() + string?.slice(1) : ''
  return text?.toLowerCase() == 'withdraw'
    ? LanguageManager.detailTrx.Withdraw
    : text?.toLowerCase() == 'deposit'
      ? LanguageManager.detailTrx.Deposit
      : text?.toLowerCase() == 'approve'
        ? LanguageManager.swapText.approval
        : text?.toLowerCase() == 'card fees'
          ? LanguageManager.detailTrx.cardFee
          : text?.toLowerCase() == 'card recharge'
            ? LanguageManager.detailTrx.cardRecharge
            : text;
}

/******************************************************************************************/
const Item = ({
  item,
  orderData,
  Lastindex,
  address,
}: any) => (
  <TouchableOpacity
    disabled={!item.tx_id ? true : false}
    activeOpacity={0.7}
    onPress={() => {
      consoleLogFunc('item---address', item);
      if (item.type.toLowerCase() == 'cross_chain' && Singleton.getInstance().getStatus(item)?.toLowerCase() != 'failed') {
        return (Actions.currentScene != 'DetailCrossChain' && (Actions as any).DetailCrossChain({ item: item }));
      } 
      // else


      if (item.coin_family == 1) {
        return Linking.openURL('https://bscscan.com/tx/' + item.tx_id);
      } else if (item.coin_family == 2) {
        return Linking.openURL('https://etherscan.io/tx/' + item.tx_id);
      } else if (item.coin_family == 3) {
        return Linking.openURL(
          'https://live.blockcypher.com/btc/tx/' + item.tx_id,
        );
      } else if (item.coin_family == 4) {
        return Linking.openURL('https://polygonscan.com/tx/' + item.tx_id);
      } else if (item.coin_family == 5) {
        return Linking.openURL('https://solscan.io/tx/' + item.tx_id);
      } else if (item.coin_family == 6) {
        return Linking.openURL(
          'https://tronscan.org/#/transaction/' + item.tx_id,
        );
      } else if (item.coin_family == 7) {
        return Linking.openURL(TICS_EXPLORER_URL_LINK + item.tx_id);
      }
    }}
    style={{ paddingHorizontal: 23, marginBottom: Lastindex ? 50 : 10 }}>
    <View
      style={[
        styles.listStyle,
        { backgroundColor: ThemeManager.colors.mnemonicsBg },
      ]}>
      <View
        style={{
          paddingBottom: 15,
          paddingHorizontal: 20,
          paddingTop: 15,
        }}>
        <View
          style={[
            styles.ViewStyle1,
            { borderColor: ThemeManager.colors.dividerColorNew, },
          ]}>
          <View style={styles.ViewStyle2}>
            {item?.type == 'dapp' ? (
              <View
                style={{
                  ...styles.ViewStyle4,
                  backgroundColor: ThemeManager.colors.transactionIconBg,
                }}>
                <Image
                  style={{
                    alignSelf: 'center',
                    height: 20,
                    width: 20,
                    resizeMode: 'contain',
                    tintColor: ThemeManager.colors.blackWhiteText,
                  }}
                  source={Images.wallet_backup}
                />
              </View>
            ) : (
              <View
                style={{
                  ...styles.ViewStyle4,
                  backgroundColor: ThemeManager.colors.transactionIconBg,
                }}>
                <Image
                  style={{ alignSelf: 'center' }}
                  source={Singleton?.getInstance()?.getStatusImage(
                    item,
                    address,
                  )}
                />
              </View>
            )}
            <View style={{ paddingLeft: 8, width: '74%' }}>
              {item?.type == 'dapp' ? (
                <Text
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={[
                    styles.fromValueStyle,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}>
                  {LanguageManager.detailTrx.smartContractExecution}
                </Text>
              ) : (
                <Text
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={[
                    styles.fromValueStyle,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}>
                  {item?.type?.toLowerCase() == 'level_upgradation_fee'
                    ? LanguageManager.referral.levelUpgrade +
                    ' (' +
                    item?.referral_upgrade_level +
                    ')'
                    : item.type?.toLowerCase() == 'withdraw' &&
                      address?.toLowerCase() == item?.from_adrs?.toLowerCase()
                      ? capitalizeFirstLetter(
                        item?.type?.toLowerCase()?.replace('_', ' '),
                      )
                      : item.type?.toLowerCase() == 'withdraw' &&
                        Singleton.getInstance().defaultCosmosAddress?.toLowerCase() ==
                        item?.from_adrs?.toLowerCase()
                        ? capitalizeFirstLetter(
                          item?.type?.toLowerCase()?.replace('_', ' '),
                        )
                        : item?.type?.toLowerCase() == 'withdraw' &&
                          address?.toLowerCase() == item?.to_adrs?.toLowerCase()
                          ? LanguageManager.detailTrx.Deposit
                          : item?.type?.toLowerCase() == 'withdraw' &&
                            Singleton.getInstance().defaultCosmosAddress?.toLowerCase() ==
                            item?.to_adrs?.toLowerCase()
                            ? LanguageManager.detailTrx.Deposit
                            : capitalizeFirstLetter(
                              item?.type?.toLowerCase()?.replace('_', ' '),
                            )}{' '}
                  {item?.amount < 0.000001
                    ? toFixedExp(item?.amount, 8)
                    : item?.amount < 0.01
                      ? toFixedExp(item?.amount, 6)
                      : toFixedExp(item?.amount, 6)}{' '}
                  {item?.coin_data?.coin_symbol?.toUpperCase()}
                </Text>
              )}
              <Text
                allowFontScaling={false}
                style={[
                  styles.transtimeStyle,
                  {
                    color: ThemeManager.colors.legalGreyColor,
                    marginTop: Platform.OS == 'android' ? -5 : 0,
                  },
                ]}>
                {moment(item?.created_at).format('ll')} |{' '}
                {moment(item?.created_at).format('LT')}
              </Text>
            </View>
          </View>

          <View style={{ width: '25%', alignItems: 'flex-end' }}>
            {item?.type.toLowerCase() == 'cross_chain' &&
              Singleton.getInstance().getStatus(item)?.toLowerCase() !=
              'failed' ? (
              <View style={styles.touchableStyle}>
                <Image
                  style={[
                    styles.imgStyle,
                    { tintColor: ThemeManager.colors.blackWhiteText },
                  ]}
                  source={Images.dropdown}
                />
              </View>
            ) : (
              <Text
                allowFontScaling={false}
                style={[
                  styles.transStatusStyle,
                  {
                    textAlign: 'center',
                    marginTop: 10,
                    color: Singleton.getInstance().getStatusColor(item),
                  },
                ]}>
                {Singleton.getInstance().getStatus(item)}
              </Text>
            )}
          </View>
        </View>
        <View style={{ marginTop: 10 }} />

        {item?.is_kyber == 1 && (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromAddressStyle,
              { color: ThemeManager.colors.welcomeCommaName },
            ]}>
            {LanguageManager.detailTrx.contractExcecutedSuccessfully}
          </Text>
        )}

        {item?.from_adrs ? (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromAddressStyle,
              { color: ThemeManager.colors.legalGreyColor },
            ]}>
            {LanguageManager.browser.From} :{' '}
          </Text>
        ) : null}

        {item?.from_adrs ? (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.fromAddressStyleNew,
              { color: ThemeManager.colors.blackWhiteText },
            ]}>
            {item?.from_adrs}
          </Text>
        ) : null}

        <Text
          allowFontScaling={false}
          style={[
            styles.fromAddressStyle,
            { color: ThemeManager.colors.legalGreyColor, marginTop: 10 },
          ]}>
          {LanguageManager.browser.to} :{' '}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.fromAddressStyleNew,
            { color: ThemeManager.colors.blackWhiteText },
          ]}>
          {item.to_adrs}
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 5 }} />
      </View>
    </View>
  </TouchableOpacity>
);

/******************************************************************************************/

const ChainAbstractionView = ({
  item,
  orderData,
  Lastindex,
  address,
  onCopyAddress,
  onViewAbstraction
}: any) => (
  <TouchableOpacity
    activeOpacity={0.7}
    disabled={true}
    style={{ paddingHorizontal: 23, marginBottom: Lastindex ? 50 : 10 }}>
    <View
      style={[
        styles.listStyle,
        { backgroundColor: ThemeManager.colors.mnemonicsBg },
      ]}>
      <View
        style={{
          paddingBottom: 15,
          paddingHorizontal: 20,
          paddingTop: 15,
        }}>
        <View
          style={[
            styles.ViewStyle1,
            { borderColor: ThemeManager.colors.dividerColorNew, borderBottomWidth: 0 },
          ]}>
          <View style={styles.ViewStyle2}>
            {item.type == 'dapp' ? (
              <View
                style={{
                  ...styles.ViewStyle4,
                  backgroundColor: ThemeManager.colors.transactionIconBg,
                }}>
                <Image
                  style={{
                    alignSelf: 'center',
                    height: 20,
                    width: 20,
                    resizeMode: 'contain',
                    tintColor: ThemeManager.colors.blackWhiteText,
                  }}
                  source={Images.wallet_backup}
                />
              </View>
            ) : (
              <View
                style={{
                  ...styles.ViewStyle4,
                  backgroundColor: ThemeManager.colors.transactionIconBg,
                }}>
                <Image
                  style={{ alignSelf: 'center' }}
                  source={Images.icTransactionSwap}
                />
              </View>
            )}
            <View style={{ paddingLeft: 8, width: '74%', alignItems: 'flex-start' }}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.transtimeStyle,
                  {
                    color: ThemeManager.colors.legalGreyColor,
                    marginTop: Platform.OS == 'android' ? -5 : 0,
                  },
                ]}>
                {moment(item.created_at).format('ll')} |{' '}
                {moment(item.created_at).format('LT')}
              </Text>
              {/*transaction  status */}
              {item.type.toLowerCase() == 'cross_chain' &&
                Singleton.getInstance().getStatus(item)?.toLowerCase() !=
                'failed' ? (
                <View style={styles.touchableStyle}>
                  <Image
                    style={[
                      styles.imgStyle,
                      { tintColor: ThemeManager.colors.blackWhiteText },
                    ]}
                    source={Images.dropdown}
                  />
                </View>
              ) : (
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.transStatusStyle,
                    {
                      textAlign: 'center',
                      marginTop: 5,
                      color: Singleton.getInstance().getStatusColor(item),
                    },
                  ]}>
                  {Singleton.getInstance().getStatus(item)}
                </Text>
              )}
            </View>
          </View>
          {/* View Button */}
          <TouchableOpacity onPress={() => { onViewAbstraction(item) }}>
            <GradientBorderView
              gradientStyle={{
                height: widthDimen(40),
                width: widthDimen(70),
              }}
              mainStyle={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={[
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {
                  LanguageManager.walletMain.view
                }
              </Text>
            </GradientBorderView>
          </TouchableOpacity>
        </View>

        {item.is_kyber == 1 && (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromAddressStyle,
              { color: ThemeManager.colors.welcomeCommaName },
            ]}>
            {LanguageManager.detailTrx.contractExcecutedSuccessfully}
          </Text>
        )}

        {item.from_adrs ? (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromAddressStyle,
              { color: ThemeManager.colors.legalGreyColor },
            ]}>
            {LanguageManager.browser.source}
          </Text>
        ) : null}

        {item.from_adrs ? (
          <>
            {sourceDestRowView(
              item?.coin_data?.coin_name?.toLowerCase() == 'qubetics' ? Constants.TICS_Img : Constants.BTC_Img,
              item?.coin_data?.coin_name,
              item?.amount,
              item?.coin_data?.coin_symbol?.toUpperCase()
            )}
          </>
        ) : null}

        <View style={{ height: 0.4, backgroundColor: ThemeManager.colors.dividerColorNew, marginTop: heightDimen(15) }} />

        <Text
          allowFontScaling={false}
          style={[
            styles.fromAddressStyle,
            { color: ThemeManager.colors.legalGreyColor, marginTop: 10 },
          ]}>
          {"Destination Recipient Address"}
        </Text>
        {/* Destination row */}

        <View style={{ flexDirection: 'row', marginTop: 5 }} />

        {/* Destination address view  */}

        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' }} >
          <GradientText
            colors={['#85FFC4', '#5CC6FF', '#BC85FF']}
            text={item.to_adrs}
            containerStyle={{ width: widthDimen(290), alignSelf: 'flex-start' }}
            style={{ fontSize: 16, fontWeight: '600' }}
          />

          <TouchableOpacity
            onPress={() => onCopyAddress(item.to_adrs)}
          >
            <Image
              source={images.copy_clipboard}
              style={{
                alignSelf: 'center',
                height: 20,
                width: 20,
                resizeMode: 'contain',
                tintColor: ThemeManager.colors.blackWhiteText,
              }}
            />
          </TouchableOpacity>
        </View>


      </View>
    </View>
  </TouchableOpacity>
);

const sourceDestRowView = (leftIcon: any, chainName: any, amount: any, chainType: any) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: heightDimen(5) }}>
      {/* Image view */}
      <View
        style={{
          ...styles.ViewStyle4,
        }}>
        <Image
          style={{ alignSelf: 'center', height: 40, width: 40, resizeMode: 'contain' }}
          source={{ uri: leftIcon }}
        />
      </View>
      {/* amount value */}
      <View style={{
        flexDirection: 'row', paddingLeft: widthDimen(10), width: '89%',
        justifyContent: 'space-between'
      }}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.fromAddressStyleNew,
            { color: ThemeManager.colors.blackWhiteText, },
          ]}>
          {chainName ?? ''}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.fromAddressStyleNew,
            { color: ThemeManager.colors.blackWhiteText, },
          ]}>
          {amount ?? ''} {chainType ?? ''}
        </Text>

      </View>
    </View>
  )
}


class DetailTransaction extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      alertTxt: '',
      showAlertDialog: false,
      showFilter: false,
      isLoading: false,
      transactionList: [],
      applyFilterObj: '',
      loadList: false,
      totalRecords: '',
      page: 1,
      limit: 10,
      addressList: '',
      coinFamilyList: '',
      showSuccess: false,
      selectedItem: null,
      activeIndex: 0,
      showAbstractionModal: false,
    };
    this.scrollRef = React.createRef();
  }
  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: '',
        showSuccess: false,
        showFilter: false,
        showAbstractionModal: false,
      });
    });
    getData('txnHistory').then(txnHistory => {
      if (txnHistory) this.setState({ transactionList: JSON.parse(txnHistory) });
    });
    consoleLogFunc('this.props.selectedCoin::::::::', this.props.selectedCoin);
    this.focus = this.props.navigation.addListener('focus', (event: any) => {
      this.setState({ selectedIndex: null });
    });
    this.unfocus = this.props.navigation.addListener('blur', () => {
      this._scrollToTop();
    });
    getData(Constants.ADDRESS_LIST).then(addressList => {
      getData(Constants.COIN_FAMILY_LIST).then(coinFamilyList => {
        consoleLogFunc('getlistfamily>>>> ', coinFamilyList);
        let addressListArray = JSON.parse(addressList);
        if(Singleton.getInstance().defaultMpcEthAddress){
          addressListArray.push(Singleton.getInstance().defaultMpcEthAddress);
        }
        if(Singleton.getInstance().defaultMpcBtcAddress){
          addressListArray.push(Singleton.getInstance().defaultMpcBtcAddress);
        }
        this.setState({
          addressList: addressListArray,
          coinFamilyList: JSON.parse(coinFamilyList),
        });
        const getTxnReq = {
          status: '',
          coin_type: '',
          coin_family: JSON.parse(coinFamilyList),
          trnx_type: '',
          date_from: '',
          date_to: '',
          addrsListKeys: addressListArray,
          page: 1,
          limit: this.state.limit,
        };
        this.fetchTxn(getTxnReq);
      });
    });
  }

  handleBackButtonClick() {
    (Actions as any).pop();

    return true;
  }
  /******************************************************************************************/
  fetchTxn(getTxnReq: any, fromPagination = false) {
    consoleLogFunc('getTxnReq----->>>', getTxnReq);
    this.setState({ isLoading: true });
    setTimeout(() => {
      this.props
        .getTransactionList({ getTxnReq })
        .then((res: any) => {
          consoleLogFunc('chk res::::::', res);
          this.setState({ isLoading: false });
          if (res.data.length > 0) {
            this.setState({
              transactionList: fromPagination
                ? this.state.transactionList.concat(res.data)
                : res.data,
              totalRecords: res.meta.total,
              loadList: true,
              isLoading: false,
              page: getTxnReq.page,
            });
          } else {
            this.setState({
              transactionList: fromPagination ? this.state.transactionList : [],
              isLoading: false,
              page: getTxnReq.page,
            });
          }
        })
        .catch((e: any) => {
          this.setState({ isLoading: false });
        });
    }, 150);
  }
  /******************************************************************************************/
  fetchVPNS(getTxnReq: any, fromPagination = false) {
    consoleLogFunc('fetchVPNS----->>>', getTxnReq);
    this.setState({ isLoading: true });
    setTimeout(() => {
      this.props
        .getDVPNList({ getTxnReq })
        .then((res: any) => {
          this.setState({ isLoading: false, transactionList: [] });
          consoleLogFunc('chk res::::::==>>', res);
        })
        .catch((e: any) => {
          this.setState({ isLoading: false });
        });
    }, 150);
  }

  /******************************************************************************************/
  componentWillUnmount() {
    (typeof this.focus === 'function' ? this.focus() : this.focus?.remove?.());
    (typeof this.unfocus === 'function' ? this.unfocus() : this.unfocus?.remove?.());
  }

  /* *********************************************_scrollToTop***************************************** */
  _scrollToTop() {
    if (this.scrollRef !== null) {
      if (this.scrollRef.current !== null) {
        this.state.transactionList?.length > 0 &&
          this.scrollRef.current.scrollToIndex({ animated: true, index: 0 });
      }
    }
  }

  /******************************************************************************************/
  getFilter = (filterObj: any) => {
    this.setState({ showFilter: false, applyFilterObj: filterObj, page: 1 });
    this.fetchTxn(filterObj);
  };

  /******************************************************************************************/
  openApplyFilter() {
    this.setState({ showFilter: true });
  }

  /******************************************************************************************/
  onLoadEnd() {
    consoleLogFunc('loadList::::', this.state.loadList);
    if (this.state.loadList) {
      let page = this.state.page + 1;
      consoleLogFunc('page::::', page, this.state.transactionList.length, this.state.totalRecords);
      this.setState({ loadList: false }, () => {
        if (this.state.transactionList.length != this.state.totalRecords) {
          consoleLogFunc('here::::', 1);

          const data = {
            status: '',
            coin_type: '',
            coin_family: this.state.coinFamilyList,
            trnx_type: this.state.activeIndex == 1 ? 'chain_abstraction' : '',
            date_from: '',
            date_to: '',
            addrsListKeys: this.state.addressList,
            page: page,
            limit: this.state.limit,
          };
          let data1 = this.state.applyFilterObj || '';
          data1 ? (data1.page = page) : '';
          consoleLogFunc('chk dat1::::::', data1);
          this.fetchTxn(this.state.applyFilterObj ? data1 : data, true);


        } else {
          consoleLogFunc('here::::', 11);
        }
      });
    }
  }

  getAddress = (item: any) => {
    const fromAdd = item?.from_adrs;
    const toAdd = item?.to_adrs;
    let address;
    switch (item?.coin_family) {
      case 1:
        address = Singleton.getInstance().defaultBnbAddress;
        break;
      case 3:
        address = Singleton.getInstance().defaultBtcAddress;
        break;
      case 4:
        address = Singleton.getInstance().defaultMaticAddress;
        break;
      case 5:
        address = Singleton.getInstance().defaultSolAddress;
        break;
      case 6:
        address = Singleton.getInstance().defaultTrxAddress;
        break;
      case 7:
        if (fromAdd?.includes('qubetics') || toAdd?.includes('qubetics')) {
          address = Singleton.getInstance().defaultCosmosAddress;
        } else {
          address = Singleton.getInstance().defaultTicsAddress;
        }
        break;
      default:
        address = Singleton.getInstance().defaultEthAddress;
    }
    return address;
  };

  handlePress = (index: any) => {
    this.setState({ transactionList: [], activeIndex: index, loadList: false, applyFilterObj: '' }, () => {
      if (index == 0) {
        // Transactions
        this.setState({  page: 1 })
        const getTxnReq = {
          status: '',
          coin_type: '',
          coin_family: this.state.coinFamilyList,
          trnx_type: '',
          date_from: '',
          date_to: '',
          addrsListKeys: this.state.addressList,
          page: 1,
          limit: this.state.limit,
        };
        this.fetchTxn(getTxnReq);
      } else if (index == 1) {
        // Chain abstraction
        const getTxnReq = {
          status: '',
          coin_type: '',
          coin_family: this.state.coinFamilyList,
          trnx_type: 'chain_abstraction',
          date_from: '',
          date_to: '',
          addrsListKeys: this.state.addressList,
          page: 1,
          limit: this.state.limit,
        };
        this.setState({ page: 1 }, () => {
          this.fetchTxn(getTxnReq);
        });
      } else if (index == 2) {
        // dVPN
        const getTxnReq = {
          page: 1,
          limit: this.state.limit,
        };
        this.setState({ transactionList: [], page: 1 }, () => {
          this.fetchVPNS(getTxnReq);
        });
      }
    });


  };

  /******************************************************************************************/


  /******************************************************************************************/
  render() {
    const { merchantCard } = LanguageManager;
    const { activeIndex } = this.state;
    return (
      <>
        <ImageBackground
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{
            flex: 1,
            justifyContent: 'space-between',
            backgroundColor: ThemeManager.colors.mainBgNew,
          }}>
          <HeaderMain
            BackButtonText={merchantCard.transactionHistory}
            imgSecond={activeIndex == 0 ? Images.filter : null}
            onPressIcon={() => {
              this.openApplyFilter();
            }}
            imgSecondStyle={{ tintColor: ThemeManager.colors.blackWhiteText }}
            imgStyle1={{ tintColor: ThemeManager.colors.blackWhiteText }}
          />

          <View style={styles.container}>
            <View style={styles.tabRow}>
              {TAB_TITLES.map((title, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => this.handlePress(index)}
                  style={[
                    styles.tabButton,
                    {
                      borderColor:
                        activeIndex === index
                          ? ThemeManager.colors.primaryColor
                          : ThemeManager.colors.seperatorColor,
                    },
                  ]}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeIndex === index
                            ? ThemeManager.colors.primaryColor
                            : ThemeManager.colors.legalGreyColor,
                      },
                    ]}>
                    {title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlatList
            ref={this.scrollRef}
            keyExtractor={(item, index) => index + ''}
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ marginTop: 15 }}
            data={this.state.transactionList ? this.state.transactionList : []}
            onEndReached={() => this.onLoadEnd()}
            onEndReachedThreshold={0.01}
            ListEmptyComponent={() => {
              return (
                <View style={styles.noData}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.transactionHistoryTitle,
                      { color: ThemeManager.colors.blackWhiteText },
                    ]}>
                    {this.state.isLoading
                      ? ''
                      : merchantCard.noTransactionHistoryFound}
                  </Text>
                </View>
              );
            }}
            renderItem={({ item, index }) => {
              return (
                <>
                  {
                    (item?.type == 'chain_abstraction' && activeIndex == 1) ?
                      <ChainAbstractionView
                        Lastindex={
                          index == this.state.transactionList.length - 1
                            ? true
                            : false
                        }
                        item={item}
                        themeSelected={this.props.themeSelected}
                        address={this.getAddress(item)}
                        onCopyAddress={async (txtToCopy: any) => {
                          const { alertMessages } = LanguageManager;
                          await Clipboard.setString(txtToCopy);
                          this.setState({
                            showAlertDialog: true,
                            showSuccess: true,
                            alertTxt: alertMessages.walletAddressCopied,
                          });
                        }}
                        onViewAbstraction={(item: any) => {
                          this.setState({ selectedItem: item, showAbstractionModal: true });
                        }}
                      />
                      : activeIndex == 1 && item?.type != 'chain_abstraction' ?
                        <DVpnView
                          item={item}
                          flag={item?.country_flag}
                          country={item?.country_name}
                          city={item?.server_location}
                          startAt={item?.start_at}
                          statusAt={item?.status_at}
                          onReconnectPress={() => {
                          }}
                        />
                        :
                        <Item
                          Lastindex={
                            index == this.state.transactionList?.length - 1
                              ? true
                              : false
                          }
                          item={item ? item : {}}
                          themeSelected={this.props.themeSelected}
                          address={this.getAddress(item)}

                        />
                  }


                </>
              );
            }}
          />
        </ImageBackground>
        <AppAlert
          visible={this.state.showAlertDialog}
          showSuccess={this.state.showSuccess}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false, showSuccess: false });
          }}
        />
        <Modal
          visible={this.state.showFilter}
          onRequestClose={() => {
            this.setState({ showFilter: false });
          }}
          transparent={true}
          animationType={'fade'}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <ApplyFilter
              getFilter={this.getFilter}
              applyFilterObj={this.state.applyFilterObj}
              onClose={() => {
                this.setState({ showFilter: false });
              }}
            />
          </View>
        </Modal>
        {/* Abstraction view modal */}
        <Modal
          visible={this.state.showAbstractionModal}
          onRequestClose={() => {
            this.setState({ showAbstractionModal: false });
          }}
          transparent={true}
          animationType={'fade'}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TransactionDetail
              item={this.state.selectedItem}
              getFilter={this.getFilter}
              applyFilterObj={this.state.applyFilterObj}
              onClose={() => {
                this.setState({ showAbstractionModal: false });
              }}
              onShowAbstractionStatus={(item: any) => {
                this.setState({ showAbstractionModal: false });
                Linking.openURL(`${Constants.CHAIN_ABSTRACTION_EXPLORER}${item}`);
              }}
              onRefresh={() => {
                this.handlePress(1)
              }}
            />
          </View>
        </Modal>
        <LoaderView isLoading={this.state.isLoading} customStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      </>
    );
  }
}

export default connect(null, { getTransactionList, getDVPNList })(
  DetailTransaction,
);
