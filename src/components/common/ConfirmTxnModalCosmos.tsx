import { Image, Modal, StyleSheet, Text, View } from "react-native";
import BackgroundImage from "./BackgroundImage";
import { LanguageManager } from '../../../LanguageManager';
import { ThemeManager } from '../../../ThemeManager';
import Singleton from '../../Singleton';
import { Fonts } from '../../theme';
import { getDimensionPercentage as dimen, heightDimen } from '../../Utils';
import { CommaSeprator, CommaSeprator1, consoleLogFunc, toFixedExp } from '../../Utils/MethodsUtils';
import { Button } from './Button';
import { HeaderMain } from './HeaderMain';


export const ConfirmTxnModalCosmos = (props: any) => {
  const [integerPart, decimalPart] = props?.newObj?.amount ? props?.newObj?.amount?.split('.') : [0, 0];
  consoleLogFunc(integerPart, 'integerPart');

  const { commonText } = LanguageManager;

  //******************************************************************************************/
  const maskAddress = (address: any) => {
    const a = address?.slice(0, 10);
    const b = address?.slice(-10);
    return a + '...' + b;
  };

  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="slide"
      transparent={true}
      visible={props.showConfirmTxnModal}
      onRequestClose={props.handleBack}>

      <BackgroundImage
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, }}
      >
      <View style={{ flex: 1,  }}>
        <View>
          <HeaderMain inModal
            backCallBack={props.handleBack}
            BackButtonText={commonText.Send + ' ' + 'cosmos'}
          />
          <View
            // BUG PRESERVED: View receives LinearGradient-only 'colors' prop (ignored)
            // @ts-expect-error
            colors={['#69DADB00', '#69DADB33']} style={[styles.coinInfoText]}

          >
            {props.selectedCoin.coin_image ? (
              <Image style={{ resizeMode: 'contain', height: 69, width: 69, borderRadius: 14, }}  source={{ uri: props.selectedCoin.coin_image }} />
            ) : (
              <View style={[styles.ImgStyle, { backgroundColor: ThemeManager.colors.Mainbg }]}>
                <Text allowFontScaling={false} style={[styles.coinSymbolStyle, { color: ThemeManager.colors.blackWhiteText, textTransform: 'capitalize', paddingLeft: 0 }]}>{props.selectedCoin.coin_symbol?.substring(0, 1)}</Text>
              </View>
            )}

            <Text allowFontScaling={false} style={[styles.coinInfoUSD, { color: ThemeManager.colors.legalGreyColor }]}>
              ≈{' '}
              {(props.from == 'Card' || props.from == 'referral') ? props.currency : Singleton.getInstance().CurrencySymbol}{' '}
              {props.from == 'Card' ? props.selectedCoin.fiat_price_data?.value ? props.newObj.valueInUSD < 0.000001 ? CommaSeprator1(props.newObj.valueInUSD, 8) : props.newObj.valueInUSD < 0.01 ? CommaSeprator1(props.newObj.valueInUSD, 4) : CommaSeprator1(props.newObj.valueInUSD, 2) : '0.00'
                : props.from == 'referral' ? props.selectedCoin.card_fiat_price_data?.value ? props.newObj.valueInUSD < 0.000001 ? CommaSeprator1(props.newObj.valueInUSD, 8) : props.newObj.valueInUSD < 0.01 ? CommaSeprator1(props.newObj.valueInUSD, 4) : CommaSeprator1(props.newObj.valueInUSD, 2) : '0.00'
                  : props.selectedCoin.currentPriceInMarket ? props.newObj.valueInUSD < 0.000001 ? CommaSeprator1(props.newObj.valueInUSD, 8) : props.newObj.valueInUSD < 0.01 ? CommaSeprator1(props.newObj.valueInUSD, 4) : CommaSeprator1(props.newObj.valueInUSD, 2) : '0.00'}{' '}
            </Text>
            <View style={{ flexDirection: "row", alignSelf: "center", marginTop: heightDimen(6) }}>
              <Text allowFontScaling={false} style={[styles.balAmount, { color: ThemeManager.colors.blackWhiteText }]}>{(CommaSeprator as any)(integerPart)}
                <Text allowFontScaling={false} style={[styles.bal, { color: ThemeManager.colors.blackWhiteText }]}>{!!decimalPart ? '.' : ''}{decimalPart} {props.selectedCoin.coin_symbol.toUpperCase()}</Text> </Text>
            </View>
          </View>
          <BackgroundImage source={ThemeManager.ImageIcons.homeSubBg} style={[styles.ViewStyle1,]}>
            <View style={[styles.ViewStyle,]}>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.legalGreyColor }]}>{commonText.Asset}</Text>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText,flex:0.8,textAlign:'right' }]}>{props.selectedCoin.coin_name+' cosmos'}({props.selectedCoin.coin_symbol?.toUpperCase()})</Text>
            </View>
            <View style={[styles.ViewStyle, {}]}>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.legalGreyColor }]}>{commonText.from}</Text>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{maskAddress(props.newObj.fromAddress)}</Text>
            </View>
            <View style={[styles.ViewStyle, {}]}>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.legalGreyColor }]}>{commonText.to}</Text>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{maskAddress(props.newObj.toAddress)}</Text>
            </View>
          </BackgroundImage>

          <BackgroundImage source={ThemeManager.ImageIcons.homeSubBg} style={[styles.ViewStyle1, { marginTop: heightDimen(11) }]}>

            <View style={[styles.ViewStyle, { borderBottomColor: ThemeManager.colors.underLineColor }]}>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.legalGreyColor }]}>{commonText.networkFee}</Text>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{toFixedExp(props.newObj.totalFee, 8)}{' '}{props.newObj.feeSymbol} ({Singleton.getInstance().CurrencySymbol}{props.newObj.fiatCoin})</Text>
            </View>

            <View style={[styles.ViewStyle, { borderBottomWidth: 0, borderBottomColor: ThemeManager.colors.underLineColor }]}>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.legalGreyColor }]}>{'Gas Used'}</Text>
              <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{props.newObj.gasUsed}</Text>
            </View>   
          </BackgroundImage>

        </View>

      </View>

      <View style={{ justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: heightDimen(50) }}>
        <Button onPress={props.onPress} buttontext={commonText.Confirm} />
      </View>
      </BackgroundImage>
    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  ImgStyle: {
    borderRadius: 14,
    backgroundColor: 'white',
    resizeMode: 'contain',
    height: 69,
    width: 69,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  coinSymbolStyle: {
    paddingLeft: 5,
    textAlign: 'center',
    fontSize: 25,
    fontFamily: Fonts.dmMedium,
    alignItems: 'center',
  },
  coinInfoText: {
    paddingTop: 25,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinInfoUSD: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    marginTop: dimen(15)
  },
  ViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  ViewStyle1: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingBottom: 2,
    marginHorizontal: 20,
    paddingTop: 5,
    overflow: 'hidden'
  },
  textStyle: {
    fontSize: dimen(15),
    lineHeight: dimen(23),
    fontFamily: Fonts.dmBold,
  },
  bal: {
    textAlign: 'center',
    fontSize: dimen(20),
    fontWeight: "300",
  },

  balAmount: {
    textAlign: 'center',
    fontSize: dimen(40),
    fontFamily: Fonts.dmBold,
  },
});
