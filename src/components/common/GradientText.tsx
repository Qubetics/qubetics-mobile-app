import { View } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

const GradientText = ({
    text,
    colors = ['#4E5EF8', '#31B8D4', '#4E5EF8'],
    style = {},
    containerStyle = {},
    textAnchor = 'start',
    x = 0,
    y,
    dx,
    dy,
    transform,
    onPress,
}: any) => {
    const { fontSize = 16, fontFamily, fontWeight, letterSpacing } = style;

    const height = containerStyle?.height ? containerStyle?.height : fontSize * 1.3;
    const width = containerStyle?.width ? containerStyle?.width : text?.length * (fontSize * 0.6); // approximate width of text

    return (
        <View style={[{ alignSelf: 'flex-end' }, containerStyle]}>
            <Svg
                height={height}
                width={width + 20}
                viewBox={`0 0 ${width + 20} ${height}`}
            >
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={colors[0]} />
                        <Stop offset="100%" stopColor={colors[1]} />
                    </LinearGradient>
                </Defs>

                <SvgText
                    fill="url(#grad)"
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fontWeight={fontWeight}
                    letterSpacing={letterSpacing}
                    x={x}
                    y={y ?? fontSize} // baseline fallback
                    textAnchor={textAnchor as any}
                    dx={dx}
                    dy={dy}
                    transform={transform}
                    onPress={onPress}
                >
                    {text?.slice(0, 25)}
                    {text?.length > 25 && '...'}
                </SvgText>
            </Svg>
        </View>
    );
};

export default GradientText;
