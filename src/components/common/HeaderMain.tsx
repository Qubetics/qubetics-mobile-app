import { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import { statusBarOffset } from "../../Utils/StatusBarOffset";
import { Actions } from '../../navigation/RootNavigation';
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts, Images } from "../../theme/";
import {
  getDimensionPercentage, heightDimen,
  widthDimen
} from "../../Utils";

const HeaderMain = (props: any) => {
  const [istouchdis, setistouchdis] = useState(false);
  return (
    <View
      style={[
        styles.main,
        {
          height:
            Platform.OS == "ios"
              ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
                ? getDimensionPercentage(120)
                : getDimensionPercentage(110)
              : statusBarOffset + getDimensionPercentage(60),
        },
        props?.customMainStyle,
      ]}
    >
      <View style={[styles.HeaderStyle, props.bgColor, props.customStyle]}>
        <View style={{ flex: 0.3, justifyContent: "flex-start" }}>
          {props.backCallBack ? (
            <TouchableOpacity
              style={{ width: 25 }}
              disabled={istouchdis}
              onPress={() => {
                if(!props.disableTouchDis){
                  setistouchdis(true);
                }
                
                props.backCallBack();
              }}
            >
              {!props?.showBackBtn && (
                <Image
                  source={Images.arrowLeft}
                  style={[
                    props.imgStyle,
                    { tintColor: ThemeManager.colors.blackWhiteText },
                  ]}
                />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.touchableStyle}
              disabled={istouchdis}
              onPress={() => {
                setistouchdis(true);
                Actions.pop();
                setTimeout(() => {
                  setistouchdis(false);
                }, 1500);
              }}
            >
              {!props?.showBackBtn && (
                <Image
                  source={Images.arrowLeft}
                  style={{ tintColor: ThemeManager.colors.blackWhiteText }}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {props.beforeImport ? (
          <Text
            allowFontScaling={false}
            style={[
              styles.textStyle,
              { color: ThemeManager.colors.headersTextColor },
              props.TextcustomStyle,
            ]}
            numberOfLines={1}
          >
            {props.BackButtonText}
          </Text>
        ) : (
          <Text
            allowFontScaling={false}
            style={[
              styles.textStyleNew,
              { color: ThemeManager.colors.blackWhiteText },
              props.TextcustomStyle,
            ]}
            numberOfLines={props.expandHeader ? 2 : 1}
          >
            {props.BackButtonText}
          </Text>
        )}
        <View style={{ flexDirection: "row", flex: 0.3, justifyContent: "flex-end" }}>
          {props.imgThird && (
            <TouchableOpacity
              onPress={props.onPressCsv}
              style={{ width: 25, height: 22, marginRight: 5 }}
            >
              <Image
                source={Images.csv}
                style={[styles.imgStyle1, props.imgStyle1]}
              />
            </TouchableOpacity>
          )}

          {props.imgNew && (
            <TouchableOpacity
              onPress={props.onPressImgNew}
              style={[{ width: 25, height: 22, marginRight: 5 }, props?.imgNewView]}
            >
              <Image
                source={props.imgNew}
                style={[styles.imgStyle1, props.imgStyle1]}
              />
            </TouchableOpacity>
          )}

          {props.imgSecond ? (
            <TouchableOpacity
              onPress={props.onPressIcon}
              style={[{ width: 25, height: 22 }, props.imgSecondViewStyle]}
              {...props?.imgSecondTouchableProps}
            >
              <Image
                source={props.imgSecond}
                style={[styles.imgStyle1, props.imgSecondStyle]}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ width: 25, height: 25 }}
            ></TouchableOpacity>
          )}
        </View>

      </View>
      <View>
        {props.showtext && (
          <Text style={{ color: ThemeManager.colors.lightBorderColor }}>
            {LanguageManager.walletMain.totalBal}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row" }}>

      </View>
    </View>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  main: {
  
    alignItems: "center",
    justifyContent: "flex-end",
    borderBottomEndRadius: getDimensionPercentage(20),
    overflow: "hidden",
    borderBottomStartRadius: getDimensionPercentage(20),
    paddingBottom: getDimensionPercentage(20),
  },
  imgStyle1: {
    resizeMode: "contain",
    width: heightDimen(24),
    height: widthDimen(23),
  },
  textStyle: {
    textAlign: "center",
    flex: 2,
    fontFamily: Fonts.dmBold,
    fontSize: 18,
  },
  textStyleNew: {
    textAlign: "center",
    flex: 1,
    fontFamily: Fonts.dmMedium,
    fontSize: getDimensionPercentage(18),
    lineHeight: getDimensionPercentage(20),
    marginTop: 2
  },
  touchableStyle: {
  },
  HeaderStyle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: getDimensionPercentage(25),
  },
});

export { HeaderMain };
