import { StyleSheet } from "react-native";
import BackgroundImage from "./BackgroundImage";
import { LanguageManager } from '../../../LanguageManager'
import { ThemeManager } from '../../../ThemeManager'
import { heightDimen, widthDimen } from '../../Utils'
import CommonRowTyped from './CommonRow'

const CommonRow: any = CommonRowTyped;

const CardItem = ({contactAddress,ownerAddress,tokenID,tokenStandard,Quantity}: {contactAddress: any; ownerAddress: any; tokenID: any; tokenStandard: any; Quantity: any}) => {
  return (
    <BackgroundImage source={ThemeManager.ImageIcons.homeSubBg} style={[styles.ViewStyle1,]}>
    <CommonRow label={LanguageManager.nftData.contractAddress} value={contactAddress} />
    <CommonRow label={LanguageManager.nftData.ownerAddress} value={ownerAddress} />
    <CommonRow label={LanguageManager.nftData.tokenID} value={tokenID} />
    <CommonRow label={LanguageManager.nftData.tokenStandard} value={tokenStandard} />
    <CommonRow label={LanguageManager.nftData.Quantity} value={Quantity} />
</BackgroundImage>
  )
}

export default CardItem

const styles = StyleSheet.create({
    ViewStyle1:{
        width:widthDimen(382),
        alignSelf:"center",
        borderRadius:14,
        marginTop:heightDimen(20)
      },
    
})