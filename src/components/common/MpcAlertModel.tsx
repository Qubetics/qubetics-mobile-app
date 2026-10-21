import { BlurView } from "@react-native-community/blur";
import { useRef, useEffect } from "react";
import { 
  Modal, 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Image
} from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { Button } from "./Button";
import { Fonts } from "../../theme";
import { horizontalScale, verticalScale } from "../../layouts/responsive";
import images from "../../theme/Images";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MpcAlertModel = ({ visible, message, onContinue, onClose }: {visible: any; message: any; onContinue: any; onClose: any}) => {
  // Animation refs for bottom sheet
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entry animation - slide up from bottom
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
      backdropAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim, backdropAnim]);

  const handleContinue = (type: any) => {
    // Exit animation - slide down
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if(type === "close"){
        onClose();
        }else{
        onContinue();
      }
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: backdropAnim }]}>
        <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={5}
          reducedTransparencyFallbackColor="rgba(3, 13, 13, 0.6)"
        />
        
        {/* Bottom Sheet Modal */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View
            style={styles.modalGradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleContinue("close")}
              activeOpacity={0.7}
            >
              <Image source={images.newCloseIcon} style={styles.closeIcon} />
            </TouchableOpacity>

            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text style={styles.title}>Chain Abstraction Protocol</Text>
              
              <Text style={styles.message}>
                Your abstracted wallet isn't set up yet. Generate your addresses now to unlock seamless cross-chain transfers.
              </Text>

              <Button buttontext={"Generate Addresses"} onPress={handleContinue}/>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default MpcAlertModel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  bottomSheet: {
    width: screenWidth,
    height: 283,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGradient: {
    flex: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
    backgroundColor: ThemeManager.colors.mnemonicsBg
  },
  
  // Close Button
  closeButton: {
    position: 'absolute',
    top: verticalScale(20),
    right: horizontalScale(24),
    width: 20,
    height: 20,
    zIndex: 1,
  },
  closeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(20),
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.dmBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(20),
    lineHeight: 24,
    letterSpacing: 0.0075,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.dmRegular,
    color: '#98969B',
    textAlign: 'center',
    marginBottom: verticalScale(40),
    lineHeight: 18,
    paddingHorizontal: horizontalScale(20),
  },
  
  // Action Button

});
