import { StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Colors, Fonts } from '../../../theme/';

export default StyleSheet.create({
  tab_wrapstyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  tabsWrap: {
    backgroundColor: Colors.tabsWrapBg,
    height: 55,
    borderRadius: 14,
    paddingHorizontal: 3,
    width: '93%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab_inActiveStyle: {
    width: '50%',
    justifyContent: 'center',
    height: "100%",
  },
  tab_inActiveStyleLeft: {
    justifyContent: 'center',
    height: "100%",
    lex: 1, // BUG PRESERVED: "lex" is not a style key (typo for flex), cast to any below borderTopLeftRadius: 14, borderBottomLeftRadius: 14
  },
  tab_inActiveStyleRight: {
    justifyContent: 'center',
    height: "100%",
    borderTopRightRadius: 14, borderBottomRightRadius: 14
  },
  tab_isActiveTextStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 16,
    color: ThemeManager.colors.whiteText,
    paddingHorizontal: 15,
    textAlign: 'center',

  },

  // *********

  //************************ ON CHIAN Style ************************
  // DAP confirmation modal

} as any);