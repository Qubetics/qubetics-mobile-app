import { View, Text, FlatList, TouchableOpacity, unstable_batchedUpdates } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { useEffect, useRef, useState } from 'react'
import { ThemeManager } from '../../../../ThemeManager'
import { HeaderMain, LoaderView, OnboardingHeadings } from '../../common'
import { LanguageManager } from '../../../../LanguageManager'
import styles from './ExportProivateKeyStyles'
import { clearGarbageCollection, getEncryptedData } from '../../../Utils/MethodsUtils'
import { getDimensionPercentage as dimen, disableScreenshotPrevent, enableScreenshotPrevent, heightDimen, widthDimen } from '../../../Utils'
import FastImage from 'react-native-fast-image'
import Toast from 'react-native-easy-toast'
import { COIN_IMAGE_BY_SYMBOL } from '../../../Constants'
import { deriveSolanaPrivateKey } from '../../../Utils/SolUtils'
import bs58 from 'bs58'
import Clipboard from "@react-native-clipboard/clipboard";

const ExportPrivateKeys = ({ walletItem, pin }: {walletItem: any; pin: any}) => {
    const [keysData, setKeysData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { manageWallet } = LanguageManager;

    const toast = useRef<any>(null);
    useEffect(() => {
        enableScreenshotPrevent()
        getKeys()
        return () => {
            disableScreenshotPrevent();
            clearGarbageCollection();
            setKeysData([]);
        }

    }, [])

    const getKeys = async () => {
        try {
            let arr = [];
            for (const item of walletItem.loginRequest?.addressList || []) {
                setIsLoading(true)
                let privateKey: any = ""
                if (item?.address.includes('qubetics')) continue;
                if (item?.coin_family == 5) {
                    privateKey = await getEncryptedData(item.address, pin)
                    privateKey = await deriveSolanaPrivateKey(privateKey)
                    privateKey = bs58.encode(new Uint8Array(privateKey))
                } else {
                    privateKey = await getEncryptedData(item.address + '_pk', pin)
                }
                arr.push({
                    symbol: item.symbol,
                    key: privateKey,
                    coinFamily: item.coin_family,
                });
                privateKey = ""
            }
            (unstable_batchedUpdates as any)(() => {
                setKeysData(arr);
                setIsLoading(false);
            })
        } catch (error) {
            setIsLoading(false)
            console.error("Error fetching keys ExportPrivateKeys:", error);
        }
    };

    const onPressKey = async (item: any) => {
        await Clipboard.setString(item.key);
        toast.current?.show('Copied')
    }
    return (
        <BackgroundImage
            source={ThemeManager.ImageIcons.mainBgImgNew}
            style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }} >
            <HeaderMain
                customStyle={{ paddingHorizontal: widthDimen(24) }}
            />
            <View style={styles.mainViewStyle}>
                <OnboardingHeadings title={manageWallet.privateKey} subTitle={manageWallet.keepYourPrivateKey} />

                <FlatList
                    data={keysData}
                    keyExtractor={(item, index) => item?.symbol + index}
                    renderItem={({ item }) => {
                        return (
                            <View style={{ backgroundColor: ThemeManager.colors.mnemonicsBg, padding: dimen(20), marginTop: heightDimen(10), borderRadius: dimen(10), overflow: 'hidden' }}>


                                <TouchableOpacity onPress={() => onPressKey(item)}>
                                    <View style={styles.imageSymbolContainer}>
                                        <FastImage
                                            source={{ uri: (COIN_IMAGE_BY_SYMBOL as any)?.[item.symbol] }}
                                            style={styles.imageStyle} {...({ resizeMode: 'contain' } as any)} />
                                        <Text style={[styles.symbolText, { color: ThemeManager.colors.blackWhiteText }]}>{item.symbol?.toUpperCase()}</Text>
                                    </View>
                                    <Text style={[styles.keyText, { color: ThemeManager.colors.legalGreyColor }]}>{item.key}</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }}
                />
            </View>
            <Toast
                ref={toast}
                position="bottom"
                positionValue={250}
                {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
            />
            <LoaderView isLoading={isLoading} />
        </BackgroundImage>
    )
}

export default ExportPrivateKeys