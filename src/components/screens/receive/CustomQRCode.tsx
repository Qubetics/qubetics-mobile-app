import { StyleSheet, View, Image } from "react-native";
import QRCodeStyled, { useQRCodeData, type GradientProps } from "react-native-qrcode-styled";
import { Images } from "../../../theme";

const QR_TOTAL_SIZE = 300;
const EYE_SIZE_IN_PIECES = 7;
// Visible ring of qrSideIcon_copy.png as a fraction of the whole image.
const EYE_ARTWORK_RATIO = 0.82;
const QR_OPTIONS = { errorCorrectionLevel: "H" } as const;

const gradient: GradientProps = {
  type: "radial",
  options: {
    center: [0.5, 0.5],
    radius: [0.5, 0.5],
    colors: ["#AA89D4", "#FFFFFF"],
    locations: [0, 1],
  },
};

function CustomQRCode({ address }: { address: string }) {
  const isLongAddress = address?.length > 43;
  const padding = isLongAddress ? 30 : 28;
  // The rendered size is fixed (size + 2 * padding), so the QR and the eye
  // overlays look identical on every screen density and width.
  const size = QR_TOTAL_SIZE - 2 * padding;
  const { qrCodeSize } = useQRCodeData(address, QR_OPTIONS);
  const eyeSize = (size / qrCodeSize) * EYE_SIZE_IN_PIECES;
  // The icon artwork has a soft glow margin, so the image is drawn larger than
  // the 7-module eye and centred on it; the visible ring then covers the eye.
  const eyeImageSize = eyeSize / EYE_ARTWORK_RATIO;
  const eyeOffset = padding - (eyeImageSize - eyeSize) / 2;
  const eyeStyle = { position: "absolute", width: eyeImageSize, height: eyeImageSize } as const;

  return (
    <View style={styles.container}>
      <QRCodeStyled
        size={size}
        data={address}
        errorCorrectionLevel="H"
        pieceScale={0.9}
        padding={padding}
        pieceBorderRadius={4}
        style={styles.svg}
        gradient={{
          type: "radial",
          options: {
            center: [0.5, 0.6],
            radius: [0.5, 0.5],
            colors: ["#AA89D4", "#FFFFFF"],
            locations: [0, 1],
          },
        }}
        outerEyesOptions={{ gradient }}
        innerEyesOptions={{ gradient }}
        logo={{
          href: Images.welcomelogo,
          padding: 1,
          scale: isLongAddress ? 0.9 : 1,
        }}
      />

      <Image
        source={Images.qrSideIcon_copy}
        resizeMode="contain"
        style={[eyeStyle, { top: eyeOffset, left: eyeOffset }]}
      />
      <Image
        source={Images.qrSideIcon_copy}
        resizeMode="contain"
        style={[eyeStyle, { top: eyeOffset, right: eyeOffset }]}
      />
      <Image
        source={Images.qrSideIcon_copy}
        resizeMode="contain"
        style={[eyeStyle, { bottom: eyeOffset, left: eyeOffset }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: QR_TOTAL_SIZE,
    height: QR_TOTAL_SIZE,
  },
  svg: {
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default CustomQRCode;
