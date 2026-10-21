import { Platform, StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import {
  getDimensionPercentage as dimen,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import fonts from '../../../theme/Fonts';
import { horizontalScale, moderateScale, verticalScale } from '../../../layouts/responsive';
import DeviceInfo from 'react-native-device-info';

export default StyleSheet.create({
  ImgStyle1: {
    resizeMode: 'contain',
    height: dimen(48),
    width: dimen(48),
    borderRadius: dimen(14),
    marginTop: 10
  },
  aprroxEqualIconStyle: {
    resizeMode: 'contain',
    height: dimen(8),
    width: dimen(8),
    marginRight: dimen(6),
    alignSelf: 'center',
  },
  coinStyle: {
    fontSize: dimen(14),
    fontFamily: fonts.dmSemiBold,
    color: ThemeManager.colors.whiteText,
    marginTop: Platform.OS == 'ios'
      ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
        ? getDimensionPercentage(0)
        : getDimensionPercentage(2)

      : getDimensionPercentage(0),

  },
  ImgStyle: {
    borderRadius: 14,
    backgroundColor: 'white',
    resizeMode: 'contain',
    height: heightDimen(48),
    width: widthDimen(48),
    alignSelf: 'center',
    justifyContent: 'center',
  },
  coinSymbolStyle: {
    paddingLeft: 5,
    textAlign: 'center',
    fontSize: dimen(25),
    fontFamily: Fonts.dmMedium,
    alignItems: 'center',
  },
  ViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 22,
    width: '100%',
  },
  sendReceiveBtnWrap: {
    alignItems: 'center',
  },
  coinInfoTextt: {
    flex: 1,
  },
  gradient: {
    marginHorizontal: dimen(24),
    borderRadius: dimen(14),
    paddingTop: dimen(17),
    paddingBottom: dimen(25),
    alignItems: 'center',
    marginBottom: dimen(25),
    marginTop: dimen(25),
    height: verticalScale(190),
    overflow: 'hidden',
  },
  coinInfoValue: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(28),
    lineHeight: dimen(35),
    letterSpacing: 0.21,
    color: ThemeManager.colors.whiteText,
    marginTop: dimen(10),
    textAlign: 'center',
  },
  coinInfoUSDValue: {
    fontFamily: fonts.dmBold,
    fontSize: dimen(16),
    lineHeight: dimen(20),
    color: ThemeManager.colors.whiteText,
  },

  addressWrap: {
    minHeight: 76,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  addressItem: {
    paddingLeft: 15,
    flex: 0.95,
  },
  addressItemText: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(16),
    color: ThemeManager.colors.whiteText,
    lineHeight: dimen(23)
  },
  addressButtons: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  addButtons: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionHistoryTitle: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(18),
    color: ThemeManager.colors.whiteText,
  },

  sendReceiveSwapview: {
    marginTop: - dimen(Platform.OS == "android" ? 45 : 55),
    marginHorizontal: horizontalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewStyle2: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3,
    marginBottom: Platform.OS == 'ios'
      ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
        ? getDimensionPercentage(0)
        : getDimensionPercentage(0)

      : getDimensionPercentage(0),
  },
  titleTextStyleNew: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(14),
    paddingRight: dimen(5),
    alignSelf: "center"

  },
  // @ts-ignore BUG PRESERVED: duplicate sendReceiveBtnWrap key (later one wins)
  sendReceiveBtnWrap: {
    borderWidth: 1,
    borderRadius: dimen(10),
    marginHorizontal: dimen(10)
  },
});
