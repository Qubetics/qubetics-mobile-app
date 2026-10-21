
import { StyleSheet } from 'react-native';
import { getDimensionPercentage as dimen, getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';

export default StyleSheet.create({
  mainView: {
    flex: 1,
    paddingHorizontal: dimen(25)

  },
  headerText: {
    marginTop: dimen(26),
    fontFamily: Fonts.dmBold,
    fontSize: dimen(28),
    textAlign: 'center',
    lineHeight: dimen(34),
    marginHorizontal: widthDimen(28),
  },
  boldText: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(16),
    lineHeight: getDimensionPercentage(24),
    textAlign: "center",
    marginTop: heightDimen(10)

  },
});