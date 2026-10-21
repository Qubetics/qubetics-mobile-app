import { StyleSheet, Text, View } from 'react-native'
import { ThemeManager } from '../../../ThemeManager'
import { InputCustom } from './InputCustom'
import { dimen } from '../../Utils'
import fonts from '../../theme/Fonts'

const LabelTextInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    customViewStyle = {},
    isEnabled
}: any) => {
  return (
    <View style={{marginTop:dimen(17),...customViewStyle }}>
    <Text allowFontScaling={false} style={[styles.txtTitle, { color: ThemeManager.colors.blackWhiteText }]}>{label}</Text>
              <InputCustom
                placeHolder={placeholder}
                placeholderTextColor={ThemeManager.colors.darkLighttext}
                onChangeText={onChangeText}
                value={value}
                editable={isEnabled}
                customInputStyle={{ borderWidth: 1}}
              />
            </View>
  )
}

export default LabelTextInput

const styles = StyleSheet.create({
    txtTitle:{
        marginBottom:dimen(10),
        fontSize: dimen(14),
        fontFamily:fonts.dmMedium,
    }
})