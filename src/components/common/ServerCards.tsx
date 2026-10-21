import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import LinearGradient from "react-native-linear-gradient";

const ServerCards = ({
  name,
  flag, // image url
  locations,// numberOfCountries
  locationTxt = locations > 1 ? "Locations" : "Location",
  ping,
  isFavShow,
  isUserSubscribed,
  onPress,
  index,
  chainAddress,
  isLastPlan
}: any) => {
  const { vpn } = LanguageManager;

  return (
    <LinearGradient
      colors={isLastPlan ? ['#85FFC4', '#5CC6FF', '#6456B2', '#6145EA'] : ['#18171F', '#18171F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: dimen(14), marginBottom: heightDimen(12), }}>
      <TouchableOpacity
        key={index}
        activeOpacity={1}
        onPress={onPress}
        style={[
          styles.serverItem,
          { backgroundColor: ThemeManager.colors.mnemonicsBg,margin:1},
        ]}
      >
        {flag ? <Image source={{ uri: flag }} style={styles.flag} /> :
          <View
            style={[
              styles.imgViewStyle,
              { backgroundColor: ThemeManager.colors.placeholderColorNew },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={{
                color: ThemeManager.colors.primaryColor,
                fontSize: heightDimen(22),
                textTransform: 'capitalize',
              }}
            >
              {name?.charAt(0)}
            </Text>
          </View>}
        <View style={styles.info}>
          <Text
            style={[styles.name, { color: ThemeManager.colors.headersTextColor, textTransform: 'capitalize' }]}
          >
            {name}
          </Text>
          {chainAddress && <Text
            ellipsizeMode="middle"
            numberOfLines={1}
            style={[styles.details, { color: ThemeManager.colors.legalGreyColor }]}
          >
            {chainAddress}
          </Text>}
          {!!locations && <View style={styles.detailsRow}>
            <Text
              style={[
                styles.details,
                { color: ThemeManager.colors.legalGreyColor },
              ]}
            >
              {locations + ' ' + locationTxt}
            </Text>
          </View>}
        </View>
        {isFavShow && (
          <TouchableOpacity>
            <Image source={ThemeManager.ImageIcons.link_icon} />
          </TouchableOpacity>
        )}
        {isUserSubscribed && (
          <TouchableOpacity
            onPress={onPress}
            style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>{vpn.subscribe}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ServerCards;

const styles = StyleSheet.create({
  serverItem: {
    borderRadius: 14,
    padding: dimen(14),
    marginBottom: heightDimen(1),
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    width: dimen(40),
    height: dimen(40),
    borderRadius: 20,
    marginRight: widthDimen(10),
  },
  info: {
    flex: 1,
    marginRight: widthDimen(10),
  },
  name: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  detailsRow: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center",
  },
  details: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  subscribeButton: {
    width: dimen(95),
    height: dimen(40),
    backgroundColor: ThemeManager.colors.subscribeButtonColor,
    borderRadius: dimen(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: dimen(15),
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.subscribeButtonTextColor,
  },
  imgViewStyle: {
    height: dimen(50),
    marginRight: widthDimen(10),
    width: dimen(50),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: widthDimen(10),
    borderRadius: dimen(25),
  },
});
