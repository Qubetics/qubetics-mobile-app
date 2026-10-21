import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeManager } from '../../../ThemeManager';

const GradientBorderView = ({ children, mainStyle, gradientStyle }: {children: any; mainStyle: any; gradientStyle: any}) => {
    return (
        <LinearGradient
            colors={['#73C9E2', '#6C8DC5', '#6456B2', '#6145EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientBorder, gradientStyle]}
        >
            <View style={[styles.innerView, mainStyle, { backgroundColor: ThemeManager.colors.mainBgNew, }]}>
                {children}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientBorder: {
        // Thickness of the border
        borderRadius: 14, // Adjust the border radius
    },
    innerView: {
        margin: 1,
        flex: 1,
        borderRadius: 14, // Match the radius minus border width
    },
});

export { GradientBorderView };
