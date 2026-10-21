import { Image, StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import { Button } from "./Button";

const SessionCard = ({
  country,
  flag,
  city,
  fromSession,
  speedDown,
  speedUp,
  startAt,
  statusAt,
  onReconnectPress,
  hideReconnectButton,
}: any) => {
  const { vpn } = LanguageManager;

  const start = new Date(startAt);
  const end = new Date(statusAt);

  const diffMs = (end as any) - (start as any);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  const h = diffHours;
  const m = diffMinutes % 60;
  const s = diffSeconds % 60;

  const formatDuration = (h: any, m: any, s: any) => {
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  const duration = formatDuration(h, m, s);

  const formatPrettyDate = (isoString: any) => {
    const date = new Date(isoString);

    const options: any = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    const datePart = date.toLocaleDateString("en-US", options);
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  };

  return (
    <View
      style={[
        styles.sessionCard,
        { backgroundColor: ThemeManager.colors.mnemonicsBg },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems:'center'}}>
        <Image source={{ uri: flag }} style={styles.flag} />
        <View style={{ marginLeft: widthDimen(10), flex: 1 }}>
          <Text
            style={[
              styles.location,
              { color: ThemeManager.colors.headersTextColor },
            ]}
          >
            {country} – {city}
          </Text>
          <Text
            style={[styles.time, { color: ThemeManager.colors.legalGreyColor }]}
          >
            {formatPrettyDate(startAt)}
          </Text>
        </View>
        <Text
          style={[
            styles.duration,
            { color: ThemeManager.colors.legalGreyColor },
          ]}
        >
          {duration}
        </Text>
      </View>
      {fromSession && (
        <>
          <View
            style={[
              styles.seperator,
              { backgroundColor: ThemeManager.colors.seperatorColor },
            ]}
          />
          <View style={styles.speeds}>
            <View style={styles.speedItem}>
              <Image
                source={ThemeManager.ImageIcons.download_vpn}
                style={styles.icons}
              />
              <View style={{ marginLeft: widthDimen(12) }}>
                <Text
                  style={[
                    styles.speed,
                    { color: ThemeManager.colors.headersTextColor },
                  ]}
                >
                  {speedDown}
                </Text>
                <Text
                  style={[
                    styles.label,
                    { color: ThemeManager.colors.legalGreyColor },
                  ]}
                >
                  {vpn.downloaded}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.separator,
                { backgroundColor: ThemeManager.colors.seperatorColor },
              ]}
            />
            <View style={styles.speedItem}>
              <Image
                source={ThemeManager.ImageIcons.upload_vpn}
                style={styles.icons}
              />
              <View style={{ marginLeft: widthDimen(12) }}>
                <Text
                  style={[
                    styles.speed,
                    { color: ThemeManager.colors.headersTextColor },
                  ]}
                >
                  {speedUp}
                </Text>
                <Text
                  style={[
                    styles.label,
                    { color: ThemeManager.colors.legalGreyColor },
                  ]}
                >
                  {vpn.uploaded}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
{hideReconnectButton ? <View  style={{ height: dimen(5) }}/> : 
      <View style={styles.reconnectButton}>
        <Button
          imgStyle={styles.reloadImg}
          source={ThemeManager.ImageIcons.vpn_reload_icon}
          buttontext={LanguageManager.vpn.reconnect}
          onPress={() => {
            onReconnectPress();
          }}
          myStyle={{ width: "100%", alignItems: "center" }}
          viewStyle={{
            backgroundColor: ThemeManager.colors.mnemonicsBg,
            ...styles.borderButtonStyle,
          }}
        />
      </View>}
    </View>
  );
};

export default SessionCard;

const styles = StyleSheet.create({
  sessionCard: {
    borderRadius: 14,
    padding: dimen(16),
    marginBottom: heightDimen(8),
  },
  flag: {
    width: dimen(40),
    height: dimen(40),
    borderRadius: 20,
  },
  location: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  duration: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  time: {
    marginTop: heightDimen(3),
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  reconnectButton: {
    marginTop: heightDimen(30),
  },
  reloadImg: {
    width: dimen(20),
    height: dimen(20),
    resizeMode: "center",
    marginRight: widthDimen(6),
  },
  borderButtonStyle: {
    width: "99%",
    height: "96%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimen(14),
    flexDirection: "row",
  },

  speeds: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  speedItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  speed: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  label: {
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  separator: {
    width: 1,
    height: dimen(42),
  },
  seperator: {
    height: 1,
    width: "100%",
    marginVertical: heightDimen(16),
  },
  icons: {
    width: dimen(36),
    height: dimen(36),
  },
});
