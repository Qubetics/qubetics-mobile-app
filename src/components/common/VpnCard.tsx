import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ThemeManager} from '../../../ThemeManager';
import {Fonts} from '../../theme';
import {dimen, widthDimen} from '../../Utils';
import fonts from '../../theme/Fonts';

const VpnCard = ({
  onPress,
  isDns,
  onSelect,
  selected,
  label,
  icon,
  checkIcon,
  isFeegranter,
  daysLeft,
}: any) => {
  return (
    <>
      {isDns ? (
        <Pressable
          key={label}
          onPress={onSelect}
          style={[
            styles.item,
            {backgroundColor: ThemeManager.colors.mnemonicsBg},
          ]}>
          <View style={styles.row}>
            {icon && <Image source={icon} style={styles.icon} />}
            <Text
              style={[
                styles.label,
                {color: ThemeManager.colors.headersTextColor},
              ]}>
              {label}
            </Text>
          </View>
          {selected === label && (
            <Image source={checkIcon} style={styles.icon_1} />
          )}
        </Pressable>
      ) : isFeegranter ? (
        <Pressable
          key={label}
          onPress={onSelect}
          style={[
            styles.item,
            {backgroundColor: ThemeManager.colors.mnemonicsBg},
          ]}>
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                {color: ThemeManager.colors.headersTextColor},
              ]}>
              {label}
            </Text>
          </View>
          <Image source={checkIcon} style={styles.icon_2} />
        </Pressable>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={1}
          style={[
            styles.datacentreTag,
            {backgroundColor: ThemeManager.colors.mnemonicsBg},
          ]}>
          <Text
            style={[
              styles.leftText,
              {color: ThemeManager.colors.headersTextColor},
            ]}>
            Datacentre Nodes
          </Text>
          <Text
            style={[
              styles.rightText,
              {color: ThemeManager.colors.headersTextColor},
            ]}>
            {daysLeft}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

export default VpnCard;

const styles = StyleSheet.create({
  datacentreTag: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: dimen(16),
    borderRadius: 14,
  },
  leftText: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
  },
  rightText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmSemiBold,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dimen(16),
    borderRadius: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: dimen(40),
    height: dimen(40),
    marginRight: widthDimen(9),
    borderRadius: 20,
  },
  icon_1: {
    width: dimen(13),
    height: dimen(10),
    resizeMode: 'contain',
  },
  label: {
    fontSize: dimen(16),
    fontFamily: fonts.dmRegular,
  },
  icon_2: {
    width: dimen(20),
    height: dimen(20),
    resizeMode: 'contain',
  },
});
