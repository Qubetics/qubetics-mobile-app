import { statusBarOffset } from '../../../Utils/StatusBarOffset';
import { Dimensions, StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme/';
import { dimen, getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
export default StyleSheet.create({
  emptyView1: {
    alignSelf: 'center',
    marginTop: Dimensions.get('screen').height / 5,
  },
  ViewStyle2: {

    paddingHorizontal: getDimensionPercentage(25),

    width: '100%',
    marginTop: statusBarOffset,
  },
  touchableStyle: {
    borderRadius: 5,
    width: 33,
    height: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getDimensionPercentage(20),
    justifyContent: "space-between"
  },
  imgNoti: {
  },
  viewAssets: {
    paddingHorizontal: 24,
  },
  txtNoAssets: {
    fontSize: 15,
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.whiteText,
    alignSelf: 'center',
  },
  walletNameIcon: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(25.46),
    fontWeight: '700',
  },
  walletName: {
    textTransform: "capitalize",
    marginLeft: widthDimen(6),
    fontSize: getDimensionPercentage(20),
    fontFamily: Fonts.dmSemiBold,
    lineHeight: getDimensionPercentage(20),
    maxWidth: widthDimen(230),
    marginTop: heightDimen(5),
  },

});
