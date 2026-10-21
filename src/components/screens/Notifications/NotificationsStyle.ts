import { StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import { getDimensionPercentage as dimen } from '../../../Utils';

export default StyleSheet.create({
  imgStyle2: {
    height: 28,
    width: 28,
    resizeMode: 'contain'
  },
  ViewStyle3: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '88%',
  },
  ViewStyle1: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    overflow: 'hidden'
  },
  Title: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(16),
    color: ThemeManager.colors.whiteText,
    paddingLeft: 10,
    lineHeight: dimen(23)
  },
  Title_new: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(16),
    color: ThemeManager.colors.whiteText,
    paddingLeft: 10,
  },
  ViewStyle4: {
    borderRadius: 14,
    height: 40,
    width: 40,
    justifyContent: 'center',

  },
  date: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(14),
    paddingLeft: 10,
  },
  viewMain: {
    flex: 1,
    justifyContent: 'center',
  },
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
});
