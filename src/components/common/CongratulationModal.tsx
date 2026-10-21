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
  Image,
  ScrollView
} from "react-native";
import { Fonts, Images } from "../../theme";
import { horizontalScale, verticalScale } from "../../layouts/responsive";
import Singleton from "../../Singleton";
import Clipboard from "@react-native-clipboard/clipboard";
import { Button } from "./Button";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CongratulationModal = ({ visible, onClose, title, message, buttonText = "Continue" }: {visible: any; onClose: any; title: any; message: any; buttonText?: any}) => {
  // Animation refs for bottom sheet
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

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

      // Icon animation
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(iconAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
      backdropAnim.setValue(0);
      iconAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim, backdropAnim, iconAnim]);

  const handleClose = () => {
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
      onClose();
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
          blurType="dark"
          blurAmount={12}
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
          <View style={styles.modalGradient}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Image source={Images.newCloseIcon} style={styles.closeIcon} />
            </TouchableOpacity>

            <ScrollView>
            {/* Icon Section */}
            <View style={styles.iconSection}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: iconAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.2, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image source={Images.allSetIcon} style={styles.iconImage} />
              </Animated.View>
            </View>

            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text style={styles.title}>Congratulations</Text>
              
              <Text style={styles.subtitle}>
                Your abstraction wallet address was created successfully and is now ready for use.
              </Text>

              <Text style={styles.message}>
                To begin seamless cross-chain transfers, fund the following wallet addresses from the Qubetics wallet or an external wallet.
              </Text>

              {/* Address Fields */}
              <View style={styles.addressSection}>
                <Text style={styles.addressLabel}>TICS Address</Text>
                <View style={styles.addressField}>
                  <Text
                    numberOfLines={1}
                    style={styles.addressText}
                  >
                    {Singleton.getInstance().defaultMpcEthAddress}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Singleton.getInstance().showToast.show("Copied to clipboard");
                      Clipboard.setString(Singleton.getInstance().defaultMpcEthAddress);
                    }}
                    style={styles.copyButton}
                  >
                    <Image source={Images.newCopyIcon} style={styles.copyIcon} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressLabel}>BTC Address</Text>
                <View style={styles.addressField}>
                  <Text
                    numberOfLines={1}
                    style={styles.addressText}
                  >
                    {Singleton.getInstance().defaultMpcBtcAddress}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Singleton.getInstance().showToast.show("Copied to clipboard");
                      Clipboard.setString(Singleton.getInstance().defaultMpcBtcAddress);
                    }}
                    style={styles.copyButton}
                  >
                    <Image source={Images.newCopyIcon} style={styles.copyIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button */}
              <Button buttontext={buttonText} onPress={handleClose} />
            
            </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CongratulationModal;

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
    height: screenHeight - 100,
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
    backgroundColor: '#18171F',
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
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
  
  // Icon Section
  iconSection: {
    alignItems: 'center',
    marginTop: verticalScale(40),
    marginBottom: verticalScale(30),
  },
  iconContainer: {
    width: 111,
    height: 111,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 111,
    height: 111,
    resizeMode: 'contain',
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(5),
    fontFamily: Fonts.dmBold,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.dmMedium,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(20),
    lineHeight: 24,
    letterSpacing: 0.0075,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.dmMedium,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(20),
    lineHeight: 22,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.dmRegular,
    color: '#98969B',
    textAlign: 'center',
    marginBottom: verticalScale(30),
    lineHeight: 18,
  },
  
  // Address Section
  addressSection: {
    marginBottom: verticalScale(30),
  },
  addressLabel: {
    fontSize: 14,
    fontFamily: Fonts.dmMedium,
    color: '#FFFFFF',
    marginBottom: verticalScale(10),
    lineHeight: 18,
  },
  addressField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#110F15',
    borderWidth: 1,
    borderColor: '#76747B',
    borderRadius: 14,
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(20),
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: (Fonts as any).DMSansBold,
    color: '#F1F7F9',
    lineHeight: 18,
  },
  copyButton: {
    padding: 5,
  },
  copyIcon: {
    resizeMode: 'contain',
  },
  
  // Action Button
  
  // Home Indicator
});
