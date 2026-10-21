import {Component} from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import styles from './SendNftStyle';
import {
  AddressModal,
  AppAlert,
  Button,
  HeaderMain,
  InputCustom,
  InputCustomWithPasteButton,
  LoaderView,
  QRCodeScannerNew,
} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import images from '../../../theme/Images';
import {widthDimen} from '../../../Utils';
import {Colors} from '../../../theme';
import Singleton from '../../../Singleton';
import {EventRegister} from 'react-native-event-listeners';
import * as Constants from '../../../Constants';
import {Modal} from 'react-native';
import ConfirmNftModal from '../../common/ConfirmNftModal';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import ContactsBook from '../ContactsBook/ContactsBook';
import { Actions } from '../../../navigation/RootNavigation';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import {
  fetchNativePrice,
  requestGasEstimation,
  requestSendCoin,
} from '../../../Redux/Actions';
import {connect} from 'react-redux';
import {
  dynamicGasEstimateUrl,
  dynamicSendUrl,
  getEthBal,
  getSignRawTxnTokenForNft,
  getTotalGasFee,
} from '../../../Utils/EthUtils';
import {SvgUri} from 'react-native-svg';
import FastImage from 'react-native-fast-image';

class SendNft extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      gasFeeMultiplier: 0.000000000000000001,
      isLoading: false,
      isVisible: false,
      showConfirmModal: false,
      PinModal: false,
      showAddressBookModal: false,
      showContactlModal: false,
      newObj: '',
      selected_Index: undefined,
      selectedItem: '',
      showAlertDialog: false,
      isReqSent: false,
      alertTxt: '',
      amount: '',
      toAddress: '',
      gasEstimate: 0,
      gasPrice: 0,
      totalFee: 0,
      nativePrice: 0,
      isInsufficientBalance: false,
    };
  }

  async componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        isVisible: false,
        showConfirmModal: false,
        showAddressBookModal: false,
        showContactlModal: false,
      });
    });

    this.getGasLimit();
    this.fetchNativePrice();
  }

  getGasLimit() {
    this.setState({isLoading: true});
    const wallet_address = Singleton.getInstance().defaultEthAddress;
    let gasEstimationReq = {
      from: wallet_address,
      to: wallet_address,
      amount: '1',
      token_value: '1',
    };
    consoleLogFunc(
      'gasEstimationReq>>>>',
      gasEstimationReq,
      this.props.nftData,
    );

    getData(Constants.ACCESS_TOKEN).then(token => {
      consoleLogFunc(
        'token>>>',
        dynamicGasEstimateUrl(
          this.props.nftData?.coin_family,
          this.props.nftData?.token_address,
        ),
        token,
      );
      this.props
        .requestGasEstimation({
          url: dynamicGasEstimateUrl(
            this.props.nftData?.coin_family,
            this.props.nftData?.token_address,
          ),
          gasEstimationReq,
          token,
        })
        .then((res1: any) => {
          consoleLogFunc('chk gasEstimate res:::::', res1);
          this.getTotalFee(res1.gas_estimate);
        })
        .catch((e: any) => {
          consoleLogFunc('chk gasEstimate error:::::', e);

          this.setState({isLoading: false});
          this.setState({showAlertDialog: true, alertTxt: e});
        });
    });
  }

  fetchNativePrice() {
    let data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: this.props.nftData?.coin_family,
    };
    this.props
      .fetchNativePrice({data})
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

  getTotalFee = (gasLimit = 21000) => {
    this.setState({isLoading: true});
    setTimeout(async () => {
      const Totalfee = await getTotalGasFee(this.props.nftData?.coin_family);
      const value = Totalfee
        ? exponentialToDecimal(
            (Totalfee as any) * this.state.gasFeeMultiplier * gasLimit,
          )
        : 0;
      consoleLogFunc(' value:::::', value);
      const fee = parseFloat(value as any).toFixed(6);
      const bal = await getEthBal(
        Singleton.getInstance().defaultEthAddress,
        this.props.nftData?.coin_family,
      );
      if (parseFloat(fee) > parseFloat(bal as any)) {
        this.setState({
          showAlertDialog: true,
          alertTxt:
            (LanguageManager.alertMessages as any)[
              this.props.nftData?.coin_family == 2
                ? 'youhaveInsufficientEthBalance'
                : 'youhaveInsufficientTicsBalance'
            ],
          isInsufficientBalance: true,
        });
      }
      this.setState({
        gasEstimate: gasLimit * 2,
        gasPrice: Totalfee,
        totalFee: fee,
        isLoading: false,
      });
    }, 100);
  };

  requestCameraPermission() {
    Singleton.getInstance()
      .cameraPermission()
      .then(res => {
        if (res == 'granted') {
          Singleton.isCameraOpen = true;
          this.setState({isVisible: true});
        }
      });
  }

  sendTransaction() {
    const {alertMessages} = LanguageManager;
    const {toAddress, amount} = this.state;

    if (toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(toAddress))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAddress,
      });
    else if (
      toAddress.toLowerCase() ==
      Singleton.getInstance().defaultEthAddress.toLowerCase()
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
      parseFloat(amount) > parseFloat(toFixedExp(this.props.nftData?.amount, 8))
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    else if (this.state.isInsufficientBalance) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientEthBalance,
      });
    } else {
      this.setState({showConfirmModal: true});
    }
  }
  getAddress = (address: any) => {
    this.setState({toAddress: address, showContact: false});
  };
  onMaxClicked = () => {
    this.setState({
      amount: this.props.nftData?.amount || '',
    });
  };

  onPressItem(item: any, index: any) {
    this.setState({selected_Index: index});
    setTimeout(() => {
      this.setState({showContactlModal: false});
      this.getAddress(item?.wallet_address);
    }, 800);
  }
  onPinSuccess(pin: any) {
    this.setState({PinModal: false}, () => {
      this.setState({isLoading: true});
      setTimeout(async () => {
        const {gasEstimate, toAddress, amount} = this.state;
        let privateKey = await getEncryptedData(
          `${Singleton.getInstance().defaultEthAddress}_pk`,
          pin,
        );
        const chainId =
          this.props.nftData?.coin_family == 2 ? '0x01' : '0x2346';

        consoleLogFunc('DATA>>', this.props.nftData?.token_type);

        getSignRawTxnTokenForNft(
          chainId,
          privateKey,
          this.props.nftData?.token_id,
          this.props.nftData?.token_address,
          gasEstimate,
          toAddress,
          Singleton.getInstance().defaultEthAddress,
          this.props.nftData?.coin_family,
          this.props.nftData?.token_type == 'ERC721',
          amount,
        )
          .then(res => {
            consoleLogFunc('RES>>', res);
            this.sendSerializedTxn(res?.signedRaw, res?.nonce);
          })
          .catch(err => {
            consoleLogFunc('ERR>>', err);
          });
      }, 200);
    });
  }

  sendSerializedTxn(tx_raw: any, nonce: any) {
    const {toAddress, amount, gasEstimate, gasPrice} = this.state;
    let sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultEthAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: gasEstimate,
      gas_price: gasPrice,
      tx_type: 'withdraw',
    };
    consoleLogFunc('sendCoinReq::::', sendCoinReq);
    this.props
      .requestSendCoin({
        url: dynamicSendUrl(
          this.props.nftData?.coin_family,
          this.props.nftData?.token_address,
        ),
        sendCoinReq,
      })
      .then((res: any) => {
        this.setState({
          isLoading: false,
          showAlertDialog: true,
          alertTxt: res?.message,
          isReqSent: true,
        });
      })
      .catch((e: any) => {
        this.setState({isLoading: false, showAlertDialog: true, alertTxt: e});
      });
  }

  render() {
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
        <HeaderMain BackButtonText={LanguageManager.nftData.sendNFT} />
        <ScrollView style={{flex: 1, paddingHorizontal: 24}}>
          <View style={{flexDirection: 'row'}}>
            {this.props.nftData?.image?.includes('.svg') ? (
              <SvgUri
                style={styles.imageStyle}
                uri={this.props.nftData?.image}
              />
            ) : this.props.nftData?.image != null ? (
              <FastImage
                source={{uri: this.props.nftData?.image}}
                style={styles.imageStyle}
              />
            ) : (
              <Image
                source={(images as any).nftPlaceholder /* BUG PRESERVED: image key missing */}
                style={styles.imageStyle}
                resizeMode="contain"
              />
            )}

            <View
              style={{justifyContent: 'center', marginLeft: widthDimen(20)}}>
              <Text
                style={[
                  styles.name,
                  {color: ThemeManager.colors.subTextColor},
                ]}>
                {this.props.nftData?.name}
              </Text>
              <Text
                style={[
                  styles.tokenId,
                  {color: ThemeManager.colors.legalGreyColor},
                ]}>
                {LanguageManager.nftData.tokenID}:
                <Text style={{color: ThemeManager.colors.subTextColor}}>
                  {' #'}
                  {this.props.nftData?.token_id}
                </Text>
              </Text>
              <Text
                style={[
                  styles.Standard,
                  {color: ThemeManager.colors.legalGreyColor},
                ]}>
                {LanguageManager.nftData.Standard}:
                <Text style={{color: ThemeManager.colors.subTextColor}}>
                  {' '}
                  {this.props.nftData?.token_type}
                </Text>
              </Text>
            </View>
          </View>

          <View style={{marginTop: 30, marginBottom: 24}}>
            <Text
              allowFontScaling={false}
              style={[
                styles.txtWallet,
                {color: ThemeManager.colors.blackWhiteText},
              ]}>
              {LanguageManager.receive.address}
            </Text>

            <View
              style={[
                styles.ViewStyle,
                {
                  backgroundColor: 'transparent',
                  borderColor: ThemeManager.colors.inputBorder,
                },
              ]}>
              <InputCustomWithPasteButton
                placeHolder={LanguageManager.nftData.enterAddress}
                value={this.state.toAddress}
                customInputStyle={[
                  styles.ViewStyle1,
                  {
                    backgroundColor: 'transparent',
                    color: ThemeManager.colors.blackWhiteText,
                  },
                ]}
                placeholderTextColor={ThemeManager.colors.inputBorder}
                onChangeText={(text: any) => {
                  this.setState({
                    toAddress: text,
                  });
                }}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 80,
                  top: 15,
                  alignSelf: 'center',
                }}
                onPress={() => {
                  Clipboard.getString().then(address => {
                    this.setState({
                      toAddress: address,
                    });
                  });
                }}>
                <Text
                  style={[
                    styles.txtWallet,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {'Paste'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{position: 'absolute', right: 50, top: 17}}
                onPress={() => {
                  this.setState({showAddressBookModal: true});
                }}>
                <Image
                  source={ThemeManager.ImageIcons.addressBookIcon}
                  style={{
                    tintColor: ThemeManager.colors.subTextColor,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.requestCameraPermission()}
                style={styles.scan}>
                <Image
                  style={{
                    tintColor: ThemeManager.colors.blackWhiteText,
                  }}
                  source={ThemeManager.ImageIcons.scan}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text
              allowFontScaling={false}
              style={[
                styles.txtWallet,
                {height: 40, color: ThemeManager.colors.blackWhiteText},
              ]}>
              {LanguageManager.nftData.Quantity}
            </Text>
            <Text
              allowFontScaling={false}
              style={[
                styles.txtWallet,
                {height: 40, color: ThemeManager.colors.legalGreyColor},
              ]}>
              {LanguageManager.nftData.availableNFT}:
              <Text style={{color: ThemeManager.colors.blackWhiteText}}>
                {' '}
                {this.props.nftData?.amount}
              </Text>
            </Text>
          </View>

          <View
            style={[
              styles.ViewStyle2,
              {
                borderColor: ThemeManager.colors.inputBorder,
                backgroundColor: 'transparent',
              },
            ]}>
            <InputCustom
              placeHolder={'0'}
              placeholderColor={Colors.placeholderColor}
              keyboardType="decimal-pad"
              maxLength={15}
              customInputStyle={[
                styles.ViewStyle4,
                {color: ThemeManager.colors.settingsText},
              ]}
              placeholderTextColor={ThemeManager.colors.inputBorder}
              value={this.state.amount}
              onChangeText={(text: any) => {
                this.setState({amount: text});
              }}
            />
            <TouchableOpacity
              onPress={() => {
                this.onMaxClicked();
              }}
              style={styles.maxStyle}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.maxText,
                  {color: ThemeManager.colors.primaryColor},
                ]}>
                {LanguageManager.sendTrx.max}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.transactionFees,
              {color: ThemeManager.colors.legalGreyColor},
            ]}>
            {LanguageManager.nftData.transactionFees}{' '}
            {`(${this.props.nftData?.coin_family == 2 ? 'ETH' : 'TICS'})`}:
            <Text style={{color: ThemeManager.colors.subTextColor}}>
              {'  '}
              {this.state.totalFee}
            </Text>
          </Text>
        </ScrollView>

        <View style={styles.btnView}>
          <Button
            onPress={() => {
              this.sendTransaction();
            }}
            customStyle={{marginTop: 20}}
            buttontext={LanguageManager.nftData.Confirm}
          />
        </View>

        <ConfirmNftModal
          onPressCancel={() => this.setState({showConfirmModal: false})}
          visible={this.state.showConfirmModal}
          data={this.props.nftData}
          toAddress={this.state.toAddress}
          fees={this.state.totalFee}
          feeSymbol={this.props.nftData?.coin_family == 2 ? 'ETH' : 'TICS'}
          nativePrice={this.state.nativePrice}
          onPressContinue={() =>
            this.setState({showConfirmModal: false}, () => {
              this.setState({
                PinModal: true,
              });
            })
          }
        />

        {this.state.showAddressBookModal && (
          <ContactsBook
            handleBack={() => this.setState({showAddressBookModal: false})}
            showAddressBookModal={this.state.showAddressBookModal}
            newObj={this.state.newObj}
            getAddress={this.getAddress}
            address={Singleton.getInstance().defaultEthAddress}
            coin_family={this.props.nftData?.coin_family}
            onPressView={(item: any) => {
              this.setState({
                showAddressBookModal: false,
                showContactlModal: true,
                selectedItem: item,
              });
            }}
            addbook={() => {
              this.setState({showAddressBookModal: false});
              Actions.currentScene != 'AddContact' &&
                (Actions as any).AddContact({themeSelected: this.props.themeSelected});
            }}
            navigation={this.props.navigation}
          />
        )}
        {this.state.showContactlModal && (
          <AddressModal
            selected_Index={this.state.selected_Index}
            onPressItem={(item: any, index: any) => this.onPressItem(item, index)}
            dismiss={() => this.setState({showContactlModal: false})}
            item={this.state.selectedItem}
            openModel={this.state.showContactlModal}
          />
        )}

        <Modal
          statusBarTranslucent
          animationType="slide"
          transparent={true}
          visible={this.state.PinModal}
          onRequestClose={() => {
            this.setState({PinModal: false});
          }}>
          <View style={{flex: 1}}>
            <EnterPinForTransaction
              checkBiometric={true}
              onBackClick={() => {
                this.setState({PinModal: false});
              }}
              closeEnterPin={(res: any) => {
                this.onPinSuccess(res);
              }}
            />
          </View>
        </Modal>
        <LoaderView isLoading={this.state.isLoading} />

        <Modal
            animationType={'slide'}
            transparent={true}
            visible={this.state.isVisible}
            onRequestClose={() => {
              consoleLogFunc('Modal has been closed.');
            }}>
            <View style={[styles.modalView, {flex: 1}]}>
              <View
                style={{
                  backgroundColor: ThemeManager.colors.mainBgNew,
                  flex: 1,
                  marginTop: -5,
                }}>
                <QRCodeScannerNew
                  cameraStyle={styles.cameraStyle}
                  onRead={(event: any) => {
                    this.setState({isVisible: false, toAddress: event.data});
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    this.setState({isVisible: false});
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.txtCancel,
                      ,
                      {color: ThemeManager.colors.blackWhiteText},
                    ]}>
                    {LanguageManager.sendTrx.Cancel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          showSuccess={this.state.isReqSent}
          hideAlertDialog={() => {
            this.setState({showAlertDialog: false});
            if (this.state.isReqSent) {
              Actions.pop();
              Actions.pop();
            }
          }}
        />
      </ImageBackground>
    );
  }
}

export default connect(null, {
  requestGasEstimation,
  requestSendCoin,
  fetchNativePrice,
})(SendNft);
