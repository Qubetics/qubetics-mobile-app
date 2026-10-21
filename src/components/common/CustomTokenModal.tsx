import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { HeaderMain } from "./HeaderMain";

export const CustomTokenModal = (props: any) => {
  const [, setThemeSelected] = useState();

  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener("getThemeChanged", (data) => {
      setThemeSelected(data);

    });
  }, []);

  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={props.openModel}
      onRequestClose={props.onPressIn}
    >
      <View
        style={[
          styles.modalView,
          {
            backgroundColor: ThemeManager.colors.mainBgNew,
          },
        ]}
      >
        <HeaderMain inModal
          backCallBack={props.onPressIn}
          BackButtonText={"Network"}
        ></HeaderMain>
        <View style={{ marginHorizontal: 15 }}>
          {props.list?.map((item: any, index: any) => {
            return (
              <TouchableOpacity
                disabled={props.disabled}
                key={index + ""}
                onPress={() => props.onPress(item, index)}
                style={[
                  styles.touchableStyle,
                  {
                    borderBottomWidth: 1,
                    borderColor: ThemeManager.colors.dividerColor,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image style={styles.imgStyle} source={{ uri: item.image }} />
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.textStyle1,
                      {
                        color:
                          index == props.selectedIndex
                            ? ThemeManager.colors.blackWhiteText
                            : ThemeManager.colors.blackWhiteText,
                        fontFamily: index == props.selectedIndex
                          ? Fonts.dmSemiBold
                          : Fonts.dmLight
                      },
                    ]}
                  >
                    {item.symbol}
                  </Text>
                </View>
                <Image source={ThemeManager.ImageIcons.forwardIcon} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  textStyle1: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: Fonts.dmRegular,
  },
  modalView: {

    flex: 1,
  },
  touchableStyle: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 5,
    justifyContent: "space-between",
  },
  imgStyle: {
    height: 32,
    width: 32,
    borderRadius: 32,
  },
});
