import { statusBarOffset } from '../../../Utils/StatusBarOffset';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';
import { getDimensionPercentage, hasNotchWithIOS } from '../../../Utils';
import DeviceInfo from 'react-native-device-info';

export default StyleSheet.create({
  TextStyle2: {
    fontSize: 12,
    fontFamily: Fonts.dmRegular,
  },
  feeView: {
    paddingVertical: 7,
    width: Dimensions.get('screen').width / 4.2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  touchableStyle: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 40,
    width: 40,
    alignItems: 'flex-end',
  },
  ViewStyle1: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hasNotchWithIOS() ? 20 : 0,
  },
  ViewStyle2: {
    width: 100,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  ViewStyle3: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ViewStyle4: {
    width: 50,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ViewStyle5: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  textStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: 15,
    color: '#6DAAFF',
  },
  modalView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalinner: {
    backgroundColor: ThemeManager.colors.whiteText,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.84,
    elevation: 2,
    width: '85%',
  },
  vwSignTransaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',

  },
  titleSign: {
    fontFamily: Fonts.dmMedium,
    fontSize: 17,
  },
  textLbl: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
  },
  txtValue: {
    width: '86%',
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    top: -10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 1,
  },
  searchBtn: {
    width: '12%',
    justifyContent: 'center',
  },
  dapHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: "space-between",
    marginTop:
      Platform.OS == 'ios'
        ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
          ? getDimensionPercentage(60)
          : getDimensionPercentage(0)

        : getDimensionPercentage(0),
    height:
      Platform.OS == 'ios'
        ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
          ? getDimensionPercentage(90)
          : getDimensionPercentage(130)

        : statusBarOffset + getDimensionPercentage(90),
  },
  dapBackView: {
    padding: 8,
    justifyContent: 'center',
    width: '8%',
  },
  searchMainView: {
    width: '63%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInnerView: {
    height: 50,
    width: '95%',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
  },
  searchText: {
    paddingLeft: 10,
    fontFamily: Fonts.dmRegular,
    marginRight: 8,
  },
});
