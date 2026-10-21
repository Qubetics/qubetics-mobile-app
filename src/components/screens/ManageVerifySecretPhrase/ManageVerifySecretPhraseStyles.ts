
import { StyleSheet } from 'react-native';
import { getDimensionPercentage as dimen, hasNotchWithIOS, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';

export default StyleSheet.create({
  mainViewStyle: {
    marginHorizontal: dimen(21)

  },

  txtButtonContainer: {
    marginBottom: hasNotchWithIOS() ? dimen(50) : dimen(20),
    flex: 1,
    justifyContent: 'flex-end',
    marginHorizontal: dimen(24)

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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: dimen(24),
    justifyContent: 'space-between',
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
    fontSize: dimen(14),
    lineHeight: dimen(21.17),

  },

});
