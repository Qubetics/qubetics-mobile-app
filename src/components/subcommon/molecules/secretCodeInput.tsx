import { StyleSheet, Text, View, Image, Platform, TouchableOpacity } from 'react-native'
import { ThemeManager } from '../../../../ThemeManager'
import images from '../../../theme/Images'
import KeyPad from './keyPad'
import { getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils'
import { Fonts } from '../../../theme'

const SecretCodeInput = ({ biometric, onPress = false, secretTxt, togglePress, toggleStatus }: {onPress?: any; biometric: any; secretTxt: any; togglePress: any; toggleStatus: any}) => {

    return (
        <View>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: Platform.OS == 'android' ? heightDimen(13) : heightDimen(20)
            }}>
                {secretTxt?.map((char: any, index: any) => {
                    return (
                        <View key={index} style={[styles.itemsStyle, { borderColor: (char) ? ThemeManager.colors.pinColor : ThemeManager.colors.inputBorder, }]}>
                            <Text style={[styles.secretText, { color: ThemeManager.colors.pinColor }]}>{char ? "*" : ""}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={{
                marginTop: Platform.OS == 'android' ? heightDimen(20) : heightDimen(30),
            }}>
                <Text style={[{ ...styles.securityText, color: ThemeManager.colors.blackWhiteText }]}>Adds an extra layer of security when using the app</Text>
                {biometric ? <View
                    style={{ ...styles.biomatricView, backgroundColor: ThemeManager.colors.darkGreyBg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image source={images.se} />
                        <Text style={{ color: ThemeManager.colors.blackWhiteText, marginHorizontal: widthDimen(12) }}>Enable Biometric</Text>
                        <TouchableOpacity onPress={togglePress}>
                            <Image source={toggleStatus ? images.toggleGreen1 : images.ToggleOff} />
                        </TouchableOpacity>

                    </View>
                </View> : <View style={{ height: getDimensionPercentage(50), }}></View>}
            </View>
            <View>
                {onPress && <KeyPad onPress={onPress} />}
            </View>
        </View>

    )
}

export default SecretCodeInput

const styles = StyleSheet.create({
    itemsStyle: {
        width: getDimensionPercentage(50),
        height: getDimensionPercentage(50), // Set width and height to create a circle
        borderRadius: getDimensionPercentage(14), // Half of width/height to create a circle
        alignItems: 'center',
        borderWidth: widthDimen(1),
        justifyContent: 'center',
    },
    secretText: {
        fontSize: getDimensionPercentage(22),
        fontFamily: Fonts.dmMedium,
        alignSelf: "center",
        textAlign: "center",
        lineHeight: getDimensionPercentage(27.52),
        paddingTop: heightDimen(10),
    },
    securityText: {
        fontSize: getDimensionPercentage(18),
        fontFamily: Fonts.dmMedium,
        lineHeight: getDimensionPercentage(23),
        marginRight: widthDimen(30),
    },
    biomatricView: {
        alignSelf: 'flex-start',
        height: getDimensionPercentage(50),
        justifyContent: 'center',
        borderRadius: 14,
        overflow: 'hidden',
        paddingHorizontal: widthDimen(16),
        marginTop: heightDimen(30),

    },
})