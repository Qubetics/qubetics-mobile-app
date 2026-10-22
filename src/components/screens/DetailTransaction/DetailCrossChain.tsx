import { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
  BackHandler,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import DropShadow from 'react-native-drop-shadow';
import styles from './DetailTransactionStyle';
import { ThemeManager } from '../../../../ThemeManager';
import { Colors } from '../../../theme';
import moment from 'moment';
import { HeaderMain, LoaderView } from '../../common';
import { useDispatch } from 'react-redux';
import { getOrderState } from '../../../Redux/Actions';
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from '../../../../LanguageManager';
import { widthDimen } from '../../../Utils';
import Singleton from '../../../Singleton';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';

const DetailCrossChain = (props: any) => {
  const { browser, detailTrx } = LanguageManager;
  const dispatch = useDispatch<any>();
  const [item] = useState(props.item);
  const [orderData, setOrderData] = useState<any>('');
  const [isLoading, setIsLoading] = useState(false);

  /******************************************************************************************/
  useEffect(() => {
    fetchOrderDetail();
    props.navigation.addListener('focus', () => {

      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    props.navigation.addListener('blur', () => {
      // BUG PRESERVED: BackHandler.removeEventListener was removed from RN; this throws TypeError on cleanup (use the subscription.remove() returned by addEventListener)
      (BackHandler as any)?.removeEventListener('hardwareBackPress', handleBackButtonClick);
    });
  }, []);

  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc('Backhandler crosschain detail');
    (Actions as any).pop('');
    return true;
  };

  /******************************************************************************************/
  const fetchOrderDetail = () => {
    setIsLoading(true);
    setTimeout(() => {
      const order_id = item?.order_id;
      consoleLogFunc("ORDER_ID>>", order_id);

      dispatch(getOrderState(order_id)).then((res: any) => {
        consoleLogFunc('chk res::::::getOrderState', res);
        setOrderData(res?.data);
        setIsLoading(false);
      }).catch((err: any) => {
        consoleLogFunc('chk err::::::getOrderState', err);
        setIsLoading(false);
      });
    }, 100);
  };

  /******************************************************************************************/
  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>

      <HeaderMain
        BackButtonText={detailTrx.transactionDetails}

      />
      <TouchableOpacity
        onPress={() => Linking.openURL(orderData?.depositHashExplore)}
        activeOpacity={0.7}
        style={{ marginTop: 10, marginHorizontal: widthDimen(10), backgroundColor: ThemeManager.colors.mnemonicsBg, borderRadius: 14 }}>


        <DropShadow style={styles.ViewStyle}>
          <View style={[styles.listStyle, {
            padding: widthDimen(10),
            borderColor: ThemeManager.colors.borderColor
          }]}>
            <View style={[styles.ViewStyle1, { borderColor: ThemeManager.colors.borderColor }]}>

              <View style={styles.ViewStyle2}>
                <View style={{ ...styles.ViewStyle4, backgroundColor: ThemeManager.colors.transactionIconBg, }}>
                  <Image style={{ alignSelf: 'center', }} source={(Singleton.getInstance() as any).getStatusImage(item)} />
                </View>
                <View style={{ paddingLeft: 8 }}>
                  <Text allowFontScaling={false} style={[styles.fromValueStyle, { color: ThemeManager.colors.blackWhiteText }]}>{detailTrx.crossChainSwap}</Text>
                  <Text allowFontScaling={false} style={[styles.transtimeStyle, { color: ThemeManager.colors.legalGreyColor, marginTop: -5 }]}>{moment(item.created_at).format('ll')} |{' '}{moment(item.created_at).format('LT')}</Text>
                </View>
              </View>
            {orderData && <View style={{ width: '25%', alignItems: 'flex-end' }}>
                <Text allowFontScaling={false} style={[styles.transStatusStyle, { textAlign: 'center', marginTop: 10, color: orderData?.transactionId?.length > 0 ? Colors.successColor : 'rgba(211, 155, 73, 1)' }]}>{orderData?.transactionId?.length > 0 ? detailTrx.completed : detailTrx.pending}</Text>
              </View>}
              
            </View>

            <Text allowFontScaling={false} style={[styles.fromAddressStyle, { color: ThemeManager.colors.legalGreyColor }]}>{browser.From} :{' '}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.fromAddressStyleNew, { color: ThemeManager.colors.blackWhiteText }]}>{item.from_adrs}</Text>
            <Text allowFontScaling={false} style={[styles.fromAddressStyle, { color: ThemeManager.colors.legalGreyColor, marginTop: 10 }]}>{browser.to} :{' '}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.fromAddressStyleNew, { color: ThemeManager.colors.blackWhiteText }]}>{item.to_adrs}</Text>

            <View style={{ flexDirection: 'row', marginTop: 5 }}></View>
          </View>
        </DropShadow>

      </TouchableOpacity>

      <LoaderView isLoading={isLoading} />
    </BackgroundImage>
  );
};

export default DetailCrossChain;
