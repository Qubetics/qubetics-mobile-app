import { StyleSheet, Platform } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import DeviceInfo from 'react-native-device-info';

export default StyleSheet.create({
  wrap: {
    flex: 1,
    marginTop:
      Platform.OS == 'ios'
        ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
          ? getDimensionPercentage(60)
          : getDimensionPercentage(0)

        : getDimensionPercentage(0),

  },
  subHeaderStyle: {
    flex:0.1,
    marginTop: Platform.OS == 'ios'
      ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
        ? getDimensionPercentage(70)
        : getDimensionPercentage(60)
      : getDimensionPercentage(80),
  },
  pin_wrap: {
    alignItems: 'center',
    flex: 0.4,
    justifyContent: 'flex-end'

  },
  pinBlockStyle: {
    height: getDimensionPercentage(50),
    width: getDimensionPercentage(50),
    justifyContent: 'center',
    marginBottom: heightDimen(30),
    marginHorizontal: widthDimen(40),
    alignItems: 'center'
  },
  listStyle: {
    alignItems: 'center',
    height: getDimensionPercentage(50),
    width: getDimensionPercentage(50),
    justifyContent: 'center',
    marginBottom: heightDimen(30),
    marginHorizontal: widthDimen(40)
  },
  pinBlockTextStyle: {
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.headersTextColor,
    fontSize: getDimensionPercentage(30),
    textAlign: 'center',
    lineHeight: getDimensionPercentage(39)
  },
});
