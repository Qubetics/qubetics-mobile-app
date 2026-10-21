import { FlatList, StyleSheet, Text, View } from 'react-native'
import { ThemeManager } from '../../../../ThemeManager'
import { Fonts } from '../../../theme'
import { LanguageManager } from '../../../../LanguageManager'
import { dimen, getDaysLeftOnPlan, heightDimen, widthDimen } from '../../../Utils'
import { Button } from '../../common'
import { bigNumberSafeMath, toFixedExp } from '../../../Utils/MethodsUtils'

export default function PlansHistory({
    planList,
    handleEndReached,
    loading,
    onRenewPress,
    emptyComponentText = 'No plans found'
}: {planList: any; handleEndReached: any; loading: any; onRenewPress: any; emptyComponentText?: string}) {
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

    const renderItem = ({ item }: {item: any}) => {
        return (
            <>
                <View
                    style={[
                        styles.sessionCard,
                        { backgroundColor: ThemeManager.colors.mnemonicsBg },
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                        <View style={{ marginLeft: widthDimen(10), flex: 1 }}>
                            <Text
                            ellipsizeMode='middle'
                            numberOfLines={1}
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                ]}
                            >
                                {item?.plans?.provider_address}
                            </Text>
                            <Text
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor },
                                ]}
                            >
                                {toFixedExp(bigNumberSafeMath(item?.price?.quote_value, "/", 10 ** 18), 2)} {"TICS"}
                            </Text>
                            <Text
                                style={[styles.time, { color: ThemeManager.colors.legalGreyColor }]}
                            >
                                {formatPrettyDate(item.start_at)}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.duration,
                                { color: ThemeManager.colors.legalGreyColor },
                            ]}
                        >
                            {item.status != "active" ? "Expired" : getDaysLeftOnPlan(item.inactive_at)}
                        </Text>
                    </View>
                    {
                       item.status != "active" && onRenewPress &&
                        (
                            <View style={styles.renewButton}>
                                <Button
                                    imgStyle={styles.reloadImg}
                                    buttontext={LanguageManager.vpn.renew}
                                    onPress={() => {
                                        onRenewPress(item?.plans);
                                    }}
                                    myStyle={{ width: "100%", alignItems: "center" }}
                                    viewStyle={{
                                        backgroundColor: ThemeManager.colors.mnemonicsBg,
                                        ...styles.borderButtonStyle,
                                    }}
                                />
                            </View>

                        )
                    }
                </View>
            </>
        )
    }

    const renderEmptyComponent = () => (
        <View style={{ flex: 1, marginTop: "70%", justifyContent: 'center', }}>
            <Text
                allowFontScaling={false}
                style={[
                    {
                        color: ThemeManager.colors.blackWhiteText,
                        fontFamily: Fonts.dmMedium,
                        fontSize: 15,
                        paddingHorizontal: 8,
                        alignSelf: 'center',
                    },
                ]}>
                {loading ? '' : emptyComponentText}
            </Text>
        </View>
    );

    return (
        <FlatList
            data={planList}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyComponent}
            onEndReached={() => {
                handleEndReached()
            }}
        />

    )
}

const styles = StyleSheet.create({
    listContainer: {
        marginHorizontal: widthDimen(18),
        marginBottom: heightDimen(15),
    },
    sessionCard: {
        borderRadius: 14,
        padding: dimen(16),
        marginBottom: heightDimen(8),
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
    renewButton: {
        marginTop: heightDimen(30),
        marginBottom: heightDimen(5)
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

});