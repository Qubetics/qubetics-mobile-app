import { Dimensions, StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';

import {
  getDimensionPercentage as dimen,
  getDimensionPercentage,
  widthDimen,
} from "../../../Utils";

export default StyleSheet.create({
  imgViewStyle: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    height: dimen(44),
    width: dimen(44),
    borderRadius: 22,
  },
  textStyle2: {
    textAlign: 'center',
    fontSize: dimen(18),
    lineHeight: dimen(23),
    fontFamily: Fonts.dmRegular,
  },
  textStyle1: {
    fontSize: 18,
    fontFamily: Fonts.dmSemiBold,
  },
  ViewStyle: {
    width: '60%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ViewStyle2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: widthDimen(10),
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: getDimensionPercentage(22),
  },
  textStyle: {
    fontSize: 14,
    fontFamily: Fonts.dmRegular,
  },
  ViewNew: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: Dimensions.get('screen').height / 3.8,
  },
  balAmount: {
    textAlign: 'center',
    fontSize: getDimensionPercentage(50),
    fontFamily: Fonts.dmBold,
  },
  bal: {
    textAlign: 'center',
    fontSize: getDimensionPercentage(40),
    fontFamily: Fonts.dmSemiBold,

  },
});
