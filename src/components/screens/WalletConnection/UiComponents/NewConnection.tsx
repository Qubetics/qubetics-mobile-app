import { View, Text, Modal, ScrollView, Image } from "react-native";
import BackgroundImage from "../../../common/BackgroundImage";
import { useEffect, useState } from 'react'
import { Button, HeaderMain, ManageItem } from '../../../common'
import { LanguageManager } from '../../../../../LanguageManager'
import { ThemeManager } from '../../../../../ThemeManager'
import styles from '../WalletConnectionStyle'
import images from '../../../../theme/Images'
import { consoleLogFunc, getData } from '../../../../Utils/MethodsUtils'
import * as Constants from '../../../../Constants'
import { SvgUri } from 'react-native-svg'

const NewConnection = ({ isVisible, onClose, approveRequestData, approveConnection }: { isVisible: any; onClose: any; approveRequestData: any; approveConnection: any }) => {
    let data = approveRequestData?.params?.proposer ? approveRequestData?.params?.proposer?.metadata : approveRequestData?.params?.[0]?.peerMeta;

    consoleLogFunc("DATA>>>>>>1234", approveRequestData?.params?.optionalNamespaces);
    
    let isSolana = false;
    let isEVM = false;
    if (Object.keys(approveRequestData?.params?.requiredNamespaces)?.toString()?.includes('solana') || Object.keys(approveRequestData?.params?.optionalNamespaces)?.toString()?.includes('solana')) {
        isSolana = true
    }
    if((Object.keys(approveRequestData?.params?.requiredNamespaces) as any)?.toString("eip155") || Object.keys(approveRequestData?.params?.optionalNamespaces)?.toString()?.includes('eip155')){
        isEVM = true;
    }
    const [walletData, setWalletData] = useState<any>("");
    useEffect(() => {
        getData(Constants.MULTI_WALLET_LIST)
            .then((list: any) => {
                let currentWallet = JSON.parse(list)
                currentWallet = currentWallet.find((res: any) => res?.defaultWallet)
                setWalletData(currentWallet);
            })
    }, [approveRequestData]);

    consoleLogFunc("data>>>", data);

    const InfoComponent = ({ image, text }: { image: any; text: any }) => {
        return (
            <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
                <Image source={image} />
                <Text style={[styles.ethWallet, { color: ThemeManager.colors.blackWhiteText, marginLeft: 10, lineHeight: 24 }]}>{text}</Text>
            </View>
        )
    }

    if (!approveRequestData) {
        return null;
    }
    return (
        <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
            <BackgroundImage
                source={ThemeManager.ImageIcons.mainBgImgNew}
                style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
            >
                <HeaderMain
                    backCallBack={onClose}
                    BackButtonText={LanguageManager.walletConnection.connectDApp} />

                <View style={{ flex: 0.9 }}>
                    <ScrollView>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                            {data?.icons?.[0]?.includes(".svg") ?
                                <View style={[styles.dappImage, { overflow: "hidden" }]}>
                                    <SvgUri
                                        width="100%"
                                        height="100%"
                                        uri={data?.icons?.[0]}
                                    />
                                </View> :
                                <Image
                                    style={styles.dappImage}
                                    source={{ uri: data?.icons?.[0] }} />}
                            <Text style={[styles.dappName, { color: ThemeManager.colors.blackWhiteText }]}>{data?.name || ""}</Text>
                            <Text style={[styles.dappUrl, { color: ThemeManager.colors.primaryColor }]}>{data?.url}</Text>
                        </View>
                        <View style={{ marginTop: 30, paddingHorizontal: 20, alignItems: "flex-start" }}>
                            <Text style={[styles.ethWallet, { color: ThemeManager.colors.blackWhiteText }]}>Wallet</Text>
                          {isSolana &&  <ManageItem
                                walletName={walletData?.walletName}
                                walletType={(walletData?.login_data?.["defaultSolAddress" ])}
                            />}

                          {isEVM && <ManageItem
                                walletName={walletData?.walletName}
                                walletType={(walletData?.login_data?.["defaultEthAddress"])}
                            />}


                            <InfoComponent image={images.icWalletActivity} text={"View your wallet balance and activity"} />
                            <InfoComponent image={images.icReqApproval} text={"Request approval for transaction"} />
                        </View>

                    </ScrollView>
                </View>
                <View style={{ flex: 0.1, paddingHorizontal: 20, marginBottom: 10 }}>
                    <Button
                        onPress={() => {

                            let address = {
                                evmAddress: isEVM ?  walletData?.login_data?.["defaultEthAddress"] : "",
                                solAddress: isSolana ? walletData?.login_data?.["defaultSolAddress"] : ""
                            }
                            
                            approveConnection(address)}}
                        buttontext={LanguageManager.walletConnection.connect} />
                </View>
            </BackgroundImage>
        </Modal>
    )
}

export default NewConnection