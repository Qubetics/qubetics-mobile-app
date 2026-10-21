/* eslint-disable react-native/no-inline-styles */
import { Component } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  BackHandler,
  Platform,
  ImageBackground,
} from "react-native";
import styles from "./AddCustomTokenStyle";
import {
  Button,
  InputCustom,
  AppAlert,
  CustomTokenModal,
  HeaderMain,
  QRCodeScannerNew,
} from "../../common";
import { ThemeManager } from "../../../../ThemeManager";
import { connect } from "react-redux";
import { searchToken, addToken } from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import * as Constants from "../../../Constants";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LoaderView } from "../../common/LoaderView";
import { Actions } from '../../../navigation/RootNavigation';
import { InputCustomWithQrButton } from "../../common/InputCustomWithQrButton";
import { consoleLogFunc, getData } from "../../../Utils/MethodsUtils";
import { EventRegister } from "react-native-event-listeners";
import { validateTRXAddress } from "../../../Utils/TronUtils";
import { LanguageManager } from "../../../../LanguageManager";
import images from "../../../theme/Images";
import { moderateScale } from "../../../layouts/responsive";
import { getDimensionPercentage as dimen, getDimensionPercentage } from "../../../Utils";
import { validSolanaTokenAddress } from "../../../Utils/SolUtils";
import Clipboard from "@react-native-clipboard/clipboard";

const data = [
  {
    value: "Ethereum",
    symbol: "ERC-20",
    image: Constants.ETH_Img,
    coin_family: 2,
  },
  {
    value: "Binance",
    symbol: "BEP-20",
    image: Constants.BSC_Img,
    coin_family: 1,
  },
  {
    value: "Polygon",
    symbol: "POL ERC-20",
    image: Constants.MATIC_Img,
    coin_family: 4,
  },
  {
    value: "Tron",
    symbol: "TRC-20",
    image: Constants.TRX_Img,
    coin_family: 6,
  },
  {
    value: "Solana",
    symbol: "SPL",
    image: Constants.SOL_Img,
    coin_family: 5,
  },
  {
    value: "Qubetics",
    symbol: "TICS",
    image: Constants.TICS_Img,
    coin_family: 7,
  },
];

