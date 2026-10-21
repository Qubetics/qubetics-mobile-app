import { Image, StyleSheet, Text, View } from "react-native";
import { ThemeManager } from "../../../../ThemeManager";
import { Fonts } from "../../../theme";
import { dimen, heightDimen, widthDimen } from "../../../Utils";

const DVpnView = ({
    country,
    flag,
    city,
    startAt,
    statusAt,
    onReconnectPress,
}: any) => {

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
                {
                    backgroundColor: ThemeManager.colors.mnemonicsBg,
                },
            ]}
        >
            <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: flag }} style={styles.flag} />
                <View style={{ marginLeft: widthDimen(10), }}>
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
            </View>
        </View>
    );
};

export default DVpnView;

const styles = StyleSheet.create({
    sessionCard: {
        borderRadius: 14,
        padding: dimen(16),
        marginBottom: heightDimen(8),
        marginHorizontal: heightDimen(20),

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
    time: {
        marginTop: heightDimen(3),
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
    },

});
