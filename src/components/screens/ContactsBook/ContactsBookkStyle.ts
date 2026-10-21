import { StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import { verticalScale } from '../../../layouts/responsive';
import { getDimensionPercentage } from '../../../Utils';

export default StyleSheet.create({
  emptyView: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(80)
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: getDimensionPercentage(16),
    lineHeight: getDimensionPercentage(24),
  }
});
