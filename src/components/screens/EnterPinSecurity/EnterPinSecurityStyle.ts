import { StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  pin_wrap: {
    alignItems: 'center',
    flex: 0.6,
    justifyContent: 'flex-end',
  },
  listStyle: {
    alignItems: 'center',
    height: getDimensionPercentage(50),
    width: getDimensionPercentage(50),
    justifyContent: 'center',
    marginBottom: heightDimen(30),
    marginHorizontal: widthDimen(40)
  },

  pinBlockStyle: {
    height: getDimensionPercentage(50),
    width: getDimensionPercentage(50),

    marginBottom: heightDimen(30),
    marginHorizontal: widthDimen(40),
    justifyContent: 'center',
    alignItems: 'center'

  },
  pinBlockTextStyle: {
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.headersTextColor,
    fontSize: getDimensionPercentage(30),
    textAlign: 'center',
    lineHeight: getDimensionPercentage(39)
  },
});
