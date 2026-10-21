import { StyleSheet } from "react-native";
import { ThemeManager } from "../../../../ThemeManager";
import { Colors, Fonts } from "../../../theme";
import {
  dimen,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from "../../../Utils";
import { moderateScale } from "../../../layouts/responsive";

export default StyleSheet.create({
  qrBlock: {
    alignItems: "center",
    marginBottom: 25,
    marginTop: heightDimen(15),
    padding: 20,

  },
  qrAddress: {
    marginHorizontal: widthDimen(20),
    paddingHorizontal: widthDimen(20),
    paddingVertical: widthDimen(10),
    borderWidth: getDimensionPercentage(1),
    borderRadius: getDimensionPercentage(12),
    flexDirection: "row",
    alignItems: "center",
  },
  qrAddressTextStyle: {
    fontFamily: Fonts.dmBold,
    fontSize: moderateScale(16),
    color: Colors.textColor,
    textAlign: "center",
    marginTop: 3
  },
  warningText: {
    fontFamily: Fonts.dmRegular,
    fontSize: 16,
    color: ThemeManager.colors.text_color,
    lineHeight: heightDimen(24),
    textAlign: "center",
  },
  textContainer: {
    flexDirection: "row",
    margin: heightDimen(20),
    marginTop: heightDimen(30),
    paddingBottom: getDimensionPercentage(20),
    borderRadius: getDimensionPercentage(12),
    fontFamily: Fonts.dmSemiBold
  },
  copyButtonNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: getDimensionPercentage(10),
  },
  copyButtonText: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(14),
    lineHeight: dimen(18),
    textAlign: "center",
    marginRight: widthDimen(3),
  },
  qrAddressExpand: {
    marginHorizontal: widthDimen(20),
    paddingHorizontal: widthDimen(20),
    paddingVertical: widthDimen(10),
    borderWidth: getDimensionPercentage(1),
    borderRadius: getDimensionPercentage(12),
    marginTop: 5
  },
});
