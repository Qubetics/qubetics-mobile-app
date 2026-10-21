import { statusBarOffset } from '../../../Utils/StatusBarOffset';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';
import { dimen, getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import DeviceInfo from 'react-native-device-info';

const styles = StyleSheet.create({
  tab_wrapstyle: {
    justifyContent: 'center',
    marginTop: 45,
    alignSelf: 'center',
  },
  tabsWrap: {
    height: 55,
    borderRadius: 10,
    paddingHorizontal: 22,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab_isActiveStyle: {
    backgroundColor: Colors.White,
    height: 50,
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab_isActiveTextStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 18,
    color: ThemeManager.colors.whiteText,
    paddingHorizontal: 15,
    textAlign: 'center',
  },
  tab_inActiveStyle: {
    width: '50%',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderColor: "rgba(128, 128, 128, 0.1)",
    height: 50
  },
  ViewStyle2: {

    paddingHorizontal: getDimensionPercentage(25),

    width: '100%',
    marginTop: statusBarOffset,
  },
  ViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getDimensionPercentage(20),
    justifyContent: "space-between"
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
  }
});

export default styles;
