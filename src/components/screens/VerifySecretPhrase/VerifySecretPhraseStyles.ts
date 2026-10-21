
import { StyleSheet } from 'react-native';
import { getDimensionPercentage as dimen, hasNotchWithIOS, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';

export default StyleSheet.create({

  txtButtonContainer: {
    marginBottom: hasNotchWithIOS() ? dimen(50) : dimen(20),
    flex: 1,
    justifyContent: 'flex-end',
    marginHorizontal: dimen(20)

  },
  mnemonicInput: {
    borderRadius: 12,
    paddingHorizontal: dimen(10.5),
    paddingVertical: dimen(7),
    flexDirection: 'column', // Changed from 'row'
    marginTop: dimen(30),
    borderColor: ThemeManager.colors.primaryColor,
    borderWidth: 1,
    minHeight: dimen(250)
  },
  mnemonicsViewStyle:{
    flexDirection: "row",
    overflow: "scroll",
    flexWrap: "wrap",
    height: "100%",
    width: "100%",
  },
  mnemonicsStyle: {
    flexWrap: 'wrap',
    flexDirection: "row",
    justifyContent: 'space-between',
    marginTop: dimen(24),
  },
  mnemonic_style: {
    borderRadius: dimen(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: heightDimen(10),
    paddingVertical: heightDimen(8),
    paddingHorizontal: widthDimen(5),
    width: "31%"
  },
  jumleText: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(16),
    lineHeight: dimen(27.52),

  },

});
