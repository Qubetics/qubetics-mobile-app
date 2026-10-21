import { View, Text, Modal, Image, TouchableOpacity, Dimensions } from 'react-native'
import { LanguageManager } from '../../../../../LanguageManager'
import { QRCodeScannerNew } from '../../../common'
import { ThemeManager } from '../../../../../ThemeManager'
import images from '../../../../theme/Images'
import { Fonts, Images } from '../../../../theme'
import { getDimensionPercentage, hasNotchWithIOS } from '../../../../Utils'

const QrScanner = ({ isVisible, onClose, onRead }: { isVisible: any; onClose: any; onRead: any }) => {
    return (
        <Modal visible={isVisible}
            style={{ backgroundColor: ThemeManager.colors.Mainbg }}
            onRequestClose={onClose}>
            <View style={{flex: 1}}>
                <View style={{
                    position: "absolute",
                    left: 15,
                    right: 15,
                    justifyContent: "space-between",
                    top: hasNotchWithIOS() ? 80 : 60, zIndex: 1, flexDirection: "row",
                }}>
                    <TouchableOpacity
                        onPress={onClose}>
                        <Image
                            source={Images.arrowLeft}
                            style={[
                                { tintColor: ThemeManager.colors.blackWhiteText },
                            ]}
                        />
                    </TouchableOpacity>

                    <Text style={{
                        fontFamily: Fonts.dmMedium,
                        fontSize: getDimensionPercentage(18),
                        lineHeight: getDimensionPercentage(20),
                        fontWeight: "bold"
                    }}>{LanguageManager.walletConnection.scanQR}</Text>
                    <View style={{ width: 20 }} />
                </View>
                <View style={{flex: 1, backgroundColor: ThemeManager.colors.Mainbg }}>


                    <View style={{ flex: 1, backgroundColor: ThemeManager.colors.Mainbg }}>

                        <View style={{ flex: 1, marginTop: "60%", backgroundColor: ThemeManager.colors.Mainbg }}>

                            <QRCodeScannerNew
                                cameraStyle={{ backgroundColor: ThemeManager.colors.Mainbg, }}
                                onRead={onRead}
                            />

                        </View>
                    </View>
                </View>
                <Image
                    resizeMode='cover'
                    source={images.qrBg} style={[{
                        width: Dimensions.get('screen').width,
                        height: Dimensions.get('screen').height,
                        resizeMode: "cover",
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: -20,
                        bottom: 0,
                    }]} />

            </View>

        </Modal>
    )
}

export default QrScanner