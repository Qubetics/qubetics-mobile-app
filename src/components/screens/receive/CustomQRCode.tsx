import { StyleSheet, View, Image, Dimensions } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { Images } from "../../../theme";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";

function CustomQRCode({ address }: { address: string }) {
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const pieceSize = Math.min(screenWidth, screenHeight) * 0.019;
  consoleLogFunc("pieceSize>>>", pieceSize);
  consoleLogFunc("address>>>", address?.length);

  return (
    <View>
      <QRCodeStyled
        height={300}
        width={300}
        data={address}
        style={styles.svg}
        errorCorrectionLevel="H"
        pieceScale={0.6}
        padding={address?.length > 43 ? 30 : 28}
        // react-native-qrcode-styled 0.4.0 declares its props as
        // Omit<PieceOptions, 'pieceSize'>, but SVGQRCodeStyled does accept and
        // use pieceSize (it derives svgSize from it). Dropping the prop to
        // satisfy the types would fall back to DEFAULT_PIECE_SIZE and shrink
        // the QR code. Remove this once upstream stops omitting it.
        // @ts-expect-error -- library type omits a prop its implementation uses
        pieceSize={address?.length > 43 ? pieceSize * 1.1 : pieceSize * 1.22}
        pieceBorderRadius={4}
        gradient={{
          type: "radial",
          options: {
            center: [0.5, 0.6],
            radius: [0.5, 0.5],
            colors: ["#AA89D4", "#FFFFFF"],
            locations: [0, 1],
          },
        }}
        outerEyesOptions={{
          gradient: {
            type: "radial",
            options: {
              center: [0.5, 0.5],
              radius: [0.5, 0.5],
              colors: ["#AA89D4", "#FFFFFF"],
              locations: [0, 1],
            },
          },
        }}
        innerEyesOptions={{
          gradient: {
            type: "radial",
            options: {
              center: [0.5, 0.5],
              radius: [0.5, 0.5],
              colors: ["#AA89D4", "#FFFFFF"],
              locations: [0, 1],
            },
          },
        }}
        logo={{
          href: Images.welcomelogo,
          padding: 1,
          scale: address?.length > 43 ? 1.05 : 1.2,
        }}
      />

      <Image
        source={Images.qrSideIcon_copy}
        style={[
          {
            minHeight:address?.length > 43 ?60: 65,
            minWidth:address?.length > 43 ?60: 65,
            position: "absolute",
            top: 25,
            left: 30,
            height: 60,
            width: 60,
          },
        ]}
      />
      <Image
        source={Images.qrSideIcon_copy}
        style={[
          {
            minHeight: address?.length > 43 ?60:65,
            minWidth: address?.length > 43 ?60:65,
            position: "absolute",
            top: 25,
            right: 30,
            zIndex: 1,
            height: 60,
            width: 60,
          },
        ]}
      />
      <Image
        source={Images.qrSideIcon_copy}
        style={[
          {
            minHeight: address?.length > 43 ?60:65,
            minWidth: address?.length > 43 ?60:65,
            position: "absolute",
            bottom: 25,
            left: 30,
            zIndex: 2,
            height: 60,
            width: 60,

          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default CustomQRCode;
