/* eslint-disable react-native/no-inline-styles */
import { fromBech32 } from '@cosmjss/encoding';
import Clipboard from '@react-native-clipboard/clipboard';
import { Component } from 'react';
import {
  AppState,
  BackHandler,
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from 'react-native-event-listeners';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import {
  fetchNativePrice,
  getCosmosGasEstimate,
  sendCosmos,
} from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Colors, Fonts } from '../../../theme';
import { heightDimen } from '../../../Utils';
import {
  bigNumberSafeMath,
  clearGarbageCollection,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import {
  broadcastTx,
  estimateGasLimit,
} from '../../../Utils/MnemonicsUtilsCosmos';
import {
  AddressModal,
  AppAlert,
  Button,
  ConfirmTxnModalCosmos,
  HeaderMain,
  InputCustom,
  InputCustomWithPasteButton,
  QRCodeScannerNew,
} from '../../common';
import { LoaderView } from '../../common/LoaderView';
import ContactsBook from '../ContactsBook/ContactsBook';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import styles from './SendCosmosStyle';

const rnBiometrics = new ReactNativeBiometrics();

class SendCosmos extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    consoleLogFunc(
      'Props::::::::',
      props.selectedCoin,
      JSON.stringify(props.themeSelected),
    );
    super(props);
    this.state = {
      disabled: false,
      newObj: '',
      showConfirmModal: false,
      nativePrice: 0,
      toAddress: '',
      selectedCoin: this.props.selectedCoin,
      isLoading: false,
      gasFeeMultiplier: 0.000000000000000001,
      amount: '',
      totalFee: 0,
      isVisible: false,
      valueInUSD: 0,
      bioMetricMode: false,
      showAlertDialog: false,
      alertTxt: '',
      maxclicked: false,
      PinModal: false,
      showContactlModal: false,
      showAddressBookModal: false,
      selectedItem: '',
      selected_Index: undefined,
      isButtonDisabled: false,
      isReqSent: false,
      walletName: '',
      cosmoGasEstimate: '',
      cosmoGasPrice: '',
      stdFee: '',
      isCosmosSend: false,
      transactionFee: 0.1,
      balValue: this.props.balance || 0,
      gasUsedLimit: '',
    };
    this.isMakerWallet = Singleton.getInstance().isMakerWallet;
  }

  /******************************************************************************************/
  async componentDidMount() {
    consoleLogFunc('Props:::::::2222:', this.props.selectedCoin);
    consoleLogFunc(
      'cosmosAddress---:',
      Singleton.getInstance().defaultCosmosAddress,
    );
    let cosmosAddress = await getData(Constants.COSMOS_ADDRESS);
    Singleton.getInstance().defaultCosmosAddress = cosmosAddress;
    consoleLogFunc('aaa---:', cosmosAddress);

    getData(Constants.WALLET_NAME).then(async res => {
      consoleLogFunc('walletName res ------', res);
      this.setState({ walletName: res });
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: '',
        showConfirmModal: false,
        isVisible: false,
        PinModal: false,
        disabled: false,
        showAddressBookModal: false,
        isCosmosSend: false,
      });
    });
    this.focusListener = this.props.navigation.addListener('focus', async () => {
      this.focus();
    });
    AppState.addEventListener('change', nextState => {
      if (Platform.OS == 'android')
        this.setState({
          isVisible: false,
          PinModal: false,
          isCosmosSend: false,
        });
      else this.setState({ isVisible: false });
    });
    getData(Constants.BIOMETRIC_MODE).then(bio_mode => {
      if (bio_mode == 'false') this.setState({ bioMetricMode: false });
      else this.setState({ bioMetricMode: true });
    });
    this.backhandle = (BackHandler as any)?.removeEventListener( // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
    if (this.backhandle) this.backhandle.remove();
  }
  /******************************************************************************************/

  focus() {
    consoleLogFunc('focus---');
    this.getCosmosgas();
    this.fetchNativePrice();
  }
  /******************************************************************************************/

  componentWillUnmount() {
    clearGarbageCollection();
    if (this.focusListener) (typeof this.focusListener === 'function' ? this.focusListener() : this.focusListener?.remove?.());
  }

  /******************************************************************************************/
  checkBiometricAvailabilty() {
    rnBiometrics.isSensorAvailable().then(resultObject => {
      const { available, biometryType } = resultObject;
      if (available && biometryType === BiometryTypes.TouchID) {
        consoleLogFunc('TouchID is supported');
        this.bimetricPrompt();
      } else if (available && biometryType === BiometryTypes.FaceID) {
        consoleLogFunc('FaceID is supported');
        this.bimetricPrompt();
      } else if (
        available &&
        biometryType === BiometryTypes.Biometrics
      ) {
        consoleLogFunc('Biometrics is supported');
        this.bimetricPrompt();
      } else {
        consoleLogFunc('Biometrics not supported');
      }
    });
  }

  /******************************************************************************************/
  bimetricPrompt() {
    try {
      (Singleton.getInstance() as any)
        .getTouchIDItem()
        .then((res: any) => {
          if (this.state.isCosmosSend) {
            this.onPressConfirmSend(res);
          } else {
            this.onPinSuccessCosmosOne(res);
          }
        })
        .catch((err: any) => { });
    } catch (e) {
      consoleLogFunc('Device not Support Fingerprint');
    }
  }

  /******************************************************************************************/
  requestCameraPermission() {
    Singleton.getInstance()
      .cameraPermission()
      .then(res => {
        if (res == 'granted') {
          Singleton.isCameraOpen = true;
          this.setState({ isVisible: true });
        }
      });
  }

  /******************************************************************************************/
  fetchNativePrice() {
    let data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: this.state.selectedCoin.coin_family,
    };
    this.props
      .fetchNativePrice({ data })
      .then((res: any) => {
        this.setState({
          nativePrice: toFixedExp(res?.fiatCoinPrice?.value, 2),
        });
        consoleLogFunc('chk res native price:::::', res);
      })
      .catch((err: any) => {
        consoleLogFunc('chk err native price:::::', err);
      });
  }

  /*******************************************NEED***********************************************/
  showActualAmount(enteredAmount: any) {
    const amt = exponentialToDecimal(
      enteredAmount * this.state.selectedCoin.currentPriceInMarket,
    );
    this.setState({
      valueInUSD: isNaN(enteredAmount)
        ? 0
        : amt < 0.000001
          ? toFixedExp(amt, 8)
          : amt < 0.01
            ? toFixedExp(amt, 4)
            : toFixedExp(amt, 2),
    });
  }
  /******************************************************************************************/
  onChangeAmount(val: any) {
    if (val.includes(',')) val = val.replace(',', '.');
    if (val == '.') val = '0.';
    const decim =
      this.state.selectedCoin.decimals.toString().length - 1 > 18
        ? 8
        : this.state.selectedCoin.decimals.toString().length - 1;
    const expression = new RegExp('^\\d*\\.?\\d{0,' + decim + '}$');
    if (expression.test(val)) {
      if (/^\d*\.?\d*$/.test(val)) {
        if (val.includes('.') && val.split('.')[1].length > 18) {
          return;
        }
        this.setState({ amount: val, maxclicked: false });
        this.showActualAmount(val);
      }
    }
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

  onPressPaste = () => {
    Clipboard.getString().then(address => {
      this.setState({
        toAddress: address,
      });
    });
  };
  /***************************************gas Function***************************************************/
  getCosmosgas() {
    this.setState({ isLoading: true });
    this.props
      .getCosmosGasEstimate()
      .then((res: any) => {
        consoleLogFunc('chk getCosmosgas price:::::', res);
        let response = res?.data;
        let calucatedEstimatedFees = bigNumberSafeMath(
          response?.buffered_gas_price,
          '*',
          response?.buffered_gas_estimate,
        );
        calucatedEstimatedFees = bigNumberSafeMath(
          calucatedEstimatedFees,
          '/',
          10 ** 9,
        );
        consoleLogFunc(
          'chk getCosmosgas price::1:::',
          response?.gas_estimate,
          '----',
          response?.gas_price,
        );
        this.setState({
          cosmoGasEstimate: response?.gas_estimate,
          cosmoGasPrice: response?.gas_price,
          isLoading: false,
          transactionFee: calucatedEstimatedFees,
        });
      })
      .catch((err: any) => {
        consoleLogFunc('chk err getCosmosgas price:::::', err);
        this.setState({ isLoading: false });
      });
  }
  /**********************************************button presss********************************************/
  sendTransaction() {
    const { alertMessages } = LanguageManager;
    const { toAddress, amount, selectedCoin, balValue } = this.state;
    consoleLogFunc('chk bala:::::', selectedCoin.balance, balValue);
    if (toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (!this.isValidCosmosAddress(toAddress))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAddress,
      });
    else if (
      toAddress.toLowerCase() ==
      Singleton.getInstance().defaultCosmosAddress.toLowerCase()
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCannotSendToSameAddress,
      });
    else if (amount.trim().length == 0 || amount == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterAmount,
      });
    else if (isNaN(parseFloat(amount)))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAmount,
      });
    else if (!/^\d*\.?\d*$/.test(amount))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCanEnterOnlyOneDecimal,
      });
    else if (
      parseFloat(amount) > parseFloat(toFixedExp(balValue, 8))
    ) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    } else {
      this.onPressConfirm();
    }
  }
  /******************************************************************************************/
  isValidCosmosAddress(address: any) {
    try {
      const decoded = fromBech32(address);
      consoleLogFunc('Decoded:', decoded);
      return decoded.prefix === Constants.prefix;
    } catch (err: any) {
      console.error('Invalid address:', err.message);
      return false;
    }
  }
  /*******************************************pin MODAL OPEN***********************************************/
  onPressConfirm() {
    setTimeout(() => {
      this.setState({ PinModal: true }, () => {
        if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
      });
    }, 500);
  }

  /***********************************press PIN ONE*******************************************************/
  onPinSuccessCosmosOne(pin: any) {
    this.setState({ PinModal: false, isLoading: true });
    getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then(
      res => {
        let mnemonics = res;
        let toAddress = this.state.toAddress;
        let amount = this.state.amount;
        const fromAddress = Singleton.getInstance().defaultCosmosAddress;
        let gasPrice = this.state.cosmoGasPrice;
        let estimate = this.state.cosmoGasEstimate;
        consoleLogFunc('estimate000', estimate, 'gasPrice---', gasPrice);

        estimateGasLimit(
          mnemonics,
          toAddress,
          amount,
          fromAddress,
          gasPrice,
          estimate,
        )
          .then(res => {
            consoleLogFunc(
              'res estimateGasLimit--COSMOS',
              res,
              'res?.gasEstimate---',
              res?.gasEstimate,
              '---',
              res?.gasLimit,
            );
            let fee = res?.stdFee?.amount[0]?.amount;
            let stdfeeRes = res?.stdFee;
            let totalFeeCal = exponentialToDecimal(
              fee * this.state.gasFeeMultiplier,
            );
            this.setState({
              cosmoGasEstimate: res?.gasEstimate,
              cosmoGasPrice: gasPrice,
              gasUsedLimit: res?.gasLimit,
              totalFee: totalFeeCal,
              stdFee: stdfeeRes,
            });

            this.setState({ isLoading: false });
            setTimeout(() => {
              this.onPressConfirmModelCosmos();
            }, 200);
          })
          .catch(err => {
            this.setState({ isLoading: false });
            consoleLogFunc('err estimateGasLimit--COSMOS', err);
            this.setState({
              showAlertDialog: true,
              alertTxt: 'Unable to retrieve transaction fees.',
            });
          });
      },
    );
  }
  /***************************************confirm modal ***************************************************/

  onPressConfirmModelCosmos() {
    const newObj = {
      valueInUSD: this.state.valueInUSD,
      amount: this.state.amount,
      totalFee: this.state.totalFee,
      nativePrice: this.state.nativePrice,
      toAddress: this.state.toAddress,
      fromAddress: Singleton.getInstance().defaultCosmosAddress,
      feeSymbol: 'Tics',
      fiatAmount: toFixedExp(
        parseFloat(this.state.amount) *
        parseFloat(this.state.selectedCoin.currentPriceInMarket),
        2,
      ),
      fiatCoin: toFixedExp(
        parseFloat(this.state.totalFee) * parseFloat(this.state.nativePrice),
        4,
      ),
      gasUsed: this.state.gasUsedLimit,
    };

    consoleLogFunc('newObj---', newObj, this.state.stdFee);
    this.setState({ newObj: newObj });
    this.setState({
      isLoading: false,
      PinModal: false,
      showConfirmModal: true,
    });
  }
  /*******************************************press confirm MODAL***********************************************/
  onPinSuccessCosmosTwo() {
    this.setState({ isCosmosSend: true, showConfirmModal: false });
    setTimeout(() => {
      this.setState({ PinModal: true }, () => {
        if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
      });
    }, 500);
  }
  /******************************************************************************************/

  onPressConfirmSend(pin: any) {
    this.setState({ isLoading: true, PinModal: false });
    getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then(
      async res => {
        let mnemonicsNew = res;
        let toAddress = this.state.toAddress;
        let amount = this.state.amount;
        const fromAddress = Singleton.getInstance().defaultCosmosAddress;
        let fee = this.state.stdFee;
        let tx_fee = this.state.totalFee;
        try {
          const responseData = await broadcastTx({
            mnemonicsNew,
            fromAddress,
            toAddress,
            amount,
            fee,
          });
          consoleLogFunc('res broadcastTx--COSMOS', responseData);
          const hash = responseData?.hash;
          const transEstimate = responseData?.transFee;
          const block = responseData?.block;
          let newData = {
            tx_fee: tx_fee,
            gas_estimate: transEstimate,
            block: block,
            txid: hash,
            amount: amount,
            from: fromAddress,
            to: toAddress,
            tx_type: 'withdraw',
          };
          consoleLogFunc('res newData--data', newData);
          this.props
            .sendCosmos(newData)
            .then((resCosmos: any) => {
              consoleLogFunc('chk getCosmosGasEstimate tx:::::', resCosmos);
              (Actions as any).TransactionHistory({
                type: ActionConst.REPLACE,
                selectedCoin: this.state.selectedCoin,
              });
              this.setState({ isLoading: false, PinModal: false });
            })
            .catch((err: any) => {
              consoleLogFunc('chk err getCosmosgas tx:::::', err);
              this.setState({
                showAlertDialog: true,
                alertTxt: LanguageManager.alertMessages.unableToSend,
              });
              this.setState({ isLoading: false, PinModal: false });
            });
        } catch (error) {
          consoleLogFunc('error>>', error);

          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt: LanguageManager.alertMessages.unableToSend,
          });
        }
      },
    );
  }

  /******************************************************************************************/

  /******************************************************************************************/
  onMaxClicked() {
    this.setState({ maxclicked: true });
    setTimeout(() => {
      this.setToAmountMax();
    }, 300);
  }
  /******************************************************************************************/
  setToAmountMax() {
    consoleLogFunc(
      'setToAmountMax----',
      this.state.selectedCoin,
      this.state.totalFee,
    );
    if (this.state.balValue == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.Youdonthaveenoughbalance,
      });
    let val;
    let balance = parseFloat(this.state.balValue);
    let maxSendable = bigNumberSafeMath(
      balance,
      '-',
      this.state.transactionFee,
    );
    consoleLogFunc('maxSendable----', maxSendable, this.state.transactionFee);
    if (this.state.selectedCoin.is_token == 0) {
      if (Number(maxSendable) <= 0 && maxSendable.toString().includes('-')) {
        return this.setState({
          showAlertDialog: true,
          alertTxt:
            LanguageManager.alertMessages
              .YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      this.setState({ amount: ((maxSendable as any) * 1).toFixed(6).toString() });
      consoleLogFunc('val', maxSendable);
      this.showActualAmount(maxSendable);
    } else {
      val = toFixedExp(this.state.balValue, 8);
      if (val.toString().includes('-')) {
        return this.setState({
          showAlertDialog: true,
          alertTxt:
            LanguageManager.alertMessages
              .YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      const decim =
        this.state.selectedCoin.decimals.toString().length - 1 > 18
          ? 8
          : this.state.selectedCoin.decimals.toString().length - 1;
      this.setState({ amount: toFixedExp(val * 1, decim).toString() });
      this.showActualAmount(val);
    }
  }

  //******************************************************************************************
  onPressAddressBook() {
    this.setState({ showAddressBookModal: true });
  }
  /******************************************************************************************/
  getAddress = (address: any) => {
    this.setState({ toAddress: address });
  };
  /******************************************************************************************/

  onPressItem(item: any, index: any) {
    this.setState({ selected_Index: index });
    setTimeout(() => {
      this.setState({ showContactlModal: false });
      this.getAddress(item?.wallet_address);
    }, 800);
  }

  render() {
    const { walletMain, sendTrx, merchantCard } =
      LanguageManager;
    consoleLogFunc('this.isMakerWallet ------', this.isMakerWallet);
    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
        <View style={{ flex: 1 }}>
          <HeaderMain
            BackButtonText={
              walletMain.send +
              ' ' +
              this.state.selectedCoin.coin_symbol?.toUpperCase()
            }
          />

          <KeyboardAwareScrollView keyboardShouldPersistTaps={'always'}>
            <View style={{ flex: 1 }}>
              <View style={styles.mainView}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.txtWallet,
                      { color: ThemeManager.colors.blackWhiteText },
                    ]}>
                    {merchantCard.walletAddress}
                  </Text>
                </View>
                <View style={{}}>
                  <View
                    style={[
                      styles.ViewStyle,
                      {
                        borderColor: ThemeManager.colors.inputBorder,
                        backgroundColor: 'transparent',
                      },
                    ]}>
                    <InputCustomWithPasteButton
                      value={this.state.toAddress}
                      onChangeText={(val: any) => {
                        this.setState({
                          toAddress: val,
                        });
                      }}
                      customInputStyle={[
                        styles.ViewStyle1,
                        {
                          backgroundColor: 'transparent',
                          color: ThemeManager.colors.blackWhiteText,
                        },
                      ]}
                      onPastePress={(val: any) => {
                        this.setState({ toAddress: val });
                      }}
                      placeHolder={'Wallet Address'}
                      placeholderTextColor={ThemeManager.colors.inputBorder}
                    />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        right: 80,
                        top: 17,
                        alignSelf: 'center',
                      }}
                      onPress={() => this.onPressPaste()}>
                      <Text
                        style={[
                          styles.txtWallet,
                          {
                            color: ThemeManager.colors.blackWhiteText,
                            fontFamily: Fonts.dmBold,
                          },
                        ]}>
                        {sendTrx.paste}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={
                        this.state.isButtonDisabled ||
                        Singleton.getInstance().isMakerWallet
                      }
                      onPress={() => {
                        this.setState({ isButtonDisabled: true });
                        this.onPressAddressBook();
                        setTimeout(() => {
                          this.setState({ isButtonDisabled: false });
                        }, 2000);
                      }}
                      style={{
                        position: 'absolute',
                        right: 50,
                        top: 17,
                        alignSelf: 'center',
                      }}>
                      <Image
                        source={ThemeManager.ImageIcons.addressBook}
                        style={{
                          tintColor: ThemeManager.colors.blackWhiteText,
                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={this.state.isButtonDisabled}
                      onPress={() => {
                        this.setState({ isButtonDisabled: true });
                        this.requestCameraPermission();
                        setTimeout(() => {
                          this.setState({ isButtonDisabled: false });
                        }, 2000);
                      }}
                      style={styles.scan}>
                      <Image
                        style={{
                          tintColor: ThemeManager.colors.blackWhiteText,
                        }}
                        source={ThemeManager.ImageIcons.scan}
                      />
                    </TouchableOpacity>
                  </View>
                  {/* ------------------------------------------------------------------- */}
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.txtWallet,
                      {
                        height: 40,
                        marginTop: 25,
                        color: ThemeManager.colors.blackWhiteText,
                      },
                    ]}>
                    {sendTrx.enterAmount}
                  </Text>
                  <View
                    style={[
                      styles.ViewStyle2,
                      {
                        borderColor: ThemeManager.colors.inputBorder,
                        backgroundColor: 'transparent',
                      },
                    ]}>
                    <InputCustom
                      value={this.state.amount}
                      onChangeText={(val: any) => {
                        this.onChangeAmount(val);
                      }}
                      placeholderColor={Colors.placeholderColor}
                      keyboardType="decimal-pad"
                      maxLength={15}
                      customInputStyle={[
                        styles.ViewStyle4,
                        { color: ThemeManager.colors.TextColor },
                      ]}
                      placeHolder={sendTrx.enterAmount}
                      placeholderTextColor={ThemeManager.colors.inputBorder}
                    />
                    <View style={styles.ViewStyle3}></View>
                    <TouchableOpacity
                      onPress={() => {
                        this.onMaxClicked();
                      }}
                      style={styles.maxStyle}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.maxText,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}>
                        {sendTrx.max}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.ViewStyle5}>
                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={[
                        styles.fiatStyle,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}>
                      ≈ {Singleton.getInstance().CurrencySymbol}
                      {this.state.valueInUSD}
                    </Text>

                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.TextStyle,
                        { color: ThemeManager.colors.grayTextColor },
                      ]}>
                      {sendTrx.Balance}{' '}
                      <Text
                        style={[
                          styles.TextStyle,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}>
                        {this.getValue(this.state.balValue)}{' '}
                        {this.state.selectedCoin.coin_symbol.toUpperCase()}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>

          <View style={styles.ViewStyle8}>
            {this.state.disabled ? (
              <View
                style={[
                  styles.sendBtnStyle,
                  { backgroundColor: ThemeManager.colors.settingBg },
                ]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.sendBtnTextStyle, { color: 'gray' }]}>
                  {sendTrx.SEND}
                </Text>
              </View>
            ) : (
              <Button
                disabled={this.state.disabled}
                onPress={() => {
                  this.sendTransaction();
                }}
                myStyle={{ marginBottom: heightDimen(50) }}
                buttontext={sendTrx.SEND}
              />
            )}
          </View>

          {this.state.showAddressBookModal && <ContactsBook
            handleBack={() => this.setState({ showAddressBookModal: false })}
            showAddressBookModal={this.state.showAddressBookModal}
            newObj={this.state.newObj}
            getAddress={this.getAddress}
            address={Singleton.getInstance().defaultCosmosAddress}
            coin_family={7}
            selectedCoin={this.state.selectedCoin}
            onPress={() => this.onPressConfirm()}
            onPressView={(item: any) => {
              this.setState({
                showAddressBookModal: false,
                showContactlModal: true,
                selectedItem: item,
              });
              consoleLogFunc('here==', item);
            }}
            addbook={() => {
              this.setState({ showAddressBookModal: false });
              Actions.currentScene != 'AddContact' &&
                (Actions as any).AddContact({ themeSelected: this.props.themeSelected });
            }}
            navigation={this.props.navigation}
          />}
          
          {this.state.showContactlModal && <AddressModal
            selected_Index={this.state.selected_Index}
            onPressItem={(item: any, index: any) => this.onPressItem(item, index)}
            dismiss={() => this.setState({ showContactlModal: false })}
            item={this.state.selectedItem}
            openModel={this.state.showContactlModal}
          />}

          {/* --------------------------------ConfirmTxnModal----------------------------------- */}
          <ConfirmTxnModalCosmos
            handleBack={() => this.setState({ showConfirmModal: false })}
            showConfirmTxnModal={this.state.showConfirmModal}
            newObj={this.state.newObj}
            selectedCoin={this.state.selectedCoin}
            onPress={() => this.onPinSuccessCosmosTwo()}
          />

          {/* --------------------------------Modal for Pin----------------------------------- */}
          <Modal
            statusBarTranslucent
            animationType="slide"
            transparent={true}
            visible={this.state.PinModal}
            onRequestClose={() => {
              this.setState({ PinModal: false });
            }}>
            <View style={{ flex: 1 }}>
              <EnterPinForTransaction
                onBackClick={() => {
                  this.setState({ PinModal: false });
                }}
                closeEnterPin={(res: any) => {
                  if (this.state.isCosmosSend) {
                    this.onPressConfirmSend(res);
                  } else {
                    this.onPinSuccessCosmosOne(res);
                  }
                }}
              />
            </View>
          </Modal>

          <Modal
            animationType={'slide'}
            transparent={true}
            visible={this.state.isVisible}
            onRequestClose={() => {
              consoleLogFunc('Modal has been closed.');
            }}>
            <View style={[styles.modalView, { flex: 1 }]}>
              <View
                style={{
                  backgroundColor: ThemeManager.colors.mainBgNew,
                  flex: 1,
                  marginTop: -5,
                }}>
                <QRCodeScannerNew
                  cameraStyle={styles.cameraStyle}
                  onRead={(event: any) => {
                    const address = event.data;
                    let newAddress = '';
                    if (address.includes(':')) {
                      let address1 = address.split(':');
                      newAddress = address1[1];
                      if (newAddress.includes('?')) {
                        let address1 = newAddress.split('?');
                        newAddress = address1[0];
                      }
                    } else if (address.includes('?amount')) {
                      let address1 = address.split('?');
                      newAddress = address1[0];
                    } else {
                      newAddress = address;
                    }
                    this.setState({ isVisible: false, toAddress: newAddress });
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    this.setState({ isVisible: false });
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.txtCancel,
                      { color: ThemeManager.colors.blackWhiteText },
                    ]}>
                    {sendTrx.Cancel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <AppAlert
            visible={this.state.showAlertDialog}
            alertTxt={this.state.alertTxt}
            hideAlertDialog={() => {
              this.setState({ showAlertDialog: false });
              if (this.state.isReqSent) {
                (Actions as any).TransactionHistory({
                  type: ActionConst.REPLACE,
                  selectedCoin: this.state.selectedCoin,
                });
              }
            }}
          />
          <LoaderView isLoading={this.state.isLoading} />
        </View>
      </BackgroundImage>
    );
  }
}

export default connect(null, {
  getCosmosGasEstimate,
  sendCosmos,
  fetchNativePrice,
})(SendCosmos);
