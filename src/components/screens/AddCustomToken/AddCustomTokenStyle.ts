import { StyleSheet, Dimensions } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Colors, Fonts } from '../../../theme';
import { isIphoneX, getBottomSpace, getStatusBarHeight } from 'react-native-iphone-x-helper';
import { getDimensionPercentage, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  modalView: {},

  cancelText: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 15,
    marginTop: 20,
    marginRight: 25,
    alignSelf: 'flex-end',
    marginBottom: 20,
  }
  , 
  cameraStyle: {
    height: Dimensions.get('window').height / 2,
    width: '80%',
    alignSelf: 'center',
  },
  ViewStyle: {
    height: isIphoneX()
      ? Dimensions.get('window').height -
      200 -
      getBottomSpace() -
      getStatusBarHeight()
      : Dimensions.get('window').height - 200,
    paddingHorizontal: 23,
  },
  ViewStyle1: {
    marginTop: 8,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1
  },
  ViewStyle2: {
    position: 'relative',
    marginBottom: 15,
    marginTop: 10,
  },
  selectToken: {
    height: 52,
    borderRadius: 12,
    paddingLeft: widthDimen(12),
    paddingRight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinTextStyle: {
    fontSize: getDimensionPercentage(16),
    lineHeight: getDimensionPercentage(24),
    fontFamily: Fonts.dmMedium,
    color: Colors.themeColor,
    marginTop: 2,
  },
  placeHolderStyle: {
    fontSize: getDimensionPercentage(16),
    fontFamily: Fonts.dmRegular,

  },
  txtNetwork: {
    fontSize: 14,
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.lightWhiteText,
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.dmRegular,
    color: "rgba(247, 147, 26, 1)",
    paddingHorizontal: 10
  },
});
