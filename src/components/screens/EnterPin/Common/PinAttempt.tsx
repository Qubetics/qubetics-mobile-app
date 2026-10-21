import { View, Text, StyleSheet, Image } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { ThemeManager } from '../../../../../ThemeManager'
import { BlurView } from '@react-native-community/blur'
import { Colors, Fonts, Images } from '../../../../theme'
import { shouldTriggerLockout } from '../../../../Utils'
import { EventRegister } from 'react-native-event-listeners'

const PinAttempt = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [timeLeft, setTimeLeft] = useState("")
    const timer = useRef<any>(null)
    
    useEffect(()=>{
        fetchLockout()
        EventRegister?.addEventListener('pinAttempt', fetchLockout)
        return () => {
            // BUG PRESERVED: EventRegister.removeEventListener takes the listener id, not (name, fn); cleanup is ineffective
            (EventRegister as any)?.removeEventListener('pinAttempt', fetchLockout)
        }
    }, [])

    const fetchLockout = async () => {
        const data = await shouldTriggerLockout()
        if (data) {
            startTimer(data.remaining)
            setIsVisible(true)
        }
    }

    const startTimer = (remainingMs: any) => {
        if (timer.current) clearInterval(timer.current);
    
        timer.current = setInterval(() => {
          remainingMs -= 1000; // Reduce by 1 second
    
          if (remainingMs <= 0) {
            clearInterval(timer.current);
            // Reset values when timer completes
            setIsVisible(false)
            setTimeLeft("")
            return;
          }
    
          // Update state with formatted time
          setTimeLeft(formatTime(remainingMs))
        }, 1000);
      };

    const formatTime = (milliseconds: any) => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
      };

  return isVisible ? (
    <View style={styles.absoluteFill}>
       <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={3}
          reducedTransparencyFallbackColor="white"
        />
        <View style={[styles.centeredView]}>
          <View
            style={[
              styles.modalView,
              {
                backgroundColor: ThemeManager.colors.Mainbg,
                borderColor: ThemeManager.colors.Mainbg,
              },
            ]}>
            <View style={{alignItems: 'center'}}>
              <Image style={{height: 20, width: 20}} source={Images.infoIcon} />
              <Text
                allowFontScaling={false}
                style={[
                  styles.modalTitle,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {'Too Many Attempts'}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.subTitle,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {`Please wait ${timeLeft} `}
              </Text>
            </View>
           
          </View>
        </View>
    </View>
  ) : null
}

const styles = StyleSheet.create({
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 1,
    },
    blurView: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    centeredView: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        elevation: 1,
    },
    modalView: {
        backgroundColor: Colors.successColor,
        borderRadius: 12,
        padding: 20,
        width: '90%',
        borderWidth: 1,
      },
      modalTitle: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 10,
        marginBottom: 15,
        fontFamily: Fonts.dmBold,
      },
      subTitle: {
        textAlign: 'center',
        fontSize: 14,
        marginTop: 10,
        fontFamily: Fonts.dmRegular,
      },
})

export default PinAttempt