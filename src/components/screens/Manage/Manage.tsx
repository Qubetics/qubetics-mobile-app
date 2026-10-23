import { useState, useEffect } from 'react';
import styles from './ManageStyle';
import { View, Image, Text, TouchableOpacity, Platform } from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import { Colors } from '../../../theme';
import { Button, HeaderMain, LoaderView } from '../../common';
import { Actions } from '../../../navigation/RootNavigation';
import { ThemeManager } from '../../../../ThemeManager';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { ScaleDecorator, NestableScrollContainer, NestableDraggableFlatList } from 'react-native-draggable-flatlist';
import { sortManageWallet } from '../../../Redux/Actions/WalletAction';
import { bigNumberSafeMath, CommaSeprator1, toFixedExp } from '../../../Utils/MethodsUtils';
import { LanguageManager } from '../../../../LanguageManager';
import {
  requestCoinList,
} from "../../../Redux/Actions";
import { useDispatch } from 'react-redux';

import {
  getDimensionPercentage as dimen,
  heightDimen,
} from "../../../Utils";
import Singleton from '../../../Singleton';

const Manage = (props: any) => {
  const { walletMain, manage } = LanguageManager;
  const [newCoinList, setNewCoinList] = useState<any[]>([]);
  const [coinList, setCoinlist] = useState<any[]>([]);
  const [isLoading, setisLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [totalRecords, settotalRecords] = useState(50);
  const dispatch = useDispatch();

  useEffect(() => {
    getSearchList(false, page);
  }, []);

  const getSearchList = (fromPagination: any, pgNum: any) => {
    let data = {
      search: '',
      page: pgNum,
      limit: 25,
    };
    fetchList(data, fromPagination);
  }

  const fetchList = (data1: any, fromPagination: any) => {
    setisLoading(true)

    setTimeout(() => {
      (dispatch as any)(requestCoinList({ data1 }))
        .then((response: any) => {
          if (response.data.length > 0) {
            settotalRecords(response?.meta?.total)
            const newCoinList = fromPagination ? [...coinList, ...response.data] : response.data;
            setCoinlist(Array.from(new Set(newCoinList.map((coin: any) => coin.coin_id))).map(id => newCoinList.find((coin: any) => coin.coin_id === id)));
          } else {
            setCoinlist(fromPagination ? coinList : [])
          }
          setisLoading(false)
        })
        .catch((err: any) => {
          setisLoading(false)
        });
    }, 150);
  }

  const updateList = () => {
    setisLoading(true);
    props.sortManageWallet({ data: newCoinList }).then((e: any) => {
      setisLoading(false);
      (Actions as any).pop();
    }).catch((e: any) => {
      setisLoading(false);
      Singleton.getInstance().showToast?.show(e || "Something went wrong", 2000);
    })
  };

  const onDragEnd = (data: any) => {
    setCoinlist(data);
    let temp = [];
    temp = data.map((item: any, index: any) => {
      return { coin_id: item.coin_id, order: index + 1, wallet_address: item.wallet_address };
    });
    setNewCoinList(temp);
  };

  const renderItem = ({ item, getIndex, drag, isActive }: {item: any; getIndex: any; drag: any; isActive: any}) => {
    return (
      <ScaleDecorator>
        <View
          style={{
            width: '100%',
            alignItems: "center",
            flexDirection: 'row',
            backgroundColor: ThemeManager.colors.mnemonicsBg,
            marginBottom: heightDimen(10),
            borderRadius: dimen(14),
          }}
        >
          <TouchableOpacity
            disabled={isActive}
            onLongPress={drag}
            delayLongPress={200}
            style={styles.ViewStyle}>
            <View style={styles.coinImageWrap}>
              {item?.coin_image ? (<Image style={[styles.imgCoin, { borderRadius: 30, resizeMode: 'cover', backgroundColor: ThemeManager.colors.legalBg }]} source={{ uri: item?.coin_image }} />)
                : (
                  <View style={[styles.ViewStyle2, { backgroundColor: ThemeManager.colors.legalBg }]}>
                    <Text allowFontScaling={false} style={{ color: ThemeManager.colors.Text }}>{item?.coin_name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                )}
            </View>
            <View style={[styles.ViewStyle3]}>
              <View style={styles.ViewStyle1}>
                <Text numberOfLines={1} allowFontScaling={false} style={[styles.txtCoin, { color: ThemeManager.colors.blackWhiteText }]}>
                  {item?.coin_name?.toString().length > 12 ? item?.coin_name?.substring(0, 10) + '...' : item.coin_name}
                  {(item.is_token == 1 || item.coin_family == 1) && (<Text allowFontScaling={false} style={[styles.titleTextStyle, { color: ThemeManager.colors.blackWhiteText, fontSize: dimen(14) }]}>{item.coin_family == 1 ? ' (BEP-20)' : item.coin_family == 2 ? ' (ERC-20)' : item.coin_family == 4 ? ' (POL ERC-20)' : item.coin_family == 5 ? ' (SPL)' : item.coin_family == 6 ? ' (TRC-20)' : item.coin_family == 7 ? ' TICS' : ''}</Text>)}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  <Text allowFontScaling={false} style={[styles.txtValue, { color: ThemeManager.colors.placeholderBg }]}>{Singleton.getInstance().CurrencySymbol}{parseFloat(item?.currentPriceInMarket) > 0 ? CommaSeprator1(parseFloat(item?.currentPriceInMarket), 2) : '0.00'}</Text>
                  {item?.price_change_percentage_24h?.toString().includes('-') ? (
                    <View style={styles.viewStyle22}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.precentText, { color: Colors.lossColor, },
                        ]}
                      >{'-'}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.titleTextStyleNew, { color: Colors.lossColor, paddingLeft: 2 }]}>{item?.price_change_percentage_24h ? item?.price_change_percentage_24h.toFixed(2).toString().replace(/[-]/g, '') : 0.0}%</Text>
                    </View>
                  ) : (
                    <View style={styles.viewStyle22}>
                      <Text
                        allowFontScaling={false}
                        style={[{
                          color: Colors.profitColor,
                          marginBottom: Platform.OS == 'ios' ? 3 : 0
                        },
                        ]}
                      >{'+'}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.titleTextStyleNew, { color: Colors.profitColor }]}>{item?.price_change_percentage_24h ? (item?.price_change_percentage_24h).toFixed(2) : 0.0}%</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.balanceWrap}>
              <Text
                numberOfLines={1}
                style={[styles.txtCoin, { color: ThemeManager.colors.blackWhiteText, fontSize: 14 }]}>
                {toFixedExp(item?.balance, 4)} {item?.coin_symbol?.toUpperCase()}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.txtValue, { color: ThemeManager.colors.placeholderBg, alignSelf: 'flex-end' }]}>
                {Singleton.getInstance().CurrencySymbol}{toFixedExp(bigNumberSafeMath(item?.balance, "*", item?.coin?.fiat_price_data?.value || 0), 2)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  const isCloseToBottom = async () => {
    let pgNum = page + 1;
    if (coinList.length < totalRecords) {
      setPage(pgNum)
      getSearchList(true, pgNum)
    }
  }

  return (
    <BackgroundImage
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      source={ThemeManager.ImageIcons.mainBgImgNew}
    >
      <HeaderMain
        BackButtonText={"Re-Order Assets"} />
      <GestureHandlerRootView style={[styles.container]}>
        <View style={styles.container2}>
          <View style={[styles.container, { paddingBottom: dimen(10) }]}>
            {coinList.length > 0 ? (
              <NestableScrollContainer style={{ flex: 1 }}>
                <NestableDraggableFlatList
                  autoscrollSpeed={2000}
                  data={coinList}
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  renderItem={renderItem}
                  dragItemOverflow={true}
                  onDragEnd={({ data }) => { onDragEnd(data) }}
                  keyExtractor={(item, index) => item.coin_id}
                  onEndReachedThreshold={0.1}
                  onEndReached={() => {
                    isCloseToBottom()
                  }}
                />
              </NestableScrollContainer>
            ) : (
              <View style={styles.container3}>
                <Text allowFontScaling={false} style={[styles.noAsset, { color: ThemeManager.colors.grayTextColor }]}>{isLoading ? "" : walletMain.noassetsfound}</Text>
              </View>
            )}

          </View>
          <View style={{ marginBottom: dimen(52), marginTop: dimen(20) }}>
            {coinList.length > 0 ? (
              <Button
                disabled={Singleton.getInstance().isMakerWallet}
                onPress={() => { updateList() }}
                buttontext={manage.updateList}
                btnstyle={styles.update}
              />
            ) : null}
          </View>
        </View>
      </GestureHandlerRootView>
      {isLoading && <LoaderView isLoading={isLoading} />}
    </BackgroundImage>
  );
};

const mapStateToProp = (state: any) => {
  const { coinList } = state.walletReducer;
  return { coinList };
};
export default connect(mapStateToProp, { sortManageWallet })(Manage);
