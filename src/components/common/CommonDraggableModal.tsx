import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { getDimensionPercentage as dimen } from "../../Utils";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/**
 * CommonDraggableModal
 *
 * Props:
 *   visible        {bool}     - controls open/close
 *   onClose        {func}     - called after close animation completes
 *   title          {string}   - optional header title
 *   children       {node}     - modal body content
 *   backdropClose  {bool}     - tap backdrop to close (default true)
 */
const CommonDraggableModal = (props: any) => {
  const { backdropClose = true } = props;

  const [modalVisible, setModalVisible] = useState(props.visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(props.visible ? 1 : 0)).current;

  // Always-current ref so PanResponder closure never captures a stale onClose
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  const animateClose = (cb?: any) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      cb?.();
    });
  };

  useEffect(() => {
    if (props.visible) {
      setModalVisible(true);
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 320,
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
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
            setModalVisible(false);
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

  return (
    <Modal
      statusBarTranslucent
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: backdropOpacity }]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={backdropClose ? handleClose : undefined}
        />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Drag handle — only this area captures the pan gesture */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {props.title ? (
            <Text
              allowFontScaling={false}
              style={[styles.title, { color: ThemeManager.colors.blackWhiteText }]}
            >
              {props.title}
            </Text>
          ) : null}

          <View style={styles.content}>{props.children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CommonDraggableModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: "100%",
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    borderTopLeftRadius: dimen(14),
    borderTopRightRadius: dimen(14),
    borderColor: ThemeManager.colors.addressBookDropBorederColor,
    paddingBottom: dimen(24),
  },
  handleArea: {
    alignItems: "center",
    paddingVertical: dimen(12),
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: ThemeManager.colors.sheetTopLine,
  },
  title: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmBold,
    marginBottom: dimen(12),
    paddingHorizontal: dimen(24),
  },
  content: {
    paddingHorizontal: dimen(24),
  },
});
