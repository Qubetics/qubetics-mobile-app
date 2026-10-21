import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Install this
import { ThemeManager } from '../../../ThemeManager';
import { Fonts, Images } from '../../theme';
import { dimen, heightDimen, widthDimen } from '../../Utils';

const ConnectedStatusCard = ({
  title1,
  title2,
  rightText,
  connectedText,
  src,
  isDot,
  refreshClicked,
}: any) => {
  return (
    <View>
      <LinearGradient
        colors={['#73C9E2', '#6C8DC5', '#6456B2', '#6145EA']} // gradient colors
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statusCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: dimen(16), flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            {src && <Image source={src} style={styles.srcStyle} />}
            <View>
              <Text
                style={[
                  styles.statusLabel,
                  { color: ThemeManager.colors.headersTextColor },
                ]}>
                {title1}
              </Text>
              <Text
                style={[
                  styles.connectedText,
                  connectedText,
                  { color: ThemeManager.colors.headersTextColor },
                ]}>
                {title2}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.protectedRow} onPress={refreshClicked}>
            {!isDot && (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: ThemeManager.colors.headersTextColor },
                ]}
              />
            )}
            {rightText ? (
              <>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: ThemeManager.colors.headersTextColor },
                  ]}>
                  {rightText}
                </Text>
              </>
            ) : (
              <>
                <Image source={Images.refresh_tics_balance} style={{ height: 20, width: 20 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

export default ConnectedStatusCard;

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: 10,
    marginBottom: heightDimen(8),
    flexDirection: 'row',
  },
  statusLabel: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
  },
  connectedText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmSemiBold,
  },
  protectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dot: {
    width: dimen(9),
    height: dimen(9),
    borderRadius: 5,
    marginRight: widthDimen(4),
  },
  srcStyle: {
    width: dimen(50),
    height: dimen(50),
    marginRight: widthDimen(10),
    resizeMode: 'contain',
  },
});
