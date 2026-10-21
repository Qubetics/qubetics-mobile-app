import { StyleSheet, Dimensions } from 'react-native';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';
import { moderateScale } from '../../../layouts/responsive';
import { widthDimen } from '../../../Utils';
export default StyleSheet.create({
  sendBtnStyle: {
    marginTop: 20,
    marginBottom: 25,
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
  },
  sendBtnTextStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
    textAlign: 'center',
  },
  ViewStyle8: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  TextStyle1: {
    marginBottom: 7,
    fontSize: 16,
    fontFamily: Fonts.dmBold,
  },
  ViewStyle6: {
    width: '100%',
    justifyContent: 'space-between',
    borderColor: 'grey',
    borderWidth: 0,
    marginTop: 20,
  },
  TextStyle: {
    marginTop: 3,
    fontFamily: Fonts.dmMedium,
    fontSize: 14,
    textAlign: 'right',
    width: '45%',
  },
  ViewStyle5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    width: '100%',
  },
  fiatStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 14,
    marginLeft: widthDimen(4),
  },
  cameraStyle: {
    height: Dimensions.get('window').height / 2,
    width: '80%',
    alignSelf: 'center',
  },
  maxText: {
    fontSize: 16,
    fontFamily: Fonts.dmSemiBold,

  },
  ViewStyle4: {
    borderColor: 'transparent',
    borderWidth: 0,
    fontSize: 16,
    width: '70%',
    paddingLeft: 15,
    alignSelf: "center",

  },
  maxStyle: {
    height: 52,
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ViewStyle: {
    justifyContent: 'center',
    height: 55,
    borderRadius: moderateScale(14),
    padding: 4,
    borderWidth: 1,
    backgroundColor: ThemeManager.colors.inputBorder
  },
  ViewStyle1: {
    alignSelf: 'center',
    width: '72%',
  },
  ViewStyle2: {
    marginTop: -20,
    height: 56,
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
  },
  ViewStyle3: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scan: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  modalView: {
    borderRadius: 12,
    paddingBottom: 0,
  },
  txtWallet: {
    fontFamily: Fonts.dmRegular,
    fontSize: moderateScale(14),
    color: ThemeManager.colors.whiteText,
    marginBottom: 10,
  },
  mainView: {
    paddingHorizontal: 23,
    minHeight: 10,
    marginTop: 20,
  },
  txtCancel: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 15,
    marginTop: 20,
    marginRight: 25,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

});
