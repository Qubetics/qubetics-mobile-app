import { Dimensions, StyleSheet } from 'react-native';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';
import { getDimensionPercentage } from '../../../Utils';

export default StyleSheet.create({
  btnView: {
    marginTop: getDimensionPercentage(10),
    marginBottom: getDimensionPercentage(30),
  },
  textStyle: {
    textAlign: 'right',
    marginRight: 8,
    fontSize: 14,
    fontFamily: Fonts.dmRegular,
  },
  imgstyle: {
    alignSelf: 'center',
    resizeMode: 'contain',

  },
  ViewStyle1: {
    paddingVertical: 15,
    paddingHorizontal: 5,

  },
  ViewStyle: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,

  },
  tabsView: {
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  sliderView: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',

  },
  tabsViewTwo: {
    
        justifyContent: "center",
    width: Dimensions.get("screen").width / 5.8,
    height: 40,
    borderRadius: 14,
    alignItems: "center",

  },

  //////////////****************////////////
  // Approve Modal Style
  //Modal Style
  main_container: {
    width: "100%",
  },

  //////////////****************////////////
  // **Preview Modal style**//

  slippageText: {
    fontSize: 14,
    color: ThemeManager.colors.subTextColor,
    fontFamily: Fonts.dmRegular,

  },
  cancelView: {
    justifyContent: 'space-between',
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: ThemeManager.colors.addressBookDropBorederColor
  },
  slippageTabView: { marginTop: 20, },

});
