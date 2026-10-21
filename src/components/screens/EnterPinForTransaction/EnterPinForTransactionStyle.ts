import { StyleSheet, Platform } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import DeviceInfo from 'react-native-device-info';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  touchStyle: {
    width: 25,
    height: 22,

  },
  wrap: {
    height: '100%',
    display: 'flex',
    paddingHorizontal: 23,
    marginTop:
      Platform.OS == 'ios'
        ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
          ? getDimensionPercentage(60)
          : getDimensionPercentage(0)

        : getDimensionPercentage(0),

  },
  // BUG PRESERVED: getDeviceName() returns a Promise and the right side of || is a truthy string, so this is always 50 when no notch
  subHeaderStyle: {
    paddingTop: DeviceInfo.hasNotch() ? 45 : (DeviceInfo.getDeviceName() as any) == 'OPPO F19 Pro' || 'OnePlus NordCE 5G' ? 50 : 32,
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
