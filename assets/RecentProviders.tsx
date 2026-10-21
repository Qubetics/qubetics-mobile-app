import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { dimen, heightDimen, widthDimen } from '../src/Utils'
import { Fonts } from '../src/theme'
import { ThemeManager } from '../ThemeManager'
import { LanguageManager } from '../LanguageManager'
import { consoleLogFunc } from '../src/Utils/MethodsUtils'
import LinearGradient from 'react-native-linear-gradient'

const RecentProviders = (props: any) => {
    const { providers, onPressViewAll, onPressProvider } = props ?? {}
    const renderItem = ({ item }: {item: any}) => (
        <LinearGradient
            colors={(props?.lastPlanId == item?.subscribedPlanIds?.[0]) ? ['#85FFC4', '#5CC6FF', '#6456B2', '#6145EA'] : ['#18171F', '#18171F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 1, borderRadius: dimen(14), marginBottom: heightDimen(12), marginHorizontal: widthDimen(10), }}
        // width: '50%'
        >
            <TouchableOpacity onPress={() => {
                onPressProvider(item)
            }}
                activeOpacity={1}
                style={{
                    backgroundColor: 'black',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: dimen(14),
                    paddingVertical: heightDimen(18),
                    width: widthDimen(150),margin:2
                }}>
                <Text style={{
                    fontSize: dimen(14), fontFamily: Fonts.dmMedium, color: 'white',
                    paddingHorizontal: widthDimen(10)
                }}>{item?.identity ? item?.identity : item?.name ?? 'Unknown'}</Text>
            </TouchableOpacity>
        </LinearGradient>
    )

    return (
        <View style={styles.container}>
            <View style={styles.subHeaderView}>
                <Text style={[styles.title, { color: ThemeManager.colors.headersTextColor }]}>
                    {/* BUG PRESERVED: LanguageManager.vpn has no `RecentProviders` key, so this label renders nothing. */}
                    {(LanguageManager.vpn as any).RecentProviders}
                </Text>
                <Text
                    onPress={() => {
                        consoleLogFunc("RecentProviders View All Pressed")
                        onPressViewAll()
                    }
                    }
                    style={[
                        styles.rightText,
                        { color: ThemeManager.colors.legalGreyColor },
                    ]}>
                    {LanguageManager.vpn.viewAll}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: heightDimen(20), gap: widthDimen(12), }}>
                {/* {providers.map((item, index) => (
                    renderItem({ item, index })))
                } */}

                <FlatList
                    data={providers}
                    renderItem={renderItem}
                    horizontal
                    keyExtractor={(item, index) => index.toString()}
                />
            </View>
        </View>
    )
}

export default RecentProviders

const styles = StyleSheet.create({
    subHeaderView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: heightDimen(20),
    },
    container: {
        // marginHorizontal: widthDimen(24),
        // marginTop: heightDimen(40),
        marginHorizontal: widthDimen(24),

    },
    title: {
        fontSize: dimen(18),
        fontFamily: Fonts.dmMedium,
    },
    rightText: {
        fontSize: dimen(14),
        fontFamily: Fonts.dmMedium,
    },
    listContent: {
        gap: 12,
    },
})