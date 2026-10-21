import { StyleSheet } from "react-native";
import { dimen, widthDimen } from "../../../Utils";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  toggleIcon: {
    width: dimen(36),
    height: dimen(22),
    resizeMode:'contain',
  },
  listContainer:{
  marginHorizontal: widthDimen(24),
  },
});