class AddCustomToken extends Component<any, any> {
  unfocus: any;
  backhandle: any;
  constructor(props: any) {
    super(props);
    this.state = {
      contractAddress: "",
      name: "",
      symbol: "",
      decimals: "",
      selected_coin_family: 2,
      searchTokenResponse: {},
      loading: false,
      isVisible: false,
      showAlertDialog: false,
      alertTxt: "",
      dropdown: false,
      showEthBnbInDropDown: true,
      isTokenSupportedOnSwap: false,
      showSuccessAlert: false,
      showSuccess: false,
      selectedCoinSymbol: data[0]?.symbol,
      networkList: data,
      selectedIndex: 0,
      invalidAddress: false,
    };
  }
  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showSuccessAlert: false,
        isVisible: false,
        showAlertDialog: false,
        alertTxt: "",
        dropdown: false,
      });
    });
    this.unfocus = this.props.navigation.addListener("blur", (event: any) => {
      this.setState({ isVisible: false, dropdown: false });
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      this.backhandle = (BackHandler as any)?.removeEventListener(
        "hardwareBackPress",
        // BUG PRESERVED: handleBackButtonClick is not defined on this class
        // @ts-ignore
        this.handleBackButtonClick
      );
      if (this.backhandle) this.backhandle.remove();
    });
    this.checkPrivateKey()
  }
  checkPrivateKey() {
    getData(Constants.MULTI_WALLET_LIST)
      .then(list => {
        let currentWallet = JSON.parse(list)

        currentWallet = currentWallet.find((res: any) => res?.defaultWallet)
        if (currentWallet?.isPrivateKey) {

          const list = data.filter((val) => val.coin_family == currentWallet?.coinFamily);

          this.setState({
            selected_coin_family: list[0]?.coin_family,
            selectedCoinSymbol: list[0]?.symbol,
            networkList: list,
          });
        }
      })
  }

  /******************************************************************************************/
  requestCameraPermission() {
    Singleton.getInstance()
      .cameraPermission()
      .then((res) => {
        if (res == "granted") {
          Singleton.isCameraOpen = true;
          this.setState({ isVisible: true });
        }
      });
  }

  /******************************************************************************************/
  async validateContractAddress(address: any) {
    address = address?.trim()
    const { alertMessages } = LanguageManager;
    if (
      this.state.selected_coin_family != 3 &&
      this.state.selected_coin_family != 5 &&
      this.state.selected_coin_family != 6 &&
      !/^(0x){1}[0-9a-fA-F]{40}$/i.test(address)
    ) {
      consoleLogFunc("address111>>>>>", address);
      this.setState({
        contractAddress: address,
        searchTokenResponse: {},
        name: "",
        symbol: "",
        decimals: "",
        showAlertDialog: true,
        alertTxt: alertMessages.invalidContractAddress,
      });
      return;
    } else if (
      this.state.selected_coin_family == 6 &&
      !validateTRXAddress(address)
    ) {
      consoleLogFunc("false address trx", address);
      this.setState({
        contractAddress: address,
        searchTokenResponse: {},
        name: "",
        symbol: "",
        decimals: "",
        showAlertDialog: true,
        invalidAddress: true,
        alertTxt: alertMessages.invalidContractAddress,
      });
      return;
    } else if (
      this.state.selected_coin_family == 5 &&
      !(await validSolanaTokenAddress(address))
    ) {
      consoleLogFunc("false address trx", address);
      this.setState({
        contractAddress: address,
        searchTokenResponse: {},
        name: "",
        symbol: "",
        decimals: "",
        showAlertDialog: true,
        invalidAddress: true,
        alertTxt: alertMessages.invalidContractAddress,
      });
      return;
    } else {
      this.setState({
        invalidAddress: false
      });
      this.searchToken(address);
    }
  }

  /******************************************************************************************/
  searchToken(address: any) {
    consoleLogFunc("0-=-=-=-=-0000000=-=--=-=------------------------")

    const { alertMessages } = LanguageManager;
    return new Promise((resolve, reject) => {
      this.setState({
        loading: true,
        contractAddress: address,
        searchTokenResponse: {},
      });
      const searchTokenReq = {
        tokenAddress: address,
        coinFamily: this.state.selected_coin_family,
      };
      getData(Constants.ACCESS_TOKEN).then((token) => {
        consoleLogFunc("START=-=--=-=------------------------")
        this.props
          .searchToken({ searchTokenReq, token })
          .then((res: any) => {
            this.setState({
              searchTokenResponse: res.data,
              name: res.data.name,
              symbol: res.data.symbol,
              decimals: res.data.decimals?.toString(),
              loading: false,
            });
            resolve(res);
          })
          .catch((e: any) => {
            this.setState({ loading: false });
            let errorMessage = e;
            consoleLogFunc("bfgjgfgjufj====>", e);
            if (!errorMessage)
              errorMessage = alertMessages.invalidContractAddress;
            this.setState({
              showAlertDialog: true,
              alertTxt: alertMessages.invalidContractAddress,
            });
            reject(e);
          });
      });
    });
  }

  /******************************************************************************************/
  addTokenApi() {
    this.hitAddToken();
  }

  /******************************************************************************************/
  hitAddToken() {
    const { alertMessages } = LanguageManager;
    const {
      searchTokenResponse,
      selected_coin_family,
      contractAddress,
    } = this.state;
    const addTokenReq = {
      name: searchTokenResponse.name,
      symbol: searchTokenResponse.symbol,
      decimals: searchTokenResponse?.decimals?.toString(),
      token_address: contractAddress,
      coin_family: selected_coin_family,
      wallet_address:
        selected_coin_family == 6
          ? Singleton.getInstance().defaultTrxAddress :
          selected_coin_family == 5
            ? Singleton.getInstance().defaultSolAddress
            : Singleton.getInstance().defaultEthAddress,
      wallet_name: Singleton.getInstance().walletName || "Basic",
      isSwapList: this.state.isTokenSupportedOnSwap,
      token_type:
        selected_coin_family == 1
          ? "BEP20"
          : selected_coin_family == 5 ? "SPL" :
            selected_coin_family == 6
              ? "TRC20"
              : "ERC20",
    };

    consoleLogFunc("addTokenReq ::::::::", addTokenReq);
    this.props
      .addToken({ addTokenReq })
      .then((res: any) => {
        consoleLogFunc("res ::::::::", res);
        this.setState({ loading: false });
        this.setState({
          showSuccessAlert: true,
          alertTxt: res?.message,
          showSuccess:
            res?.message == alertMessages.tokenAlreadyExist ? false : true,
        });
        if (res.status) {
        }
      })
      .catch((e: any) => {
        this.setState({ loading: false });
        let errorMessage = e;
        if (!errorMessage) errorMessage = alertMessages.somethingWentWrong;
        this.setState({ showAlertDialog: true, alertTxt: errorMessage });
      });
  }

  /******************************************************************************************/
  onPressItem(item: any, index: any) {
    this.setState({
      selectedCoinSymbol: item.symbol,
      dropdown: false,
      selected_coin_family: item.coin_family,
      contractAddress: "",
      symbol: "",
      decimals: "",
      name: "",
      selectedIndex: index
    });
  }

  /******************************************************************************************/
  donePressed() {
    const { name, symbol, decimals, contractAddress } = this.state;

    if (this.state.invalidAddress && this.state.contractAddress.trim().length > 0) {
      this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.invalidContractAddress,
      });
    }
    else if (
      name.trim().length == 0 ||
      symbol.trim().length == 0 ||
      decimals.trim().length == 0 ||
      contractAddress.trim().length == 0
    )
      this.setState({
        showAlertDialog: true,
        alertTxt: LanguageManager.alertMessages.allFieldsAreMandatory,
      });
    else {
      this.setState({ loading: true });
      this.addTokenApi();
    }
  }

  /******************************************************************************************/
  async onPressPaste() {
    const address = await Clipboard.getString();
    this.validateContractAddress(address);
  }

  /******************************************************************************************/
  hideAlert() {
    this.setState({ showSuccessAlert: false });
    if (Actions.currentScene == "AddCustomToken") {
      Actions.pop()
      if (this.props.from != "walletMain") {
        Actions.pop()
      }
    }
  }

  /******************************************************************************************/
  render() {
    const {
      sendTrx,
      merchantCard,
      placeholderAndLabels,
      addressBook,
    } = LanguageManager;
    if (this.state.isVisible)
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: ThemeManager.colors.mainBgNew,
          }}
        >
          <Modal
            animationType={"slide"}
            transparent={true}
            visible={this.state.isVisible}
            onRequestClose={() => {
              consoleLogFunc("Modal has been closed.");
            }}
          >
            <View style={[styles.modalView, { flex: 1 }]}>
              <View
                style={{ backgroundColor: ThemeManager.colors.mainBgNew, flex: 1, marginTop: -5 }}
              >
                <QRCodeScannerNew
                  cameraStyle={styles.cameraStyle}
                  onRead={(event: any) => {
                    this.setState({ isVisible: false }, () => {
                      setTimeout(() => {
                        this.validateContractAddress(event.data);

                      }, 500)
                    });

                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    this.setState({ isVisible: false });
                  }}
                >
                  <Text allowFontScaling={false} style={[styles.cancelText, { color: ThemeManager.colors.blackWhiteText, marginRight: Platform.OS == 'ios' ? getDimensionPercentage(30) : getDimensionPercentage(15), }]}>
                    {sendTrx.Cancel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      );
    /******************************************************************************************/
    return (
      <ImageBackground
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        source={ThemeManager.ImageIcons.mainBgImgNew}
      >
        <HeaderMain BackButtonText={addressBook.addCustomToken} />
        <KeyboardAwareScrollView>


          <View style={styles.ViewStyle}>

            <View style={{
              flexDirection: "row",
              padding: 10,
              backgroundColor: "rgba(247, 147, 26, 0.15)",
              borderRadius: 14
            }}>
              <Image
                style={{ marginTop: 7 }}
                source={images.disclaimer} />
              <Text
                style={styles.disclaimerText}
              >{addressBook.disclaimer}</Text>
            </View>
            <Text
              allowFontScaling={false}
              style={[
                styles.txtNetwork,
                { color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {" "}
              {addressBook.network}
            </Text>

            <TouchableOpacity
              disabled={!this.state.showEthBnbInDropDown}
              onPress={() => {
                this.setState({ dropdown: true });
              }}
            >
              <View
                style={[
                  styles.ViewStyle1,
                  {
                    borderColor: ThemeManager.colors.blackWhiteText,
                  },
                ]}
              >
                <View style={styles.selectToken}>
                  <View
                    style={{ flexDirection: "row", justifyContent: "center" }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.coinTextStyle,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {this.state.selectedCoinSymbol}
                    </Text>
                  </View>
                  <Image
                    style={{
                      resizeMode: "contain",
                      width: moderateScale(15),
                      height: moderateScale(15),
                      tintColor: "#818686",
                    }}
                    source={images.dropdown}
                  />
                </View>
              </View>
            </TouchableOpacity>

            <Text
              allowFontScaling={false}
              style={[
                styles.txtNetwork,
                { marginTop: 0, color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {addressBook.contractAddress}
            </Text>
            <View style={styles.ViewStyle2}>
              <InputCustomWithQrButton
                isPaste={true}
                paste={placeholderAndLabels.paste}
                onPressPaste={() => this.onPressPaste()}
                placeHolder={"0X31471e0791fcdbe82fbf4c4..."}
                showQrCode={() => {
                  this.requestCameraPermission();
                }}
                outsideView={{ borderColor: ThemeManager.colors.inputBorder, borderWidth: 1, }}
                customInputStyle={[styles.placeHolderStyle, {
                  height: getDimensionPercentage(Platform.OS == "ios" ? 40 : 55),
                  marginTop: getDimensionPercentage(Platform.OS == "ios" ? 3 : 0),

                }]}
                placeholderTextColor={ThemeManager.colors.placeHolderText}
                value={this.state.contractAddress}
                onChangeText={(value: any) => {
                  this.setState({ invalidAddress: false, contractAddress: value, })
                }}
                onSubmitEditing={() => {
                  this.validateContractAddress(this.state.contractAddress);
                }}
                onBlur={() => {
                  this.validateContractAddress(this.state.contractAddress);
                }}
              />
            </View>

            <Text
              allowFontScaling={false}
              style={[
                styles.txtNetwork,
                { marginTop: 0, color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {addressBook.nameSimple}
            </Text>
            <View style={[styles.ViewStyle2, { height: 50 }]}>
              <InputCustom
                placeHolder={addressBook.enterName}
                customInputStyle={[styles.placeHolderStyle, {
                  borderWidth: 1,
                  borderColor: ThemeManager.colors.inputBorder,
                  color: ThemeManager.colors.blackWhiteText,
                }]}
                placeholderTextColor={ThemeManager.colors.legalGreyColor}
                value={this.state.name}
                editable={false}
                onChangeText={(value: any) => {
                  this.setState({ name: value });
                }}
              />
            </View>


            <Text
              allowFontScaling={false}
              style={[
                styles.txtNetwork,
                {
                  marginTop: 0,
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}
            >
              {addressBook.symbol}
            </Text>
            <View style={[styles.ViewStyle2, { height: 50 }]}>
              <InputCustom
                placeHolder="BN"
                customInputStyle={{
                  borderWidth: 1,
                  color: ThemeManager.colors.blackWhiteText,
                  borderColor: ThemeManager.colors.inputBorder,
                }}
                placeholderTextColor={ThemeManager.colors.legalGreyColor}
                value={this.state.symbol}
                editable={false}
              />
            </View>

            <Text
              allowFontScaling={false}
              style={[
                styles.txtNetwork,
                {
                  marginTop: 0,
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}
            >
              {addressBook.decimals}
            </Text>
            <View style={[styles.ViewStyle2, { height: 50 }]}>
              <InputCustom
                placeHolder="16"
                customInputStyle={{
                  borderWidth: 1,
                  borderColor: ThemeManager.colors.inputBorder,
                  color: ThemeManager.colors.blackWhiteText,
                }}
                placeholderTextColor={ThemeManager.colors.legalGreyColor}
                value={this.state.decimals}
                editable={false}
              />
            </View>
          </View>
          <View style={[styles.ViewStyle2, { height: 20 }]} />


        </KeyboardAwareScrollView>
        <View
          style={{ paddingHorizontal: 23, marginBottom: dimen(52) }}
          pointerEvents={this.state.loading ? "none" : "auto"}
        >
          <Button
            buttontext={merchantCard.done}
            onPress={() => {
              this.donePressed();
            }}
          />
        </View>


        {/* ------------------------------------------------------------------------------------------------------------------------ */}
        <CustomTokenModal
          openModel={this.state.dropdown}
          onPress={(item: any, index: any) => this.onPressItem(item, index)}
          onPressIn={() => this.setState({ dropdown: false })}
          list={this.state.networkList}
          selectedIndex={this.state.selectedIndex}
        />
        <LoaderView isLoading={this.state.loading} />
        {/* ------------------------------------------------------------------------------------------------------------------------ */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
            this.props.previousScreen == "";
          }}
        />
        {/* ------------------------------------------------------------------------------------------------------------------------ */}
        <AppAlert
          visible={this.state.showSuccessAlert}
          showSuccess={this.state.showSuccess}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.hideAlert();
          }}
        />
      </ImageBackground>
    );
  }
}
export default connect(null, { searchToken, addToken })(
  AddCustomToken
);
