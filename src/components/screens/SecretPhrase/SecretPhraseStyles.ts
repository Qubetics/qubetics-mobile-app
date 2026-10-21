import { StyleSheet } from 'react-native';
import {
  getDimensionPercentage as dimen,
  hasNotchWithIOS,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme';

export default StyleSheet.create({
  styleMargin: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',

  },

  subView: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    marginTop: heightDimen(10)
  },
  subViewTwo: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    marginTop: heightDimen(10)
  },
  txtStyleOne: {
    fontSize: dimen(14),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmRegular,
    marginLeft: widthDimen(10),
    flex: 1,

  },
  txtStyleTwo: {
    fontSize: dimen(14),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmRegular,
    marginLeft: widthDimen(10),
    flex: 1,
  },

  mainBtnView: {
    marginBottom: hasNotchWithIOS() ? heightDimen(50) : heightDimen(20),
    marginTop: heightDimen(20),
  },
  btnViewModal: {
    marginBottom: dimen(40),
    marginTop: dimen(32),
    width: '95%',

  },
  txtButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: dimen(24)
  },

  mnemonicsStyle: {
    width: '100%',
    flexWrap: 'wrap',
    flexDirection: "row",
    justifyContent: 'space-between',
    marginTop: dimen(18.34),
 
  },
  mnemonic: {
    borderRadius: dimen(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: heightDimen(10),
    paddingVertical: heightDimen(8),
    paddingHorizontal: widthDimen(5),
    width: "31%"
  },
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(16),
    lineHeight: dimen(27.17)
  },
  copyMainView: {
    marginTop: dimen(30),
    minHeight: 170,
  },
  copyView: {
    flexDirection: 'row',
    borderRadius: dimen(14),
    alignSelf:'flex-start'
  },
  headingStyle: {
    fontSize: dimen(18),
    lineHeight: dimen(22),
    paddingHorizontal: dimen(50),
    fontFamily: Fonts.dmBold,
    textAlign: 'center',
    marginTop: dimen(12),
  },
  paraView: {
    alignSelf: 'flex-start',
  },
  imagetextContainer: {
    flexDirection: 'row',
    marginTop: dimen(32),
  },
  imagetextContainerTwo: {
    flexDirection: 'row',
    marginTop: dimen(16),
  },
  txt2: {
    fontSize: dimen(14),
    lineHeight: dimen(22),
    color: (ThemeManager as any).black, // BUG PRESERVED: ThemeManager.black does not exist
    fontFamily: Fonts.dmMedium,
    marginLeft: dimen(8),
  },

  lastPara: {
    fontSize: dimen(14),
    lineHeight: dimen(22),
    color: (ThemeManager as any).mainColor, // BUG PRESERVED: ThemeManager.mainColor does not exist
    fontFamily: Fonts.dmMedium,
    marginLeft: dimen(8),
  },
  lineStyle: {
    borderBottomWidth: 1,
    borderColor: ThemeManager.colors.dividerColor,
    marginHorizontal: dimen(4),
    marginTop: dimen(15),

  },
  logo: {
    height: dimen(105),
    width: dimen(101),
    resizeMode: 'contain',
    marginTop: dimen(24),
  },
  dotStyle: {
    height: dimen(6),
    width: dimen(6),
    resizeMode: 'contain',
    marginTop: 5,
  },
  dotStyleTwo: {
    height: dimen(6),
    width: dimen(6),
    resizeMode: 'contain',
    marginTop: 5,
  },
  alertIconStyle: {
    height: dimen(15),
    width: dimen(17),
    resizeMode: 'contain',
    marginTop: dimen(5),
  },
  mainStyle: {
    alignItems: 'center',
  },
  copyIconStyle: {
    resizeMode: 'contain',
  },
  checkImg: {
    width: dimen(17), height: dimen(17), marginRight: widthDimen(8)
  },
});
