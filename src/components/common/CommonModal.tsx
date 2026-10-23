import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { getDimensionPercentage as dimen } from "../../Utils";
import { useKeyboard } from "../../hooks/useKeyboard";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const CommonModal = (props: any) => {
  const [mounted, setMounted] = useState(props.visible);
  const { keyboardHeight } = useKeyboard();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(props.visible ? 1 : 0)).current;

  // Always-current ref so PanResponder closure never captures a stale onClose
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  const animateClose = (cb?: any) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      cb?.();
    });
  };

  useEffect(() => {
    if (props.visible) {
      setMounted(true);
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animateClose();
    }
  }, [props.visible]);

  const handleClose = () => animateClose(() => onCloseRef.current?.());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setMounted(false);
            onCloseRef.current?.();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: ThemeManager.colors.blurBg },
        props.mainContainerModal,
        { opacity: backdropOpacity },
      ]}
    >
      {/* Tapping the backdrop area above the sheet closes the modal */}
      <Pressable style={styles.backdropPressable} onPress={handleClose} />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }], paddingBottom: keyboardHeight }]}
        {...panResponder.panHandlers}
      >
        {props.headerContent}
        <View
          style={[
            styles.modalView,
            {
              minHeight: SCREEN_HEIGHT <= 800 ? 270 : 290,
              backgroundColor: ThemeManager.colors.mnemonicsBg,
            },
          ]}
        >
          <View style={styles.mainStyle}>{props.children}</View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default CommonModal;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 999,
    elevation: 999,
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: "100%",
  },
  modalView: {
    borderTopRightRadius: dimen(14),
    borderTopLeftRadius: dimen(14),
    borderColor: ThemeManager.colors.addressBookDropBorederColor,
  },
  mainStyle: {
    marginHorizontal: dimen(24),
  },
});
