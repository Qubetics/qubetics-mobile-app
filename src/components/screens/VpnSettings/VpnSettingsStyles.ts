import { StyleSheet } from "react-native";
import {
  getDimensionPercentage as dimen,
} from "../../../Utils";
import fonts from "../../../theme/Fonts";

export default StyleSheet.create({
  mainView:{
    flex: 1,
  },
  sectionHeaderText:{
    fontSize: dimen(18),
    fontFamily: fonts.dmRegular,
    marginTop:dimen(20),
    marginBottom: dimen(10),
  }

})