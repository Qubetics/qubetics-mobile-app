import { StyleSheet } from "react-native";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  mainView_2: {
    flex: 1,
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(30)
  },
  connectedText:{
    fontSize: dimen(26),
  },
  container: {
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightDimen(10),
  },
  title: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  viewAll: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  bottomView:{
    flex:1,
    justifyContent:'flex-end',
    paddingBottom: heightDimen(40)
  },
});
