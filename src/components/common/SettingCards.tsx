import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import images from '../../theme/Images'
import { dimen } from '../../Utils'
import { ThemeManager } from '../../../ThemeManager'
import { Fonts } from '../../theme'

const SettingCards = ({
    leftIcon,
    leftText,
    showRightText,
    onPress,
}: any) => {
    return (
        <TouchableOpacity onPress={onPress} style={{
            backgroundColor: ThemeManager.colors.mnemonicsBg,
            ...styles.mainView,
        }}>
            <View style={{
                ...styles.innerViewLeft,
                flex: 1.5
            }}>
                <FastImage {...({ resizeMode: 'contain' } as any)} source={leftIcon} style={{
                    ...styles.imgLeft,
                }} />
                <Text style={{
                    ...styles.textStyle,
                    flex: 1,
                    color: ThemeManager.colors.blackWhiteText,
                }}>{leftText}</Text>
            </View>
            <View style={{
                flex: 0.6,
                alignItems: 'flex-end',
                justifyContent: 'center',
            }}>
                {showRightText ?
                    <Text numberOfLines={1} style={{
                        fontSize: dimen(14),
                        textAlign: 'right',
                        color: ThemeManager.colors.legalGreyColor,
                    }}>{showRightText}</Text>
                    :
                    <FastImage {...({ resizeMode: 'contain' } as any)} source={images.navigateArrow} style={{
                        width: dimen(9),
                        height: dimen(16),
                    }} />}
            </View>

        </TouchableOpacity>
    )
}

export default SettingCards

const styles = StyleSheet.create({
    mainView: {

        borderRadius: dimen(14),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        paddingHorizontal: dimen(17),
        paddingVertical: dimen(20),
    },
    innerViewLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    imgLeft: {
        width: dimen(36),
        height: dimen(36),
        marginRight: dimen(10),
    },
    textStyle: {
        fontSize: dimen(16),
        fontFamily: Fonts.dmRegular
    }


})