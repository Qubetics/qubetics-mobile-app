import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { Fonts } from '../../theme';



export const ButtonIcon = ({
  name,
  backgroundColor,
  onPress,
  style,
  width = '100%',
  image,
  tintColor,
  fontSize = 12,
  imageSize = 16,
  textHeight = 45,
  textStyle,
  directionReverse = false,
  outline = false,
  borderColor,
  borderRadius = 26,
  lineHeight = 18.52,
  index = - 1
}: any) => {

  return (
    <View
      style={{
        height: textHeight,
        borderRadius: borderRadius,
        backgroundColor: ThemeManager.colors.darkGreyBg
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{

          width: width,
          paddingHorizontal: 15,
          ...style,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'


        }}>
        {image && <Image
          source={image}
          style={[
            {
              width: imageSize,
              height: imageSize,
              marginRight: directionReverse ? 0 : 5,
            },
            tintColor ? { tintColor } : {},
          ]}
          resizeMode="contain"
        />}
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: Fonts.dmMedium,
            color: tintColor ? tintColor : (ThemeManager.colors as any).primary, // BUG PRESERVED: colors.primary does not exist (undefined at runtime)
            lineHeight: lineHeight,
            ...textStyle,
          }}
          numberOfLines={1}>
          {index != -1 && <Text style={{ color: ThemeManager.colors.legalGreyColor }}>{index + 1}. </Text>}
          {name}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
