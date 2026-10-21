import { StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Colors, Fonts } from '../../../theme';
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  touchableStyle2: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  touchableStyle: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 5
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Fonts.dmBold,
    color: ThemeManager.colors.whiteText,
    marginBottom: 15
  },
  touchableStyle1: {
    height: 35,
    width: 35,
    alignSelf: 'flex-end',
    marginBottom: 15
  },
  wallet_itemText: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    color: Colors.textColor,
    textAlign: 'center',
    alignSelf: 'center',
  },
  wallet_item: {
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 8,
    paddingHorizontal: 15,
    borderBottomColor: ThemeManager.colors.underLineColor,
  },
  imgStyle: {
    height: 32,
    width: 32,
    borderRadius: 32,
    resizeMode: 'contain',
    marginRight: 9,
    alignSelf: 'center'
  },
  ViewStyle: {
    paddingVertical: 15,
    width: '90%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ViewStyle1: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  wrap: {
    flex: 1,
    paddingHorizontal: widthDimen(20),
    marginTop: heightDimen(30),
  },
  pin_wrap: {
    alignItems: 'center',
    flex: 0.56,
    justifyContent: 'flex-end',
  },
  pinBlockStyle: {
    height: getDimensionPercentage(50),
    width: getDimensionPercentage(50),

    marginBottom: heightDimen(30),
    marginHorizontal: widthDimen(40),
    justifyContent: 'center',
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',// 'flex-end',
    width: '100%',
    alignItems: 'center',// 'flex-end',
    backgroundColor: '#00000077',
  },
  modalView: {
    minHeight: 350,
    backgroundColor: Colors.White,
    borderRadius: 10,
    width: '90%',
    elevation: 4,
    justifyContent: 'center'
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
});
