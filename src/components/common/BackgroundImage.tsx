import React from "react";
import { Image, ImageProps, StyleSheet, View, ViewProps } from "react-native";

type BackgroundImageProps = ViewProps & {
  source: ImageProps["source"];
  resizeMode?: ImageProps["resizeMode"];
};

const BackgroundImage = ({
  source,
  resizeMode,
  style,
  children,
  ...viewProps
}: BackgroundImageProps) => (
  <View style={style} {...viewProps}>
    <Image source={source} resizeMode={resizeMode} style={StyleSheet.absoluteFill} />
    {children}
  </View>
);

export default BackgroundImage;
