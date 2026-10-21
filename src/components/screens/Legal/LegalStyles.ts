
import { StyleSheet } from 'react-native';
import { getDimensionPercentage as dimen, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';

export default StyleSheet.create({
  mainView: {
    flex: 1,
    paddingHorizontal: dimen(24),
    marginTop: heightDimen(30)

  },
  subView: {
    flex: 1,

  },
  termsText: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(14),
    lineHeight: dimen(24)
  },
  termsTextBold: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(14),
    lineHeight: dimen(24)
  },
  termsView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,

  },
  privacyView: {
    borderRadius: dimen(12),
    width: '100%',
    borderColor: ThemeManager.colors.carBorder,
    overflow: 'hidden',
    marginTop: heightDimen(16),
    justifyContent: 'center'
  },
  cardText: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
    marginLeft: widthDimen(10),
    lineHeight: dimen(20.8)
  },
  subContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingLeft: widthDimen(22),
    paddingRight: widthDimen(17),
    alignItems: 'center',
  },
  checkImg: {
    width: dimen(16), height: dimen(16), marginRight: widthDimen(10)
  },
  cardView: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },

});