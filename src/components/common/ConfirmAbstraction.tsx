import { BlurView } from "@react-native-community/blur";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { dimen, heightDimen } from "../../Utils";
import { Button } from "./Button";
import { LoaderView } from "./LoaderView";
import { toFixedExp } from "../../Utils/MethodsUtils";

const ConfirmAbstraction = ({
  fromToken,
  toToken,
  onConfirm,
  visible,
  onClose,
  fromAmt,
  toAmt,
  isLoading,
  platFormFee,
  fiatValTics,
  chainAbstractionFee,
}: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <TouchableOpacity
        style={styles.overlay}
        // BUG PRESERVED: stray boolean prop (typo) passed to TouchableOpacity
        // @ts-expect-error
        TouchableOpacityTouchableOpacityTouchableOpacity
        activeOpacity={1}
      >
        <View
          style={{
            ...styles.container,
            backgroundColor: ThemeManager.colors.mnemonicsBg,
          }}
        >
          <Text
            style={{
              ...styles.title,
              color: ThemeManager.colors.blackWhiteText,
            }}
          >
            Confirm Abstraction
          </Text>
          <Text
            style={{
              ...styles.subtitle,
              color: ThemeManager.colors.legalGreyColor,
            }}
          >
            Please review your transaction details
          </Text>

          {/* From Token */}
          <View
            style={{
              ...styles.card,
              backgroundColor: ThemeManager.colors.inputBgNew,
              marginBottom: 0
            }}
          >
            <View style={styles.tokenInfo}>
              <Image source={{ uri: fromToken.coin_image }} style={styles.icon} />
              <View>
                <Text style={[styles.tokenAmount, { color: ThemeManager.colors.blackWhiteText }]}>{fromToken.coin_name}</Text>
                <Text style={styles.tokenLabel}>{fromToken.coin_symbol?.toUpperCase()}</Text>
              </View>
            </View>
            <View>
              <Text style={[styles.tokenAmount, { color: ThemeManager.colors.blackWhiteText }]}>{fromAmt}</Text>
            </View>
          </View>

          {/* Arrow */}
          <Text style={{ ...styles.arrow }}>↓</Text>

          {/* To Token */}
          <View
            style={{
              ...styles.card,
              backgroundColor: ThemeManager.colors.inputBgNew,
            }}
          >
            <View style={styles.tokenInfo}>
              <Image source={{ uri: toToken.coin_image }} style={styles.icon} />
              <View>
                <Text style={[styles.tokenAmount, { color: ThemeManager.colors.blackWhiteText }]}>{toToken.coin_name}</Text>
                <Text style={styles.tokenLabel}>{toToken.coin_symbol?.toUpperCase()}</Text>
              </View>
            </View>
            <View>
              <Text style={[styles.tokenAmount, { color: ThemeManager.colors.blackWhiteText }]}>{toAmt}</Text>
            </View>
          </View>

          {/* Gas Fee */}
          <View
            style={[
              styles.feeBox,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            <View style={styles.feeLabelRow}>
              <Text
                style={{
                  ...styles.feeLabel,
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >
                Platform Fee ({chainAbstractionFee.platform}%)
              </Text>
            </View>
            <Text
              style={{
                ...styles.feeValue,
                color: ThemeManager.colors.blackWhiteText,
              }}
            >
              {toFixedExp((chainAbstractionFee.platform / 100) * (fromAmt), 8)} {fromToken?.coin_family == 7 ? 'TICS' : 'BTC'}
            </Text>
          </View>

          <View
            style={[
              styles.feeBox,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            <View style={styles.feeLabelRow}>
              <Text
                style={{
                  ...styles.feeLabel,
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >
                Solver Fee ({chainAbstractionFee.solver}%)
              </Text>
            </View>
            <Text
              style={{
                ...styles.feeValue,
                color: ThemeManager.colors.blackWhiteText,
              }}
            >
              {toFixedExp((chainAbstractionFee.solver / 100) * (fromAmt), 8)} {fromToken?.coin_family == 7 ? 'TICS' : 'BTC'}
            </Text>
          </View>
          {/* platForm Fee */}

          <View
            style={[
              styles.feeBox,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            <View style={styles.feeLabelRow}>
              <Text
                style={{
                  ...styles.feeLabel,
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >
                Transaction Fee
              </Text>
            </View>
            <Text
              style={{
                ...styles.feeValue,
                color: ThemeManager.colors.blackWhiteText,
              }}
            >
              {platFormFee && platFormFee + ' ' + (fromToken?.coin_family == 7 ? 'TICS' : 'BTC')}{"\n"}{fiatValTics}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: dimen(10) }}>
              <Button normalBtn1={true} buttontext={"Cancel"} onPress={onClose} />
            </View>
            <View style={{ flex: 1, marginLeft: dimen(10) }}>
              <Button buttontext={"Confirm"} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <LoaderView isLoading={isLoading} />

    </Modal>
  );
};

export default ConfirmAbstraction;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: dimen(20),
    margin: dimen(20),
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },
  title: {
    fontSize: dimen(18),
    textAlign: "center",
    fontFamily: Fonts.dmBold,
  },
  subtitle: {
    fontSize: dimen(13),
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Fonts.dmRegular,
  },
  card: {
    borderRadius: 12,
    padding: dimen(14),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: dimen(12),
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: dimen(38),
    height: dimen(38),
    marginRight: dimen(12),
    resizeMode: "contain",
  },
  tokenAmount: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(16),
    fontFamily: Fonts.dmBold,
  },
  tokenLabel: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  arrow: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(20),
    textAlign: "center",
    marginVertical: dimen(4),
  },
  feeBox: {
    borderRadius: 10,
    padding: dimen(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: heightDimen(20),
  },
  feeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feeLabel: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  feeValue: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmMedium,
    flex: 0.9,
    textAlign: 'right'
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: heightDimen(30),
  },
});
