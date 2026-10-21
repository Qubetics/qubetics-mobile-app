import { useEffect, useState } from 'react';
import {
  TextInput,
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { checkKeyboards } from '../../Utils/MethodsUtils'; import { EventRegister } from 'react-native-event-listeners';
import { useKeyboard } from '../../hooks/useKeyboard';
import { Fonts, Images } from '../../theme';
import { ThemeManager } from '../../../ThemeManager';
import { getDimensionPercentage, widthDimen } from '../../Utils';


const InputCustomWithQrButton = (props: any) => {
  const [, setThemeSelected] = useState(2);
  const { isKeyboardOpen } = useKeyboard();

  useEffect(() => {
    if (isKeyboardOpen && Platform.OS === "android") {
      checkKeyboards();
    }
  }, [isKeyboardOpen]);
  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
  }, []);

  //******************************************************************************************/
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={props.onPress}
      style={[styles.ViewStyle, props.outsideView, { borderColor: ThemeManager.colors.inputBorder }]}>
      {props.children}
      <TextInput
        onFocus={props.onFocus}
        secureTextEntry={props.secureTextEntry}
        value={props.value}
        placeholder={props.placeHolder}
        onChangeText={props.onChangeText}
        onBlur={props.onBlur}
        style={[styles.inputStyle, props.customInputStyle, {
          color: props.isCopyColoured == true ? ThemeManager.colors.placeholderColorNew : ThemeManager.colors.blackWhiteText,
        }]}
        onSubmitEditing={props.onSubmitEditing}
        multiline={false}
        numberOfLines={1}
        autoCorrect={false}
        keyboardType={props.keyboardType}
        editable={props.editable}
        maxLength={props.maxLength}
        placeholderTextColor={props.placeholderTextColor}
        allowFontScaling={false}
      />
      <View style={[styles.ViewStyle1, props.customBtnsView,]}>

        {props.isPaste == true ? (
          <TouchableOpacity disabled={props.disablePaste} style={{ }} onPress={props.onPressPaste}>
            <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.lightGrayTextColor }]}>{props.paste}</Text>
          </TouchableOpacity>
        ) : null}

        {props.customIcon && (
          <TouchableOpacity style={[{ marginRight: 15 }, props.copystyle]} onPress={async () => { props.customIconPress() }}>
            <Image source={props.customIcon} style={{ tintColor: ThemeManager.colors.subTitle1 }} />
          </TouchableOpacity>
        )}

        {props.isCopy == true ? (
          <TouchableOpacity style={[{ marginRight: 15 }, props.copystyle]} onPress={async () => { props.doCopy() }}>
            <Image source={props.copyImg ? props.copyImg : ThemeManager.ImageIcons.copy} style={{ tintColor: ThemeManager.colors.subTitle1 }} />
          </TouchableOpacity>
        ) : null}

        {props.isCopyColoured == true ? (
          <TouchableOpacity style={[{ marginRight: 0 }, props.copystyle]} onPress={async () => { props.doCopyNew() }}>
            <Image source={Images.copy} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          disabled={props.disabled}
          style={[{ marginRight: 18, },
          props.qrstyle]} onPress={async () => {
            props.showQrCode()
          }}>
          <Image source={props.notScan ? props.image : ThemeManager.ImageIcons.scan} style={{ tintColor: ThemeManager.colors.legalGreyColor, }} />
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle1: {
    width: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ViewStyle: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 10,
    paddingRight: 10,
    height: getDimensionPercentage(55),
  },
  textStyle: {
    alignSelf: 'center',
    fontSize: 12,
    marginRight: 12,
    fontFamily: Fonts.dmMedium,
  },
  inputStyle: {
    color: ThemeManager.colors.blackWhiteText,
    paddingHorizontal: widthDimen(12),
    fontSize: 14,
    height: getDimensionPercentage(55),
    fontFamily: Fonts.dmRegular,
    width: '78%',
  },
});
export { InputCustomWithQrButton };



