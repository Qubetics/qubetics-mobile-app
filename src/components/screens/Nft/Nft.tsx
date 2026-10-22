import {useState, useEffect} from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import {ThemeManager} from '../../../../ThemeManager';
import {Button, HeaderMain, LoaderView} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {Fonts, Images} from '../../../theme';
import styles from './Nftstyle';
import {dimen, hasNotchWithIOS} from '../../../Utils';
import { Actions } from '../../../navigation/RootNavigation';
import Singleton from '../../../Singleton';
import {getNFtList} from '../../../Redux/Actions';
import {useDispatch} from 'react-redux';
import {SvgUri} from 'react-native-svg';
import {consoleLogFunc} from '../../../Utils/MethodsUtils';
import images from '../../../theme/Images';
import FastImage from 'react-native-fast-image';

const Nft = () => {
  const dispatch = useDispatch<any>();
  const [, setIsNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nftList, setNFTList] = useState<any[]>([]);

  useEffect(() => {
    const data = {
      limit: 50,
      address_list: [
        {
          coin_symbol: 'eth',
          wallet_address: Singleton.getInstance().defaultEthAddress,
          coin_family: 2,
        },
        {
          coin_symbol: 'tics',
          wallet_address: Singleton.getInstance().defaultEthAddress,
          coin_family: 7,
        },
      ],
    };

    dispatch(getNFtList(data))
      .then((res: any) => {
        consoleLogFunc('NFT>>>>>', JSON.stringify(res));
        setNFTList([...res?.data]);
        setIsLoading(false);
      })
      .catch((error: any) => {
        setIsLoading(false);
        consoleLogFunc(error);
      });
  }, []);

  const notiPressed = () => {
    Singleton.isNotification = false;
    setIsNotification(false);
    if (Actions.currentScene !== 'NotificationsTab') {
      (Actions as any).NotificationsTab();
    }
  };

  const renderItem = ({item}: {item: any}) => (
    <View style={{width: '50%',}}>
    <TouchableOpacity
      style={{margin: 10}}
      onPress={() => {
        if (Actions.currentScene !== 'NftDetails') {
          (Actions as any).NftDetails({nftData: item});
        }
      }}>
      {item?.image?.includes('.svg') ? (
        <SvgUri style={styles.image} uri={item.image} />
      ) : item?.image == null ? (
        <Image
          // BUG PRESERVED: images.nftPlaceholder does not exist in theme Images (undefined)
          source={(images as any).nftPlaceholder}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <FastImage
          // BUG PRESERVED: resizeMode is not a FastImage prop in its types (style.resizeMode is used)
{...({ resizeMode: FastImage.resizeMode.cover } as any)}
          source={{uri: item.image}}
          style={styles.image as any}
        />
      )}
      <View style={styles.card}>
        <Text
          numberOfLines={1}
          ellipsizeMode='middle'
          style={[
            styles.title,
            {
              fontFamily: Fonts.dmMedium,
              color: ThemeManager.colors.blackWhiteText,
            },
          ]}>
          {item.name}
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}}>
          <Text
            style={[
              styles.nftId,
              {
                fontFamily: Fonts.dmRegular,
                color: ThemeManager.colors.blackWhiteText,
              },
            ]}>
            {item.token_id}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
  
            <Text
              style={[
                styles.price,
                {
                  fontFamily: Fonts.dmRegular,
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}>
              {item.amount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </View>
  );

  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={{flex: 1}}>
        <HeaderMain
          BackButtonText={LanguageManager.nftData.Nfts}
          imgSecond={Singleton.isNotification ? Images.notiDot : Images.noti}
          // BUG PRESERVED: ThemeManager.ImageIcons.supportIcon missing from one theme icon set
          imgNew={(ThemeManager.ImageIcons as any).supportIcon}
          imgSecondStyle={styles.imgSecond}
          imgStyle1={styles.imgNew}
          onPressIcon={notiPressed}
        />
        <View style={{height: '75%', paddingHorizontal: 10,}}>
          <FlatList
            data={nftList}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            numColumns={2}
            ListEmptyComponent={() => {
              return (
                <View
                  style={{
                    marginTop: '60%',
                    justifyContent: 'center',
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.transactionHistoryTitle,
                      {
                        color: ThemeManager.colors.blackWhiteText,
                        alignSelf: 'center',
                      },
                    ]}>
                    {isLoading ? '' : LanguageManager.nftData.noNftFound}
                  </Text>
                </View>
              );
            }}
          />
        </View>
        <View
          style={{
            marginHorizontal: 24,
            marginBottom: hasNotchWithIOS() ? dimen(52) : dimen(30),
          }}>
          <Button
            onPress={() => {
              const selectedCoin = {
                coin_family: 7,
                is_token: 1,
                coin_symbol: 'tics',
              };
              if (Actions.currentScene !== 'Receive') {
                (Actions as any).Receive({
                  selectedCoin: selectedCoin,
                  isFromNft: true,
                });
              }
            }}
            customStyle={{marginTop: 20}}
            buttontext={LanguageManager.walletMain.receive}
          />
        </View>
      </View>
      <LoaderView isLoading={isLoading} />
    </BackgroundImage>
  );
};

export default Nft;