import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts, Images } from "../../theme";
import {
  getDimensionPercentage as dimen
} from "../../Utils";

export const CardView = (props: any) => {
  /******************************************************************************************/
  return (
    <>

      {!props.mainCard && <TouchableOpacity
        disabled={props?.disabled}
        onPress={props.onPress} style={[styles.mainView, props.mainStyle]}>

        <View style={[styles.privacyView, { backgroundColor: ThemeManager.colors.mnemonicsBg }, props?.cardStyle]}>
          <View
            style={[
              styles.ViewStyle, props.ViewStyle,
            ]}
          >
            {props.leftImg && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>

                  {props.leftImgIcon ? <Image
                    source={props.leftImgIcon}
                    style={[
                      styles.imgStyleLeft,
                      props.imgStyleLeft,
                    ]}
                  /> : <View style={{
                    ...styles.imageBg,
                    backgroundColor: ThemeManager.colors.settingIconsBg,
                  }}>
                    <Image style={{ tintColor: ThemeManager.colors.blackWhiteText }} source={props?.leftIcon} />
                  </View>}

                  <View style={[props.viewStyle, {}]}>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.textStyle, props.leftTextStyle,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {props.leftText}
                    </Text>
                    {props.bottomText && <Text
                      allowFontScaling={false}
                      style={[
                        styles.bottomTextStyle,
                        { color: ThemeManager.colors.cardCur },
                      ]}
                    >
                      {props.bottomText}
                    </Text>}
                  </View>
                </View>

                {props.fromTheme ? props.showIcon ? <Image source={Images.done} style={[styles.imgStyle, props.imgStyle, { tintColor: ThemeManager.colors.primaryColor }]} /> : null : <Image source={props.imgIcon ? props.imgIcon : Images.RightArrow} style={[styles.imgStyle]} />}

              </View>
            )}

          </View>
        </View>
      </TouchableOpacity>}

      {props.isToggle &&
        <View style={{ paddingHorizontal: dimen(24), marginTop: 24 }}>

          <View style={[styles.privacyView, { backgroundColor: ThemeManager.colors.mnemonicsBg }]}>
            <View
              style={[
                styles.ViewStyle, props.ViewStyle,

              ]}
            >
              {props.leftImg && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", }}>

                    {props?.leftImgIcon ? <Image
                      source={props.leftImgIcon}
                      style={[
                        styles.imgStyleLeft,
                        props.imgStyleLeft,
                      ]}
                    /> : <View style={{
                      ...styles.imageBg,
                      backgroundColor: ThemeManager.colors.settingIconsBg,
                    }}>
                      <Image style={{ tintColor: ThemeManager.colors.blackWhiteText }} source={props?.leftIcon} />
                    </View>}

                    <View style={[props.viewStyle, {}]}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textStyle, props.leftTextStyle,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}
                      >
                        {props.leftText}
                      </Text>
                      {props.bottomText && <Text
                        allowFontScaling={false}
                        style={[
                          styles.bottomTextStyle,
                          { color: ThemeManager.colors.cardCur },
                        ]}
                      >
                        {props.bottomText}
                      </Text>}
                    </View>
                  </View>

                  <TouchableOpacity onPress={props.onPressIcon} style={{ alignSelf: "center" }}>
                    <TouchableOpacity onPress={props.onPressToggle}>
                      {props.fromTheme ? props.showIcon ?
                        <Image source={Images.done} style={[styles.imgStyle, props.imgStyle, { tintColor: ThemeManager.colors.primaryColor }]} /> : null : <Image source={props.imgIcon ? props.imgIcon : Images.RightArrow} style={[styles.imgStyle]} />

                      }
                    </TouchableOpacity>

                  </TouchableOpacity>

                </View>
              )}

            </View>
          </View>
        </View>
      }

    </>

  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle: {
    flexDirection: "row",
    marginTop: dimen(19),
    marginBottom: dimen(20)

  },
  mainView: {
    paddingHorizontal: dimen(24),
  },
  imgStyle: {
    alignSelf: "center",
    resizeMode: "contain",
    marginRight: dimen(16),
  },
  imgStyleLeft: {
    resizeMode: "contain",
    height: dimen(36),
    width: dimen(36),
    marginLeft: dimen(16),

  },
  textStyle: {
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(16),
    lineHeight: dimen(19),
    alignSelf: "flex-start",
    marginLeft: dimen(9),

  },
  bottomTextStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(14),
    lineHeight: dimen(18),
    alignSelf: "flex-start",
  }
  , 
  privacyView: {
    borderRadius: dimen(12),
    marginBottom: dimen(16),
    width: '100%',
    borderColor: ThemeManager.colors.carBorder,
    overflow: 'hidden',
  },
  imageBg: {
    height: dimen(36),
    width: dimen(36),
    marginLeft: dimen(16),
    borderRadius: dimen(14),
    alignItems: "center",
    justifyContent: "center"
  }
});
