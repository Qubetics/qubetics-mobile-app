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
import { COIN_INFO_BY_FAMILY } from "../../Constants";
import { Fonts, Images } from "../../theme";
import { dimen, heightDimen, widthDimen } from "../../Utils";

const ChainSelectorModal = ({
  visible,
  chains,
  onSelect,
  onClose,
  onSelectIndex,
  selectFrom,
  selectedIdFrom,
  selectedIdTo,
  onSelectIndexTo,
  onSelectIndexFrom,


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
        onPress={onClose}
        activeOpacity={1}
      >
        <View
          style={{
            ...styles.modalContent,
            backgroundColor: ThemeManager.colors.mnemonicsBg,
          }}
        >
          <Text style={[styles.title, { color: ThemeManager.colors.blackWhiteText }]}>Select Chain</Text>
          {chains?.map((item: any, index: any) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => {
                !selectFrom && onSelectIndexTo(item?.coin_id),
                selectFrom && onSelectIndexFrom(item?.coin_id),
                onSelect(item);
                onClose();
              }}
            >
              <View style={styles.row}>
                <Image source={{ uri: item.coin_image }} style={styles.icon} />
                <View>
                  <Text style={[styles.name, { color: ThemeManager.colors.blackWhiteText }]}>{item.coin_name}</Text>
                  <Text style={styles.label}>{item.coin_symbol?.toUpperCase()}</Text>
                </View>
                {item?.is_token == 1 && <Text style={[styles.label, { marginLeft: 5, marginTop: 12 }]}>({(COIN_INFO_BY_FAMILY as any)[item.coin_family].coin_symbol?.toUpperCase()})</Text>}
              </View>
              {selectFrom ? (item?.coin_id === selectedIdFrom && (
                <Image source={Images.tickIcon} style={styles.checkIcon} />
              )) : (item?.coin_id === selectedIdTo && (
                <Image source={Images.tickIcon} style={styles.checkIcon} />
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ChainSelectorModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingVertical: dimen(10),
  },
  item: {
    paddingVertical: heightDimen(12),
    paddingHorizontal: widthDimen(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: dimen(32),
    height: dimen(32),
    marginRight: dimen(10),
    borderRadius: dimen(16),
  },
  name: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(16),
    fontFamily: Fonts.dmMedium,
  },
  label: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  checkIcon: {
    width: dimen(18),
    height: dimen(18),
    tintColor: (ThemeManager.colors as any).primary, // BUG PRESERVED: colors.primary does not exist (undefined at runtime)
    resizeMode: "contain"
  },
  title: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(20),
    fontFamily: Fonts.dmMedium,
    textAlign: "center",
    marginVertical: heightDimen(10),
  },
});
