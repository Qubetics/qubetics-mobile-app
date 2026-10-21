import { Dimensions, StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import { getDimensionPercentage as dimen, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  ViewStyle2: {
    bottom: heightDimen(210),
    position: 'absolute',
    alignSelf: 'center',
  },
  titleTextStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    paddingRight: 5,
  },
  emptyView1: {
    alignSelf: 'center',
    alignItems: "center",
    marginTop: Dimensions.get('screen').height / 3,
  },
  customStyle: {
    alignSelf: 'center',
    bottom: 50,
  },
  ImgStyle2: {
    height: heightDimen(40),
    width: widthDimen(40),
    borderRadius: 20,
    resizeMode: 'contain',
  },
  binStyle: {
    alignItems: 'flex-end',
    paddingLeft: dimen(10),
    paddingRight: dimen(20),
  },
  ViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: dimen(15),
    borderRadius: 14,
    overflow: 'hidden',
    height: dimen(76),
  },
  ViewStyle1: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmSemiBold,
    lineHeight: dimen(23)
  },
  textStyle1: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
    lineHeight: dimen(18)
  },
  coinSymbolStyle: {
    paddingLeft: 5,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: Fonts.dmMedium,
    top: 0,
  },
  ImgStyle: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginLeft: widthDimen(15),
    marginRight: dimen(10),
    height: heightDimen(40),
    width: widthDimen(40),
    borderRadius: 20,
  },
  viewStyle2: {
    flexDirection: "row",
    paddingLeft: 3,
  },
  titleTextStyleNew: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(14),
  },
});
