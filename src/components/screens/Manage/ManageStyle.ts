import { StyleSheet } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme/';
import fonts from '../../../theme/Fonts';
import { getDimensionPercentage as dimen, heightDimen, widthDimen } from '../../../Utils';

export default StyleSheet.create({
  titleTextStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    paddingRight: 5,
  },
  viewStyle22: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,

  },
  precentText: {
    fontFamily: Fonts.dmRegular,
  },
  titleTextStyleNew: {
    fontFamily: Fonts.dmRegular,
    fontSize: 12,
    paddingRight: 5,
  },
  ViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginLeft: dimen(15),
    marginRight: dimen(10),

    paddingRight: 5,
    justifyContent: 'center',
  },
  ViewStyle1: {
    flexDirection: 'column',
    marginLeft: 13,
  },
  ViewStyle2: {
    height: 33,
    alignSelf: 'center',
    width: 33,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ViewStyle3: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '65%',
    paddingVertical: 8,
  },
  txtCoin: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
  },
  txtValue: {
    fontFamily: Fonts.dmRegular,
    fontSize: 12,
    color: ThemeManager.colors.lightText,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  container2: {
    flex: 1,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  container3: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noAsset: {
    fontSize: 15,
    fontFamily: fonts.dmMedium,
    color: ThemeManager.colors.whiteText,
  },
  update: {
  },
  imgCoin: {
    height: heightDimen(40),
    width: widthDimen(40),
    borderRadius: 20,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
});
