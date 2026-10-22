import { statusBarOffset } from '../../../Utils/StatusBarOffset';
import {Component} from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Keyboard,
  ScrollView,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {
  requestNonce,
  requestGasEstimation,
  requestSendCoin,
  requestGasLimitForDapp,
  fetchNativePrice,
} from '../../../Redux/Actions';
import {
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  toFixed,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import styles from './DappBrowserStyle';
import {Actions} from '../../../navigation/RootNavigation';
import {Fonts, Images} from '../../../theme';
import {Button, LoaderView, AppAlert} from '../../common';
import RNFS from 'react-native-fs';
import WebView from 'react-native-webview';
import {connect} from 'react-redux';
import Singleton from '../../../Singleton';
import * as Constants from '../../../Constants';
import {IS_PRODUCTION} from '../../../EndPoint';
import {ThemeManager} from '../../../../ThemeManager';
import FastImage from 'react-native-fast-image';
import {getNonce, getTotalGasFee} from '../../../Utils/EthUtils';
import {EventRegister} from 'react-native-event-listeners';
import {BackHandler} from 'react-native';
import {LanguageManager} from '../../../../LanguageManager';
import {
  dimen,
  getDimensionPercentage,
} from '../../../Utils';
import {ethers} from 'ethers';
import DeviceInfo from 'react-native-device-info';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import {getDappProvider} from '../../../Utils/etherProviderUtils';
import {BlurView} from '@react-native-community/blur';
import {getOrigin, reviewSignRequest} from '../../../Utils/DappSigningReview';
const gasFeeMultiplier = 0.000000000000000001;
const {sendTrx, browser, merchantCard} = LanguageManager;

class DappBrowserNew extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    consoleLogFunc('chk props dapp::::', props);
    super(props);
    this.state = {
      jsContent: '',
      isVisible: false,
      signingData: '',
      calculatedFee: '',
      gasPrice: '',
      gas: '',
      canGoBack: false,
      gasFeeMultiplier: 0.000000000000000001,
      canGoForward: false,
      isLoading: false,
      selectedNetwork: 'Ethereum',
      chainId: this.props.chainId || 1,
      rpcUrl: this.props.rpcUrl || Singleton.getInstance().ETH_DAPP_RPC_URL,
      url: this.props.url,
      enteredURL: this.props.url,
      isNetworkModalVisible: false,
      showAlertDialog: false,
      alertTxt: '',
      isSearchFocus: false,
      selectedFeeType: 2,
      isButtonDisabled: false,
      pinModal: false,
      msgType: '',
      signedData: '',
      signReview: null,
      isShowEth: true,
      isShowBnb: true,
      isShowMatic: true,
      fiatPriceByFamily: {},
    };
  }

  getNetworkMeta = (networkName = this.state.selectedNetwork) => {
    return (
      (Constants.DAPP_CHAIN_META as any)?.[networkName] ||
      Constants.DAPP_CHAIN_META?.Polygon
    );
  };

  isBinanceNetwork = () => {
    return this.state.selectedNetwork == 'Binance';
  };

  isEthereumNetwork = () => {
    return this.state.selectedNetwork == 'Ethereum';
  };

  isEthOrQubeticsNetwork = () => {
    return (
      this.state.selectedNetwork == 'Ethereum' ||
      this.state.selectedNetwork == 'Qubetics'
    );
  };

  getAdjustedGasPrice = (type: any, gasResponse: any) => {
    const metricKey =
      type == 'slow'
        ? 'safe_gas_price'
        : type == 'average'
        ? 'propose_gas_price'
        : 'fast_gas_price';
    const gasValue = gasResponse?.resultList?.[metricKey];

    if (!gasResponse?.resultList) return 0;
    if (!this.isBinanceNetwork()) return gasValue;
    if (Constants.network == 'testnet') return 10 * 10 ** 9;
    return gasValue > 3 ? gasValue : 3;
  };

  fetchAllDappFiatPrices = () => {
    const uniqueCoinFamilies = [
      ...new Set(
        Object.values(Constants.DAPP_CHAIN_META).map(item => item.coinFamily),
      ),
    ];
    const requests = uniqueCoinFamilies.map(coinFamily => {
      const data = {
        fiat_currency: Singleton.getInstance().CurrencySelected,
        coin_family: coinFamily,
      };
      return this.props
        .fetchNativePrice({data})
        .then((value: any) => ({status: 'fulfilled', value}))
        .catch((reason: any) => ({status: 'rejected', reason}));
    });

    Promise.all(requests).then(results => {
      const fiatPriceByFamily: any = {};
      results.forEach((result: any, index: any) => {
        const coinFamily = uniqueCoinFamilies[index];
        if (result?.status == 'fulfilled') {
          fiatPriceByFamily[coinFamily] = Number(
            result?.value?.fiatCoinPrice?.value || 0,
          );
        }
      });
      this.setState({fiatPriceByFamily});
    });
  };

  getFiatPriceByCoinFamily = (coinFamily: any) => {
    return Number(this.state.fiatPriceByFamily?.[coinFamily] || 0);
  };

  getSelectedNetworkFiatPrice = () => {
    const selectedNetworkMeta = this.getNetworkMeta();
    return this.getFiatPriceByCoinFamily(selectedNetworkMeta?.coinFamily);
  };

  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({showAlertDialog: false, alertTxt: '', isVisible: false});
      if (this.state.signingData) {
        this.closeModal();
      }
    });
    (global as any).isFromUniswap = 'yes';

    this.blur = this.props.navigation.addListener('blur', () => {
      consoleLogFunc('Blur .....');
      if (this.backhandle) this.backhandle?.remove();
      Keyboard.dismiss();
    });
    this.focus = this.props.navigation.addListener('focus', () => {
      this.backhandle = BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
      consoleLogFunc('Focus .....');
      Keyboard.dismiss();
    });

    getData(Constants.MULTI_WALLET_LIST).then(list => {
      const currentWalletList = JSON.parse(list);
      let currentWallet = currentWalletList.find((res: any) => res?.defaultWallet);
      let coinFamily =
        Constants.DAPP_COIN_LIST[this.state.url?.includes('blazpay') ? 3 : 0]
          .coin_family;
      let coinItem: any = Constants.DAPP_COIN_LIST[0];
      if (currentWallet?.isPrivateKey) {
        coinFamily = currentWallet?.coinFamily;
        coinItem = Constants.DAPP_COIN_LIST.find(
          res => res?.coin_family == coinFamily,
        );
      }

      this.setState(
        {
          selectedNetwork: coinItem.coin_name,
          chainId: coinItem.chainId,
          isShowBnb: coinFamily == 1 ? true : false,
          isShowEth: coinFamily == 2 ? true : false,
          isShowMatic: coinFamily == 2 ? true : false,
          rpcUrl: this.getRpcUrl(coinFamily),
        },
        () => {
          this.fetchAllDappFiatPrices();
          setTimeout(() => {
            this.connectWithDapp();
          }, 1000);
        },
      );
    });
  }
  connectWithDapp() {
    const provider = getDappProvider(this.state.rpcUrl);
    consoleLogFunc('connectWithDapp----provider', provider);
    this.web3 = provider;
    if (this.state.jsContent === '') {
      if (Platform.OS === 'ios') {
        RNFS.readFile(`${RNFS.MainBundlePath}/trust-min.js`, 'utf8').then(
          content => {
            this.setState({
              jsContent: this.getJavascript(
                this.state.chainId,
                this.state.rpcUrl,
                Singleton.getInstance().defaultEthAddress,
                content,
              ),
            });
          },
        );
      } else {
        RNFS.readFileAssets(`trust-min.js`, 'utf8').then(content => {
          this.setState({
            jsContent: this.getJavascript(
              this.state.chainId,
              this.state.rpcUrl,
              Singleton.getInstance().defaultEthAddress,
              content,
            ),
          });
        });
      }
    }
  }

  /******************************************************************************************/
  handleBackButtonClick() {
    consoleLogFunc('Backhandler Dapp');
    Singleton.bottomBar?.navigateTab('DefiAccessMain');
    Actions.pop();

    return true;
  }

  /******************************************************************************************/
  componentWillUnmount() {
    (global as any).isFromUniswap = null;
    clearTimeout(this.reloadWebView);
    this.backhandle?.remove();
    this.blur?.();
    this.focus?.();
  }

  /******************************************************************************************/
  onShouldStartLoadWithRequest = () => {
    return true;
  };

  /******************************************************************************************/
  onMessage = async ({nativeEvent}: {nativeEvent: any}) => {
    let message = JSON.parse(nativeEvent.data);
    consoleLogFunc('---------message------', message);
    consoleLogFunc('---------nativeEvent.data------', nativeEvent.data);
    consoleLogFunc(
      'Singleton.getInstance().ETH_DAPP_RPC_URL-----',
      Singleton.getInstance().ETH_DAPP_RPC_URL,
    );
    consoleLogFunc(
      'Singleton.getInstance().BSC_RPC_URL-----',
      Singleton.getInstance().BSC_RPC_URL,
    );
    consoleLogFunc(
      Singleton.getInstance().defaultEthAddress,
      'Singleton.getInstance().defaultEthAddress',
    );

    this.setState({msgType: message.name});
    if (message.name == 'signTransaction') {
      if (!message.object.value) message.object.value = '0x0';
      consoleLogFunc('---------message.object.gas------', message.object.gas);

      if (!message.object.gas) {
        consoleLogFunc('---------message.object.gas------11111');
        try {
          const selectedNetworkMeta = this.getNetworkMeta();
          const gasLimitRpcUrl = this.isEthereumNetwork()
            ? Singleton.getInstance().ETH_DAPP_RPC_URL
            : this.isBinanceNetwork()
            ? Singleton.getInstance().BSC_RPC_URL
            : selectedNetworkMeta.backendCoinType == 'qubetics'
            ? Singleton.getInstance().TICS_RPC_URL
            : Singleton.getInstance().MATIC_RPC_URL;
          let res = await this.props.requestGasLimitForDapp({
            url: gasLimitRpcUrl,
            data: message.object,
          });
          consoleLogFunc('res.result', res.result);
          if (res.result) {
            message.object.gas = res.result;
          } else {
            message.object.gas = '0x238ec';
          }
        } catch (error) {
          consoleLogFunc('error------11111', error);

          message.object.gas = '0x238ec';
        }
      }
      this.setState({signingData: message});
      consoleLogFunc('this.hex2dec(message.ob==', message.object.value);

      consoleLogFunc(
        'this.hex2dec(message.object.value)==',
        this.hex2dec(message.object.value),
      );
      this.getNonceAndGas(
        this.hex2dec(message.object.value),
        this.getNetworkMeta()?.txSymbol,
      );
    } else if (message.name == 'requestAccounts') {
      /******************************************* requestAccounts ***********************************************/
      let js = `trustwallet.${message?.network}.setAddress('${
        Singleton.getInstance().defaultEthAddress
      }');`;
      consoleLogFunc('js>>>>', js);

      this.webview?.injectJavaScript(js);
      let mmid = message.id;
      let js1 = `trustwallet.${message?.network}.sendResponse(${mmid}, ['${
        Singleton.getInstance().defaultEthAddress
      }'])`;
      consoleLogFunc('js>>>>', js1);

      this.webview?.injectJavaScript(js1);
    } else if (
      /********************************************** signPersonalMessage ********************************************/
      message.name == 'signPersonalMessage' ||
      message.name == 'signMessage' ||
      message.name == 'signTypedMessage'
    ) {
      const review = reviewSignRequest({
        name: message.name,
        object: message.object,
        origin: getOrigin(nativeEvent.url),
        activeChainId: Number(this.state.chainId),
      });
      if (!review.accepted) {
        this.rejectSignRequest(message, review.reason);
        this.setState({
          showAlertDialog: true,
          alertTxt: review.reason,
        });
        return;
      }
      this.setState({signedData: message, signReview: review});
    } else if (message.name == 'switchEthereumChain') {
      consoleLogFunc('message.name==', message.name);
      let mmid = message.id;
      let chainId = message?.object?.chainId;
      chainId = parseInt(chainId, 16);
      consoleLogFunc('chainId----', chainId);
      let item = Constants.DAPP_COIN_LIST.find(res => res?.chainId == chainId);
      consoleLogFunc('item-----', item);

      if (item == undefined) {
        let js1 = `trustwallet.${message?.network}.sendError(${mmid}, "not supported")`;
        this.webview.injectJavaScript(js1);
        return;
      }

      let rpcUrl = this.getRpcUrl(item.coin_family);
      consoleLogFunc('item-----rpcUrl', rpcUrl);

      this.setState(
        {
          selectedNetwork: item.coin_name,
          chainId: item.chainId,
          rpcUrl: rpcUrl,
        },
        () => {
          this.fetchAllDappFiatPrices();

          const provider = getDappProvider(rpcUrl);
          consoleLogFunc('item-----provider', provider);

          this.web3 = provider;
          let script = this.switchChainScript(chainId, rpcUrl);
          this.webview.injectJavaScript(script);
          let js = `trustwallet.ethereum.emitChainChanged('${ethers.toQuantity(
            message.object.chainId,
          )}')`;
          this.webview.injectJavaScript(js);
          let js1 = `trustwallet.${message?.network}.sendResponse(${mmid}, null)`;
          this.webview.injectJavaScript(js1);
        },
      );
    }
  };

  rejectSignRequest = (message: any, reason: string) => {
    if (message?.network !== 'ethereum' || !Number.isInteger(message?.id)) {
      return;
    }
    this.webview?.injectJavaScript(
      `trustwallet.ethereum.sendError(${message.id}, ${JSON.stringify(reason)});`,
    );
  };

  dismissSignReview = () => {
    this.rejectSignRequest(this.state.signedData, 'User rejected the request');
    this.setState({signReview: null, signedData: '', pinModal: false});
  };

  confirmSignReview = () => {
    this.setState({signReview: null, pinModal: true});
  };

  renderSignReviewModal = () => {
    const review = this.state.signReview;
    if (!review) return null;
    const textColor = ThemeManager.colors.blackWhiteText;
    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={this.dismissSignReview}>
        <View style={styles.modalView}>
          <View
            style={[
              styles.modalinner,
              {
                maxHeight: '80%',
                borderColor: ThemeManager.colors.borderColor,
                backgroundColor: ThemeManager.colors.whiteBlacktext,
              },
            ]}>
            <Text style={[styles.titleSign, {color: textColor}]}>
              {review.title}
            </Text>
            <Text style={[styles.txtValue, {color: textColor, width: '100%'}]}>
              {review.origin}
            </Text>
            {review.warnings.map((warning: string) => (
              <Text
                key={warning}
                style={[styles.txtValue, {color: '#E5484D', width: '100%'}]}>
                {warning}
              </Text>
            ))}
            <ScrollView style={{marginVertical: 10}}>
              {review.details.map((detail: any) => (
                <View key={detail.label} style={styles.vwSignTransaction}>
                  <Text style={[styles.textLbl, {color: textColor}]}>
                    {detail.label}
                  </Text>
                  <Text
                    selectable
                    style={[
                      styles.txtValue,
                      {color: ThemeManager.colors.placeholderColorNew},
                    ]}>
                    {detail.value}
                  </Text>
                </View>
              ))}
              <Text
                selectable
                style={[
                  styles.txtValue,
                  {
                    width: '100%',
                    marginTop: 8,
                    color: ThemeManager.colors.placeholderColorNew,
                  },
                ]}>
                {review.body}
              </Text>
            </ScrollView>
            <View style={{gap: 10}}>
              <Button
                btnstyle={{borderRadius: 6}}
                buttontext="Continue"
                onPress={this.confirmSignReview}
              />
              <Button
                btnstyle={{borderRadius: 6}}
                buttontext="Reject"
                onPress={this.dismissSignReview}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  getRpcUrl(coinFamily: any) {
    if (coinFamily == 1) {
      return Singleton.getInstance().BSC_RPC_URL;
    } else if (coinFamily == 2) {
      return Singleton.getInstance().ETH_DAPP_RPC_URL;
    } else if (coinFamily == 7) {
      return Singleton.getInstance().TICS_RPC_URL;
    } else {
      return Singleton.getInstance().MATIC_RPC_URL;
    }
  }

  /******************************************************************************************/
  getJavascript = function (chainId: any, rpcUrl: any, address: any, jsContent: any) {
    let source = '';
    consoleLogFunc('chainId:', chainId, 'rpcUrl:', rpcUrl, 'address:', address);

    source = `
  ${jsContent}
  (function() {
    let config = {
      ethereum: {
        chainId: ${chainId},
        rpcUrl: '${rpcUrl}',
        address:'${address}'
    }
    };
    trustwallet.ethereum = new trustwallet.Provider(config);
    trustwallet.postMessage = (jsonString) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify(jsonString))
    };
    window.ethereum = trustwallet.ethereum;
    const EIP6963Icon = '${Constants.APP_LOGO_BASE64}';
      
      const info = {
        uuid: crypto.randomUUID(),
        name: 'QubeticsWallet',
        icon: EIP6963Icon,
        rdns: 'com.qubetics.wallet',
      };

      const announceEvent = new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info, provider: ethereum }),
      });

      window.dispatchEvent(announceEvent);

      window.addEventListener('eip6963:requestProvider', () => {
         window.dispatchEvent(announceEvent);
      });
})();
  `;
    return source;
  };

  /******************************************************************************************/
  ConvertBase(num: any) {
    return {
      from: function (baseFrom: any) {
        return {
          to: function (baseTo: any) {
            return parseInt(num, baseFrom).toString(baseTo);
          },
        };
      },
    };
  }

  /******************************************************************************************/
  hex2dec(num: any): any {
    return this.ConvertBase(num).from(16).to(10);
  }

  renderBlurView() {
    return Platform.OS === 'ios' ? (
      <View style={[styles.blurView, {backgroundColor: 'rgba(0,0,0,0.6)'}]} />
    ) : (
      <BlurView
        style={styles.blurView}
        blurType="dark"
        blurAmount={3}
      />
    );
  }

  /******************************************************************************************/
  async getNonceAndGas(amount: any, coinsym: any) {
    const selectedNetworkMeta = this.getNetworkMeta();
    const selectedCoinSymbol = coinsym || selectedNetworkMeta?.txSymbol;
    const nonceReq = {
      amount: amount,
    };
    consoleLogFunc(
      ' this.state.selectedNetwork:::::',
      this.state.selectedNetwork,
    );
    consoleLogFunc(' amount:::::', amount);
    consoleLogFunc(' coinsym:::::', coinsym);

    if (this.isEthereumNetwork()) {
      try {
        const Totalfee = await getTotalGasFee();
        const gasLimit = this.hex2dec(this.state.signingData.object.gas);
        const value = exponentialToDecimal(
          (Totalfee as any) * this.state.gasFeeMultiplier * gasLimit,
        );
        consoleLogFunc(' value:::::', value);
        const fee = parseFloat(value).toFixed(8);
        consoleLogFunc(' fee:::::', fee);
        const non = await getNonce();
        consoleLogFunc(' non:::::', non);
        this.nonce = non;
        this.setState({
          isVisible: true,
          gasEstimate: gasLimit,
          gasPrice: Totalfee,
          calculatedFee: fee,
        });
      } catch (error) {
        consoleLogFunc(' error:::::', error);
      }
    } else {
      getData(Constants.ACCESS_TOKEN).then(token => {
        let gasEstimationReq = {
          from: Singleton.getInstance().defaultEthAddress,
          to: Singleton.getInstance().defaultEthAddress,
          amount: '',
        };
        this.props
          .requestNonce({
            url: `${selectedNetworkMeta?.backendCoinType}/${selectedCoinSymbol}/nonce`,
            coinSymbol: selectedCoinSymbol,
            nonceReq,
            token,
          })
          .then((result: any) => {
            consoleLogFunc('requestNonce==result:::::', result);

            this.nonce = result.data.nonce;
            this.props
              .requestGasEstimation({
                url: `${selectedNetworkMeta?.backendCoinType}/${selectedNetworkMeta?.txSymbol}/gas_estimation`,
                coinSymbol: selectedNetworkMeta?.txSymbol,
                gasEstimationReq,
                token,
              })
              .then((res: any) => {
                consoleLogFunc('gasPriceDetail: bnb', res);
                consoleLogFunc(
                  'this.hex2dec(this.state.signingData.object.gas)===-=-==-=-==',
                  this.hex2dec(this.state.signingData.object.gas),
                );
                var fast = res?.resultList
                  ? res.resultList.propose_gas_price > 3
                    ? res.resultList.propose_gas_price
                    : 3
                  : res?.gas_price || 1;
                var initialValue =
                  10 ** 9 *
                  fast *
                  this.hex2dec(this.state.signingData.object.gas);
                var fee = initialValue * gasFeeMultiplier;
                consoleLogFunc('initialValue===>', initialValue + ' ' + fee);
                this.setState({
                  gas: res,
                  isVisible: true,
                  calculatedFee: fee.toFixed(5),
                  gasPrice: fast,
                  isLoading: false,
                });
              })
              .catch((err: any) => {
                consoleLogFunc('Error: ', err);
                this.setState({isLoading: false});
              });
          })
          .catch((err: any) => {
            consoleLogFunc('Error: ', err);
            this.setState({isLoading: false});
          });
      });
    }
  }

  /******************************************************************************************/
  async signRawTxn(pin: any) {
    consoleLogFunc('hellooooo');
    this.setState({isLoading: true});
    const selectedNetworkMeta = this.getNetworkMeta();
    let pKey = await getEncryptedData(
      `${Singleton.getInstance().defaultEthAddress}_pk`,
      pin,
    );
    const gasLimit = this.state.signingData.object.gas; // in hex
    const gasPrice = this.isBinanceNetwork()
      ? (IS_PRODUCTION as number) == 0
        ? 10 * 10 ** 9
        : this.state.gasPrice
      : this.state.gasPrice; // in hex
    const amount = (
      this.hex2dec(this.state.signingData.object.value) /
      10 ** 18
    ).toString();
    const nonce = this.nonce;
    Singleton.getInstance()
      .getsignRawTxnDapp(
        pKey,
        amount,
        gasPrice,
        gasLimit,
        nonce,
        this.state.signingData.object.to,
        this.state.signingData.object.from,
        this.state.signingData.object.data,
        selectedNetworkMeta?.txSymbol,
      )
      .then(serializedTx => {
        consoleLogFunc('this.serializedTx-------', serializedTx);
        if (serializedTx != null) {
          this.setState({isLoading: true});
          this.sendCoin(serializedTx);
        } else {
          this.setState({isLoading: false});
          let js = `trustwallet.ethereum.sendError(${this.state.signingData.id}, 'Something went wrong.')`;
          this.webview?.injectJavaScript(js);
        }
        pKey = '';
      })
      .catch(err => {
        this.setState({isLoading: false});
        pKey = '';
      });
  }

  /******************************************************************************************/
  sendCoin(serializedTx: any) {
    const selectedNetworkMeta = this.getNetworkMeta();
    const nonce = this.nonce;
    const tx_raw = serializedTx;
    const from = this.state.signingData.object.from;
    const to = this.state.signingData.object.to;
    const amount = (
      this.hex2dec(this.state.signingData.object.value) /
      10 ** 18
    ).toString();
    const gas_estimate = this.hex2dec(this.state.signingData.object.gas);
    const eth_gas_price = this.state.gasPrice;
    const coinsym = selectedNetworkMeta?.txSymbol;
    const coinType = selectedNetworkMeta?.backendCoinType;
    const fee = toFixedExp(parseFloat(this.state.calculatedFee), 8);
    const sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: from,
      to: to,
      amount:
        this.hex2dec(this.state.signingData.object.value) == 0 ? fee : amount,
      add_amount:
        this.hex2dec(this.state.signingData.object.value) == 0 ? 1 : 0,
      gas_estimate: gas_estimate,
      gas_price: this.isBinanceNetwork()
        ? (IS_PRODUCTION as number) == 0
          ? 10 * 10 ** 9
          : eth_gas_price
        : this.isEthereumNetwork()
        ? eth_gas_price
        : eth_gas_price * 10 ** 9,
      tx_type: 'dapp',
    };
    consoleLogFunc('The sendCoinReq txn is ', sendCoinReq);
    getData(Constants.ACCESS_TOKEN).then(token => {
      consoleLogFunc('The raw txn is ' + tx_raw);
      this.props
        .requestSendCoin({
          url: `${coinType}/${coinsym}/send`,
          coinSymbol: coinsym,
          sendCoinReq,
          token,
        })
        .then((res: any) => {
          consoleLogFunc(
            '-----------------------Response------------',
            res.tx_hash,
          );
          this.setState({
            isVisible: false,
            isLoading: false,
            selectedFeeType: 2,
          });
          let mmid = this.state.signingData.id;
          let hash = res.tx_hash;
          let js = `trustwallet.ethereum.sendResponse(${mmid}, '${hash}')`;
          this.webview?.injectJavaScript(js);
          Singleton.getInstance().showToast.show(
            res?.message || 'Transaction Successful',
          );
        })
        .catch((err: any) => {
          consoleLogFunc('Error: ', err);
          let js = `trustwallet.ethereum.sendError(${
            this.state.signingData.id
          }, '${err.message || err}')`;
          this.webview?.injectJavaScript(js);
          this.setState({
            isVisible: false,
            selectedFeeType: 2,
            isLoading: false,
            alertTxt: err,
            showAlertDialog: true,
          });
        });
    });
  }

  /******************************************************************************************/
  calculateFee(type: any) {
    let res = this.state.gas;
    var fast = 0;
    if (res) {
      fast = this.getAdjustedGasPrice(type, res);

      var initialValue =
        fast *
        10 ** 9 *
        parseFloat(this.hex2dec(this.state.signingData.object.gas));
      consoleLogFunc(
        'initialValue-=-=======',
        fast,
        initialValue,
        bigNumberSafeMath(initialValue, '*', gasFeeMultiplier),
      );
      return toFixed(
        exponentialToDecimal(
          bigNumberSafeMath(initialValue, '*', gasFeeMultiplier),
        ),
        5,
      );
    } else {
      return (0 * gasFeeMultiplier).toFixed(5);
    }
  }

  /******************************************************************************************/
  onClickAction(type: any) {
    consoleLogFunc('chk type:::::', type);
    if (type == 'slow') {
      const res = this.state.gas;
      const standard = this.getAdjustedGasPrice('slow', res);
      const initialValue =
        10 ** 9 * standard * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 1,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: standard,
      });
    } else if (type == 'average') {
      let res = this.state.gas;
      const fast = this.getAdjustedGasPrice('average', res);
      const initialValue =
        10 ** 9 * fast * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 2,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: fast,
      });
    } else if (type == 'fast') {
      let res = this.state.gas;
      const fast = this.getAdjustedGasPrice('fast', res);
      const initialValue =
        10 ** 9 * fast * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 3,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: fast,
      });
    }
  }

  /******************************************************************************************/
  calculateFiat(type: any) {
    const res = this.state.gas;
    const selectedNetworkMeta = this.getNetworkMeta();
    var fast = 0;
    if (res) {
      fast = this.getAdjustedGasPrice(type, res);
      const initialValue =
        fast * 10 ** 9 * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      const networkFiatPrice = this.getFiatPriceByCoinFamily(
        selectedNetworkMeta?.coinFamily,
      );
      return toFixedExp(bigNumberSafeMath(fee, '*', networkFiatPrice), 4);
    }
  }

  /******************************************************************************************/
  renderSlowStandardFast() {
    const selectedNetworkMeta = this.getNetworkMeta();
    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}>
          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('slow')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 1
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('slow')} {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('slow')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 1
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.slow}
            </Text>
          </View>

          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('average')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 2
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('average')}{' '}
                {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('average')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 2
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.Average}
            </Text>
          </View>

          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('fast')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 3
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('fast')} {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('fast')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 3
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.Fast}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /******************************************************************************************/
  validURL(str: any) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1, 3}\\.){3}\\d{1, 3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    return !!pattern.test(str);
  }

  /******************************************************************************************/
  setUrl() {
    consoleLogFunc('this.state.enteredURL:::::', this.state.enteredURL);
    if (this.validURL(this.state.enteredURL)) {
      if (!this.state.enteredURL.startsWith('http')) {
        this.setState({url: 'https://' + this.state.enteredURL});
      } else {
        this.setState({url: this.state.enteredURL});
        this.webview?.reload();
      }
    } else {
      this.setState({
        url: 'https://www.google.com/search?q=' + this.state.enteredURL,
      });
    }
  }

  switchChainScript(chainId: any, rpcUrl: any) {
    const script = `(async () => {
      try {
        let changeEVMConfig = {
        ethereum: {
          address: "${Singleton.getInstance().defaultEthAddress}",
          chainId: ${ethers.toQuantity(chainId)},
          rpcUrl: "${rpcUrl}"
        }
      };
      ethereum.setConfig(changeEVMConfig);
      trustwallet.ethereum.emitChainChanged('${ethers.toQuantity(
        chainId,
      )}');
      true;
  } catch (error) {
  console.error('Error switching chain:', error);
  trustwallet.ethereum.sendError(null, "Error switching chain:");
}
})();`;
    return script;
  }
  /******************************************************************************************/
  onChangeText(text: any) {
    if (Constants.NO_SPACE_REGEX.test(text)) {
      this.setState({enteredURL: text});
    }
  }

  /******************************************************************************************/
  closeModal() {
    const js = `trustwallet.ethereum.sendError(${this.state.signingData?.id}, 'Cancelled')`;
    consoleLogFunc('----------------js-----------', js);
    this.webview?.injectJavaScript(js);
    this.setState({isVisible: false, selectedFeeType: 2});
  }

  /******************************************************************************************/

  /******************************************************************************************/

  async addToHistory(url: any, urlTitle: any) {
    clearTimeout(this.historyTimeout);
    this.historyTimeout = setTimeout(async () => {
      let historyData = await getData(Constants.DAPP_HISTORY);
      historyData = historyData == null ? [] : JSON.parse(historyData);
      historyData = [
        {
          url: url,
          title: urlTitle,
          iconUrl: `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${this.cleanUrl(
            url,
          )}&size=128`,
          timestamp: new Date().getTime(),
        },
        ...historyData,
      ];
      consoleLogFunc('historyData>>>', historyData);

      if (historyData?.length > 50) {
        historyData = historyData.slice(0, 50);
      }

      saveData(Constants.DAPP_HISTORY, JSON.stringify(historyData));
    }, 1200);
  }

  cleanUrl = (url: any) => {
    // clean url
    let cleanedUrl = url.includes('https')
      ? url.slice(8)
      : url.includes('http')
      ? url.slice(7)
      : url;
    cleanedUrl = cleanedUrl.includes('/')
      ? cleanedUrl.split('/')[0]
      : cleanedUrl;
    return cleanedUrl;
  };

  /******************************************************************************************/
  render() {
    const selectedNetworkMeta = this.getNetworkMeta();
    const isEthOrQubeticsNetwork = this.isEthOrQubeticsNetwork();
    const networkFiatPrice = this.getSelectedNetworkFiatPrice();

    return (
      <>
        <BackgroundImage
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{backgroundColor: ThemeManager.colors.mainBgNew}}>
          <View
            style={{
              ...styles.dapHeader,
              paddingTop:
                Platform.OS == 'ios'
                  ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
                    ? getDimensionPercentage(0)
                    : getDimensionPercentage(30)
                  : statusBarOffset + getDimensionPercentage(10),
            }}>
            <TouchableOpacity
              disabled={this.state.isButtonDisabled}
              onPress={() => {
                Actions.pop();
                setTimeout(() => {
                  this.setState({isButtonDisabled: false});
                }, 2000);
              }}
              style={styles.dapBackView}>
              <Image
                style={{
                  marginRight: 2,
                  tintColor: ThemeManager.colors.blackWhiteText,
                }}
                source={Images.arrow_back}
              />
            </TouchableOpacity>

            <View style={[styles.searchMainView, {width: '90%'}]}>
              <View
                style={{
                  ...styles.searchInnerView,
                  borderColor: ThemeManager.colors.searchBorderColor,
                }}>
                <TextInput
                  style={{
                    ...styles.searchText,
                    color: ThemeManager.colors.TextColor,
                    width: this.state.isSearchFocus ? '82%' : '95%',
                  }}
                  placeholder="https://"
                  value={this.state.enteredURL}
                  onChangeText={text => {
                    this.onChangeText(text);
                  }}
                  onBlur={() => {
                    this.setUrl();
                    this.setState({isSearchFocus: false});
                  }}
                  onFocus={() => {
                    this.setState({isSearchFocus: true});
                  }}
                  autoCorrect={false}
                  autoCapitalize={'none'}
                  allowFontScaling={false}
                />
                {this.state.isSearchFocus && (
                  <TouchableOpacity
                    style={[styles.searchBtn]}
                    onPress={() => {
                      this.setState({enteredURL: ''});
                    }}>
                    <Image
                      style={{
                        tintColor: ThemeManager.colors.TextColor,
                      }}
                      source={Images.close_icon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>
        </BackgroundImage>

        <View style={{flex: 1}}>
          {this.state.jsContent !== '' && (
            <WebView
              forceDarkOn={true}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
              ref={((ref: any) => (this.webview = ref)) as any}
              source={{uri: this.state.url}}
              injectedJavaScriptBeforeContentLoaded={this.state.jsContent}
              style={{flex: 1}}
              content
              onMessage={this.onMessage}
              onNavigationStateChange={navState => {
                consoleLogFunc(
                  this.state.chainId,
                  'chk navState.url:::::',
                  navState.url,
                );
                this.setState({
                  canGoBack: navState.canGoBack,
                  canGoForward: navState.canGoForward,
                  enteredURL: navState.url,
                });
                this.addToHistory(navState.url, navState.title);
              }}
              startInLoadingState={false}
              sendCookies
              javascriptEnabled
              allowsInlineMediaPlayback
              useWebkit
              testID={'browser-webview'}
              originWhitelist={['http://*', 'https://*', 'intent://*']}
            />
          )}
          {this.state.isNetworkModalVisible && (
            <View
              style={[
                styles.dropdown,
                {backgroundColor: ThemeManager.colors.searchBg},
              ]}>
              {this.state.isShowEth && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressEth();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{marginRight: 10, width: 20, height: 20}}
                      source={{
                        uri: Constants.ETH_Img,
                        priority: FastImage.priority.normal,
                      }}
                      {...({ resizeMode: FastImage.resizeMode.contain } as any)}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Ethereum}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {this.state.isShowBnb && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressBnb();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{
                        marginRight: 10,
                        width: 20,
                        height: 20,
                        borderRadius: 45,
                      }}
                      source={{
                        uri: Constants.BSC_Img,
                        priority: FastImage.priority.normal,
                      }}
                      {...({ resizeMode: FastImage.resizeMode.contain } as any)}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Bnb}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {this.state.isShowMatic && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressMatic();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{marginRight: 10, width: 20, height: 20}}
                      source={{
                        uri: Constants.MATIC_Img,
                        priority: FastImage.priority.normal,
                      }}
                      {...({ resizeMode: FastImage.resizeMode.contain } as any)}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Matic}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {/* /****************************************************************************************** */}
        <View style={styles.ViewStyle1}>
          <View style={styles.ViewStyle2}>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.goBack()}
              disabled={!this.state.canGoBack}>
              <Image
                style={[
                  {
                    width: 25,
                    height: 25,
                    tintColor: ThemeManager.colors.statusBarColor1,
                  },
                  this.state.canGoBack ? {opacity: 1} : {opacity: 0.2},
                ]}
                source={Images.left_arrow}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.goForward()}
              disabled={!this.state.canGoForward}>
              <Image
                style={[
                  {
                    transform: [{rotate: '180deg'}],
                    width: 25,
                    height: 25,
                    tintColor: ThemeManager.colors.statusBarColor1,
                  },
                  this.state.canGoForward ? {opacity: 1} : {opacity: 0.2},
                ]}
                source={Images.left_arrow}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ViewStyle4}>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.reload()}>
              <Image
                style={{
                  width: 25,
                  height: 25,
                  tintColor: ThemeManager.colors.statusBarColor1,
                }}
                source={Images.reload}
              />
            </TouchableOpacity>
          </View>
        </View>
        {Platform.OS != 'ios' && (
          <LoaderView isLoading={this.state.isLoading} />
        )}

        {/* *************************************************** Confirm Transaction ********************************************* */}
        <Modal
          onRequestClose={() => this.closeModal()}
          visible={this.state.isVisible}
          animationType="fade"
          style={{margin: 0, justifyContent: 'flex-end'}}>
          {this.state.signingData && this.state.signingData.object && (
            <>
              {this.renderBlurView()}
              <View
                style={{
                  ...styles.modalView,
                }}>
                <View
                  style={{
                    ...styles.modalinner,
                    borderColor: ThemeManager.colors.borderColor,
                    backgroundColor: ThemeManager.colors.whiteBlacktext,
                  }}>
                  <View style={styles.ViewStyle5}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.titleSign,
                        color: ThemeManager.colors.blackWhiteText,
                      }}>
                      {browser.confirmTransaction}
                    </Text>
                    <TouchableOpacity
                      style={styles.touchableStyle}
                      onPress={() => {
                        this.closeModal();
                      }}>
                      <Image
                        style={{
                          tintColor: ThemeManager.colors.blackWhiteText,
                        }}
                        source={Images.close_icon}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{gap: 10}}>
                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.to}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {this.state.signingData.object.to}
                      </Text>
                    </View>

                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.From}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {this.state.signingData.object.from}
                      </Text>
                    </View>
                    <View>
                      {isEthOrQubeticsNetwork ? null : (
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.textLbl,
                            {
                              color: ThemeManager.colors.blackWhiteText,
                            },
                          ]}>
                          {sendTrx.transactionFee}
                        </Text>
                      )}
                      {isEthOrQubeticsNetwork
                        ? null
                        : this.renderSlowStandardFast()}
                      {isEthOrQubeticsNetwork ? (
                        <View style={[styles.vwSignTransaction]}>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.textLbl,
                              {color: ThemeManager.colors.blackWhiteText},
                            ]}>
                            {browser.gasFee}
                          </Text>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.txtValue,
                              {
                                color: ThemeManager.colors.placeholderColorNew,
                                marginLeft: dimen(6),
                              },
                            ]}>
                            {this.state.calculatedFee}{' '}
                            {selectedNetworkMeta?.displaySymbol}{' '}
                            {`(${
                              Singleton.getInstance().CurrencySymbol
                            } ${toFixedExp(
                              Number(this.state.calculatedFee) *
                                Number(networkFiatPrice || 0),
                              4,
                            )})`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.total}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {toFixedExp(
                          bigNumberSafeMath(
                            this.hex2dec(
                              this?.state?.signingData?.object?.value || 0,
                            ) /
                              10 ** 18,
                            '+',
                            this?.state?.calculatedFee || 0,
                          ),
                          10,
                        )}{' '}
                        {selectedNetworkMeta?.displaySymbol}
                      </Text>
                    </View>
                    <Button
                      btnstyle={{borderRadius: 6}}
                      buttontext={merchantCard.submit}
                      onPress={() => {
                        this.setState({isVisible: false, pinModal: true});
                      }}
                    />
                  </View>
                </View>
              </View>
              <LoaderView isLoading={this.state.isLoading} />
            </>
          )}
        </Modal>

        {/* /****************************************************************************************** */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({showAlertDialog: false, alertTxt: ''});
          }}
        />

        {this.renderSignReviewModal()}

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.pinModal}
          onRequestClose={() => {
            this.setState({pinModal: false});
          }}>
          <View style={{flex: 1}}>
            <EnterPinForTransaction
              onBackClick={() => {
                if (this.state.msgType?.startsWith('sign') && this.state.msgType !== 'signTransaction') {
                  this.dismissSignReview();
                }
                this.setState({pinModal: false});
              }}
              checkBiometric={true}
              closeEnterPin={(pin: any) => {
                this.setState({pinModal: false}, () => {
                  setTimeout(async () => {
                    if (
                      this.state.msgType == 'signPersonalMessage' ||
                      this.state.msgType == 'signMessage'
                    ) {
                      const message = this.state.signedData;
                      let mmid = message.id;
                      let pKey = await getEncryptedData(
                        `${Singleton.getInstance().defaultEthAddress}_pk`,
                        pin,
                      );
                      let msg = ethers.toUtf8String(
                        message?.object?.data,
                      );
                      let signedMessage =
                        await Singleton.getInstance().signPersonalMessage(
                          msg,
                          pKey,
                        );
                      pKey = '';
                      let js = `trustwallet.${message?.network}.sendResponse(${mmid}, "${signedMessage}")`;
                      this.webview?.injectJavaScript(js);
                    } else if (this.state.msgType == 'signTypedMessage') {
                      const message = this.state.signedData;
                      let approvalParam = JSON.parse(message?.object?.raw);

                      let typeArr = Object.keys(approvalParam.types);
                      let newTypes: any = {};
                      typeArr.map(el => {
                        if (el != 'EIP712Domain') {
                          newTypes[el] = approvalParam.types[el];
                        }
                      });

                      let newParams = {
                        domain: approvalParam.domain,
                        types: newTypes,
                        message: approvalParam.message,
                      };

                      consoleLogFunc('---------newParams:::::', newParams);
                      setTimeout(async () => {
                        let pvt_key = await getEncryptedData(
                          `${Singleton.getInstance().defaultEthAddress}_pk`,
                          pin,
                        );

                        Singleton.getInstance()
                          .dappApprovalHash(pvt_key, newParams)
                          .then(res => {
                            consoleLogFunc('res::::::::', res);
                            let mmid = message.id;
                            let js = `trustwallet.ethereum.sendResponse(${mmid}, "${res}")`;
                            this.webview?.injectJavaScript(js);
                            this.setState({loading: false});
                            pvt_key = '';
                          })
                          .catch(err => {
                            pvt_key = '';
                            consoleLogFunc('err::::::::', err);
                          });
                      }, 200);
                    } else {
                      this.signRawTxn(pin);
                    }
                  }, 1000);
                });
              }}
            />
          </View>
        </Modal>
      </>
    );
  }
}

export default connect(null, {
  requestNonce,
  requestGasEstimation,
  requestSendCoin,
  requestGasLimitForDapp,
  fetchNativePrice,
})(DappBrowserNew);
