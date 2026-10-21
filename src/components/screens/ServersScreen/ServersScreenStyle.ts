import { StyleSheet } from "react-native";
import { dimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  activeText: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmSemiBold
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inactiveText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular
  },

});
