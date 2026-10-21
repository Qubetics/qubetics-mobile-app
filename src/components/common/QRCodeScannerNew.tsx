import { View } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useBarcodeScannerOutput } from 'react-native-vision-camera-barcode-scanner';
import { consoleLogFunc } from '../../Utils/MethodsUtils';

// Kept outside the component: useBarcodeScannerOutput() re-creates the native
// output whenever this array changes identity.
const BARCODE_FORMATS: any = ['qr-code', 'ean-13'];

const QRCodeScannerNew = (props: any) => {
    const [isShowBlankView, setShowBlankView] = useState(false)
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    // The scanner keeps firing until the camera is torn down, so guard against
    // delivering the same scan to the caller more than once.
    const hasScannedRef = useRef(false)
    const onReadRef = useRef(props.onRead)
    onReadRef.current = props.onRead

    useEffect(() => {
        if (!hasPermission) {
            requestPermission().catch(() => { });
        }
    }, [hasPermission, requestPermission]);

    const scannerOutput = useBarcodeScannerOutput({
        barcodeFormats: BARCODE_FORMATS,
        onBarcodeScanned: barcodes => {
            if (hasScannedRef.current) {
                return;
            }
            const validCode = barcodes?.find(barcode => barcode.rawValue);
            if (validCode) {
                hasScannedRef.current = true;
                onReadRef.current({ data: validCode.rawValue });
                setTimeout(() => {
                    setShowBlankView(true)
                }, 150)
            } else {
                consoleLogFunc("validCode:::::");
            }
        },
        onError: error => {
            consoleLogFunc("barcode scanner error:::::", error?.message);
            onReadRef.current({ data: "" });
        },
    });

    return (
        <View style={{ flex: 0.95, justifyContent: "center", alignItems: "center" }}>
            {(!!device && hasPermission && !isShowBlankView) &&
                <Camera
                    style={{ width: '100%', height: '100%', marginTop: 20 }}
                    device={device}
                    isActive={true}
                    outputs={[scannerOutput]}
                    onError={(error) => {
                        consoleLogFunc("camera error:::::", error?.message);
                        onReadRef.current({ data: "" });
                    }}
                />
            }
        </View>

    )
}

export { QRCodeScannerNew }
