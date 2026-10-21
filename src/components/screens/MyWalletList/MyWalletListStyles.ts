import { StyleSheet } from "react-native";
import {
  getDimensionPercentage as dimen,
  getDimensionPercentage,
} from "../../../Utils";
import { Fonts } from "../../../theme";
import { ThemeManager } from "../../../../ThemeManager";

export default StyleSheet.create({
  mainView: {
    flex: 1,
    paddingHorizontal: dimen(25),
  },
  subView: {
    flex: 1,
    marginTop: dimen(24),
  },
  totalBal: {
    fontFamily: Fonts.dmRegular,
    fontSize: 18,
  },
  mainStyle: {
  },
  mainStyleOne: {},
  textStyle: {
    fontSize: dimen(18),
    lineHeight: dimen(23),
    fontFamily: Fonts.dmBold,
    marginLeft: dimen(15),
  },
  imagetextContainer: {
    marginTop: dimen(43),
  },
  imagetextContainerNew: {
    marginTop: dimen(33),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  txt2: {
    fontSize: dimen(18),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmBold,
    marginRight: dimen(30),
  },
  txt3: {
    fontSize: dimen(14),
    lineHeight: dimen(21),
    fontFamily: Fonts.dmMedium,
    marginTop: dimen(17),
  },
  ViewStyle2: {
    borderRadius: 10,
  },
  txtDelete: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(16),
    lineHeight: dimen(21),
    color: ThemeManager.colors.whiteText,

  },
  dotStyle: {
    height: dimen(16),
    width: dimen(16),
    justifyContent: "center",
    marginTop: getDimensionPercentage(3),
    resizeMode: "contain",
    alignSelf: "center",
  },

  imagetextContainerOne: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: dimen(21),
  },
  imagetextContainerThree: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: dimen(16),
  },
  txt4: {
    fontSize: dimen(12),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmMedium,
    marginLeft: dimen(6),
  },

  btnViewModal: {
    flexDirection: "row",
    alignSelf: "center",
    paddingHorizontal: dimen(35),
    marginBottom: dimen(40),
    marginTop: dimen(36),
  },

  crossIconStyle: {
    height: dimen(20),
    width: dimen(20),
    resizeMode: "contain",
  },

  borderButtonStyle: {
    width: "99%",
    height: "96%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimen(14),

  },
  bal: {
    textAlign: 'center',
    fontSize: getDimensionPercentage(40),
    fontFamily: Fonts.dmSemiBold,

  },

  balAmount: {
    textAlign: 'center',
    fontSize: getDimensionPercentage(50),
    fontFamily: Fonts.dmBold,

  },
});
