import {
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BackgroundImage from "./BackgroundImage";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import Singleton from "../../Singleton";
import { Fonts, Images } from "../../theme";
import { getDimensionPercentage } from "../../Utils";
import { toFixedExp } from "../../Utils/MethodsUtils";
import { AppAlert } from "./AppAlert";
import { Button } from "./Button";
import DottedLine from "./DottedLine";
import { HeaderMain } from "./HeaderMain";
import { LoaderView } from "./LoaderView";

export const ConfirmSwapCrosschain = (props: any) => {
  
  const { commonText, merchantCard } = LanguageManager;

  //******************************************************************************************/
  const maskAddress = (address: any) => {
    const a = address?.slice(0, 10);
    const b = address?.slice(-10);
    return a + "..." + b;
  };
  //******************************************************************************************/
  const getCoinSymbol = (item: any) => {
    const symbol =
      item.coin_family == 1
        ? " BNB"
        : item.coin_family == 2
          ? " ETH"
          : item.coin_family == 3
            ? " BTC"
            : item.coin_family == 4
              ? " MATIC"
              : item.coin_family == 5
                ? " SOL"
                : item.coin_family == 6
                  ? " TRX"
                 : item.coin_family == 7? " TICS"
                  : " ETH";
    return symbol;
  };

  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="slide"
      transparent={true}
      visible={props.showConfirmTxnModal}
      onRequestClose={props.handleBack}
    >

      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain inModal
          backCallBack={props.handleBack}
          BackButtonText={merchantCard.confirm + " " + commonText.Swap}
        />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            marginTop: 20
          }}
        >

          <View
            style={[styles.coinInfoText, { marginTop: 5, backgroundColor: ThemeManager.colors.mnemonicsBg },]}
          >

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
              <View style={{ alignItems: 'center' }}>
                {props.from?.coin_data?.coin_image ? (
                  <Image style={styles.imgStyle1} source={{ uri: props.from?.coin_data?.coin_image }} />
                ) : (
                  <View style={styles.ViewStyle3}>
                    <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.settingsText, textAlign: 'center', marginLeft: 0 }]}>{props.from?.coin_data?.coin_symbol?.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={{ width: "38%", flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>

                <DottedLine />
                <Image style={{ marginLeft: -10, tintColor: ThemeManager.colors.blackWhiteText }} source={Images.forwardIcon} />
              </View>
              <View style={{ alignItems: 'center' }}>
                {props.to?.coin_data?.coin_image ? (
                  <Image style={styles.imgStyle1} source={{ uri: props.to?.coin_data?.coin_image }} />
                ) : (
                  <View style={styles.ViewStyle3}>
                    <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.settingsText, textAlign: 'center', marginLeft: 0 }]}>{props.to?.coin_data?.coin_symbol?.substring(0, 1)}</Text>
                  </View>
                )}

              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.blackWhiteText, fontFamily: Fonts.dmRegular }]}>From</Text>

              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.blackWhiteText, fontFamily: Fonts.dmRegular }]}>To</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.blackWhiteText }]}>{`${props?.sendAmount} ${props.from?.coin_data?.coin_symbol?.toUpperCase()}`}</Text>

              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text allowFontScaling={false} style={[styles.coinInfoUSDValue, { color: ThemeManager.colors.blackWhiteText }]}>{`${toFixedExp(props?.getAmount, 7)} ${props.to?.coin_data?.coin_symbol?.toUpperCase()}`}</Text>
              </View>
            </View>

          </View>

          <View
            style={[styles.coinInfoText, { marginTop: 15, backgroundColor: ThemeManager.colors.mnemonicsBg }]}>

            <View
              style={[
                styles.ViewStyle,]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.blackWhiteText, width: "25%" },
                ]}
              >
                {commonText.from}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  {
                    color: ThemeManager.colors.lightGreyText,
                    width: "74%",
                    textAlign: "right",
                  },
                ]}
              >
                {`${maskAddress(props.swapData?.refundAddress)}`}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: ThemeManager.colors.grayGreyBorder, marginVertical: 5 }} />
            <View
              style={[
                styles.ViewStyle,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {commonText.to}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.lightGreyText },
                ]}
              >{`${maskAddress(props.swapData?.destinationAddr)}`}</Text>
            </View>
          </View>

          <View
            style={[styles.coinInfoText,]}>
            <View
              style={[
                styles.ViewStyle,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.textStyle,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}
                >
                  Type
                </Text>

              </View>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.lightGreyText },
                ]}
              >
                {commonText.CrossChainSwap}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: ThemeManager.colors.grayGreyBorder, marginVertical: 5 }} />

            <View
              style={[
                styles.ViewStyle,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.textStyle,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}
                >
                  {commonText.networkFee}
                </Text>

              </View>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.lightGreyText },
                ]}
              >{`${props.totalFee}${getCoinSymbol(props.itemWallet?.coin_data)} (${Singleton.getInstance().CurrencySymbol
                }${props.nativePrice})`}</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            paddingTop: 20,
            marginBottom: 40
          }}
        >
          <Button onPress={props.onPress} buttontext={commonText.ConfirmSwap} />
        </View>

        <LoaderView isLoading={props.isLoading} />

        <AppAlert
          visible={props.AlertDialogNew}
          alertTxt={props.alertTxt}
          hideAlertDialog={props.hideAlertDialog}
        />
      </BackgroundImage>

    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  coinInfoText: {
    paddingVertical: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  coinInfoUSDValue: {
    flexWrap: "wrap",
    fontFamily: Fonts.dmSemiBold,
    fontSize: getDimensionPercentage(16),
    lineHeight: getDimensionPercentage(20),
  },
  ViewStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  textStyle: {
    fontSize: getDimensionPercentage(14),
    lineHeight: getDimensionPercentage(24),
    fontFamily: Fonts.dmMedium,
  },
  ViewStyle3: {
    resizeMode: 'contain',
    height: 36,
    width: 36,
    borderRadius: 12,
    justifyContent: 'center',
  },
  imgStyle1: {
    resizeMode: 'contain',
    height: 36,
    width: 36,
    borderRadius: 12,

  },
});
