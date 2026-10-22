import { Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  ScrollView,
  Image,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from "./ReceiveStyle";
import { AppAlert, Button, GradientBorderView, HeaderMain } from "../../common";
import { ThemeManager } from "../../../../ThemeManager";
import Singleton from "../../../Singleton";
import { EventRegister } from "react-native-event-listeners";
import * as Constants from "../../../Constants";
import { consoleLogFunc, getCryptoAddress } from "../../../Utils/MethodsUtils";
import { LanguageManager } from "../../../../LanguageManager";
import {
  heightDimen,
  widthDimen,
} from "../../../Utils";
import Toast from "react-native-easy-toast";
import { Images } from "../../../theme";
import CustomQRCode from "./CustomQRCode";
import images from "../../../theme/Images";
import Clipboard from "@react-native-clipboard/clipboard";

class Receive extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      walletAddress: this.props.accouttopup ? Singleton.getInstance().defaultCosmosAddress : getCryptoAddress(this.props.selectedCoin?.coin_family, this.props.isFromChainAbstraction),
      selectedAddressType: this.props.accouttopup ? this.props.accouttopup : "default", // Tracks the selected address type
      showAlertDialog: false,
      alertTxt: "",
      selectedData: this.props.selectedCoin,
      isDisable: false,
      showDropdown: false, // Controls dropdown visibility
      cosmosAddress: Singleton.getInstance().defaultCosmosAddress,
    };
  }

  componentDidMount() {
    consoleLogFunc(
      "this.props.selectedCoin?.coin_family:::::",
      this.props.selectedCoin?.coin_family
    );
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({ showAlertDialog: false, alertTxt: "" });
    });
    this.props.navigation.addListener("fodidFocuscus", () => {
      this.setState({ isDisable: false });
    });
    EventRegister.addEventListener("enableTouchable", () => {
      this.setState({ isDisable: false });
    });
  }

  set_Text_Into_Clipboard = async () => {
    const { alertMessages } = LanguageManager;
    await Clipboard.setString(this.state.walletAddress);
    this.setState({
      showAlertDialog: true,
      alertTxt: alertMessages.walletAddressCopied,
    });
  };


  shareAddress(addressTxt: any, address: any) {
    const symbol =
      this.state.selectedData.is_token == 1
        ? this.state.selectedData.coin_family == 2
          ? " ERC-20"
          : this.state.selectedData.coin_family == 1
            ? " BEP-20"
            : this.state.selectedData.coin_family == 4
              ? " POL ERC-20"
              : this.state.selectedData.coin_family == 6
                ? " TRC-20"
                : this.state.selectedData.coin_family == 5
                  ? " SPL(SOL)"
                  : this.state.selectedData.coin_family == 5
                    ? " TICS"
                    : ""
        : (Constants.COIN_INFO_BY_FAMILY as any)[this.state.selectedData.coin_family]
          .coin_symbol;
    try {
      this.setState({ isDisable: true });
      Singleton.isPermission = true;
      Share.share({
        message: `Qubetics wallet\nMy ${symbol?.toUpperCase()} Address: ${address}`,
      }).then((result) => {
        this.setState({ isDisable: false });
        if (result.action === Share.sharedAction) {
          consoleLogFunc("Shared successfully");
        } else if (result.action === Share.dismissedAction) {
          consoleLogFunc("Share dismissed");
        }
      });
    } catch (error) {
      consoleLogFunc("Share error:", error);
      this.setState({ isDisable: false });
    }
  }


  // Handle address selection from dropdown
  selectAddress = (addressType: any, address: any) => {
    this.setState({
      selectedAddressType: addressType,
      walletAddress: address,
      showDropdown: false,
    });
  };

  render() {
    const { walletMain, receive } = LanguageManager;
    const {
      selectedData,
      walletAddress,
      selectedAddressType,
      showDropdown,
      cosmosAddress,
    } = this.state;

    // Define address options for dropdown
    const addressOptions = [
      {
        type: "default",
        label: `${(Constants.COIN_INFO_BY_FAMILY as any)[selectedData.coin_family].coin_name
          } Address`,
        address: getCryptoAddress(selectedData.coin_family, this.props?.isFromChainAbstraction),
      },
    ];
    if (selectedData.coin_family == 7 && cosmosAddress && !this.props.isFromChainAbstraction) {
      addressOptions.push({
        type: "cosmos",
        label: "Cosmos Address",
        address: cosmosAddress,
      });
    }

    return (
      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <ScrollView
          bounces={false}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={"always"}
        >
          <HeaderMain
            BackButtonText={`${walletMain.receive
              } ${selectedData.coin_symbol.toUpperCase()}`}
            customStyle={{ paddingHorizontal: widthDimen(24) }}
          />
          <View style={{}}>
            <View style={styles.qrBlock}>
              <CustomQRCode address={walletAddress} />
            </View>

            <View
              style={[
                styles.qrAddress,
                { borderColor: ThemeManager.colors.inputBorder },
              ]}
            >
              <View style={{ flex: 1, marginRight: widthDimen(10) }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: ThemeManager.colors.legalGreyColor,
                  }}
                >
                  Your{" "}
                  {
                    addressOptions.find(
                      (opt) => opt.type === selectedAddressType
                    )?.label
                  }
                </Text>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={[
                    styles.qrAddressTextStyle,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}
                >
                  {walletAddress}
                </Text>
              </View>
              {selectedData.coin_family == 7 ? (
                <TouchableOpacity
                  style={{ paddingLeft: 10, paddingVertical: 10 }}
                  onPress={() => this.setState({ showDropdown: !showDropdown })}
                >
                  <Image source={images.dropdown} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={this.set_Text_Into_Clipboard}>
                  {/* @ts-ignore gradientStyle prop is optional at runtime */}
                  <GradientBorderView mainStyle={styles.copyButtonNew}>
                    <Text
                      style={[
                        styles.copyButtonText,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      Copy
                    </Text>
                    <Image
                      style={{ tintColor: ThemeManager.colors.blackWhiteText }}
                      source={Images.copyDarkButton}
                    />
                  </GradientBorderView>
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown Menu */}
            {showDropdown && selectedData.coin_family == 7 && (
              <View
                style={[
                  styles.qrAddressExpand,
                  { borderColor: ThemeManager.colors.inputBorder },
                ]}
              >
                {addressOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    onPress={() =>
                      this.selectAddress(option.type, option.address)
                    }
                    style={{ marginVertical: 5 }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: ThemeManager.colors.legalGreyColor,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={[
                        styles.qrAddressTextStyle,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {option.address}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View
            style={{
              paddingHorizontal: widthDimen(21),
              marginTop: heightDimen(30),
            }}
          >
            <Text
              style={[
                styles.warningText,
                { color: ThemeManager.colors.placeholderBg },
              ]}
            >
              Send only{" "}
              {selectedData.coin_symbol == "eth"
                ? "Ethereum (ETH)"
                : selectedData.coin_symbol == "bnb"
                  ? "BNB smart chain"
                  : selectedData.coin_symbol.toUpperCase()}{" "}
              to this address. Sending any other coins may result in permanent
              loss.
            </Text>
          </View>
        </ScrollView>
        {selectedData.coin_family == 7 ? (
          <>
            <View style={[styles.textContainer, { bottom: 5 }]}>
              <Button
                onPress={() => {
                  clearTimeout(this.shareAddressRef);
                  this.shareAddressRef = setTimeout(() => {
                    this.shareAddress(
                      selectedData.coin_symbol.toUpperCase(),
                      walletAddress
                    );
                  }, 800);
                }}
                customStyle={{ flex: 1, marginRight: 10 }}
                buttontext={receive.shareYourAddress}
              />
              <Button
                onPress={this.set_Text_Into_Clipboard}
                customStyle={{ flex: 1, marginLeft: 10 }}
                buttontext={"Copy"}
              />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.textContainer, { bottom: 5 }]}>
              <Button
                onPress={() => {
                  clearTimeout(this.shareAddressRef);
                  this.shareAddressRef = setTimeout(() => {
                    this.shareAddress(
                      `${selectedData.coin_symbol.toUpperCase()}`,
                      this.state.walletAddress
                    );
                  }, 800);
                }}
                customStyle={{ flex: 1 }}
                buttontext={receive.shareYourAddress}
              />
            </View>
          </>
        )}

        <Toast
          ref={(toast: any) => (this.toast = toast)}
          position="bottom"
          // @ts-ignore style is not a Toast prop in typings
          style={{ backgroundColor: ThemeManager.colors.toastBg }}
        />
        <AppAlert
          visible={this.state.showAlertDialog}
          showSuccess={true}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => this.setState({ showAlertDialog: false })}
        />
      </BackgroundImage>
    );
  }
}

export default Receive;
