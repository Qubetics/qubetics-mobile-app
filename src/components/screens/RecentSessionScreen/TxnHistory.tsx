import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ThemeManager } from '../../../../ThemeManager'
import { Fonts } from '../../../theme'
import { dimen, getQubeticsEventLabel, heightDimen, widthDimen } from '../../../Utils'
import images from '../../../theme/Images'
import { consoleLogFunc } from '../../../Utils/MethodsUtils'
import { DVPN_EXPLORER_URL_LINK } from '../../../EndPoint'

export default function TxnHistory({
    transactionList,
    handleEndReached,
    loading,
    onCopyAddress
}: {transactionList: any; handleEndReached: any; loading: any; onCopyAddress: any}) {

    const shortenAddress = (address: any) => {
        if (!address) return '';
        const start = address.slice(0, 6); // first 6 chars
        const end = address.slice(-6);     // last 6 chars
        return `${start}..........${end}`;
    };
    const formatTxUrl = (txHash: any) => {
        if (!txHash || txHash.length < 3) return "";      
        return DVPN_EXPLORER_URL_LINK + txHash;
      };

    const renderItem = ({ item }: {item: any}) => {
        const { label: sessionType, status: sessionStatus } = getQubeticsEventLabel(item?.event, item?.status);
        return (
            <TouchableOpacity onPress={()=> {
                consoleLogFunc('item>>', item?.tx_hash);
                let txHash = item?.tx_hash?.toUpperCase()
                consoleLogFunc('txHash>>11', txHash);
                if(txHash.startsWith('0X')){
                    txHash = txHash.slice(2);
                    txHash = "0x" + txHash;
                }
                consoleLogFunc('txHash>>22', txHash);
                Linking.openURL(formatTxUrl(txHash))}}>
                <View
                    style={[
                        styles.sessionCard,
                        { backgroundColor: ThemeManager.colors.mnemonicsBg },
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                        <View style={{ marginLeft: widthDimen(10), flex: 1, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={[
                                        styles.location,
                                        { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                    ]}
                                >
                                    {shortenAddress(item?.tx_hash)}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => onCopyAddress(item?.tx_hash)}
                                    hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                                >
                                    <Image
                                        source={images.copy_clipboard}
                                        style={{
                                            alignSelf: 'center',
                                            height: heightDimen(15),
                                            width: widthDimen(15),
                                            resizeMode: 'contain',
                                            tintColor: ThemeManager.colors.blackWhiteText,
                                            marginLeft: widthDimen(6),
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                ]}
                            >
                                {sessionType}
                            </Text>
                            <Text
                                style={[styles.time, { color: sessionStatus?.toLowerCase() == "success" ? ThemeManager.colors.darkGreen : ThemeManager.colors.bloodRed }]}
                            >
                                {sessionStatus}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const renderEmptyComponent = () => (
        <View style={{ flex: 1, marginTop: "70%",  justifyContent: 'center', }}>
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
                {loading ? '' : 'No transaction found'}
            </Text>
        </View>
    );

    return (
        <FlatList
            data={transactionList}
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
    time: {
        marginTop: heightDimen(6),
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
    },

});