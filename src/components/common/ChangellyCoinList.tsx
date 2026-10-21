import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useDispatch } from "react-redux";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import { getCrossChainCoinList } from "../../Redux/Actions";
import Singleton from "../../Singleton";
import { Fonts } from "../../theme/";
import {
  heightDimen
} from "../../Utils";
import { bigNumberSafeMath, consoleLogFunc, toFixedExp } from "../../Utils/MethodsUtils";
import { HeaderMain } from "./HeaderMain";
import { LoaderView } from "./LoaderView";
import { SearchToken } from "./SearchToken";

const listData = [
  { title: "All" },
  { title: "BTC", coinFamily: 3, },
  { title: "ETH", coinFamily: 2, },
  { title: "BNB", coinFamily: 1, },
  { title: "POL", coinFamily: 4 },
  { title: 'SOL', coinFamily: 5 },
  {
    title: "TRX", coinFamily: 6,
  },
  {
    title: "TICS", coinFamily: 7,
  },
];

export const ChangellyCoinList = (props: any) => {
  const dispatch: any = useDispatch()
  const [selectedListIndex, setSelectedListIndex] = useState(0);
  const { commonText } = LanguageManager;
  const [coinList, setCoinList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [coinFamily, setCoinFamily] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");

  const searchRef = useRef<any>(null)

  //******************************************************************************************/
  useEffect(() => {
    getCoinsApiData()
  }, []);

  const getCoinsApiData = async (page = 1, coinFamily?: any, search = "") => {
    let apiData: any = {
      "page": page,
      "per_page": 20,
      "addresses": [
        Singleton.getInstance().defaultEthAddress,
        Singleton.getInstance().defaultBtcAddress,
        Singleton.getInstance().defaultTrxAddress,
        Singleton.getInstance().defaultSolAddress,
      ],
      "is_wallet": props?.isFrom,
      "fiat_type": Singleton.getInstance().CurrencySelected
    };
    if (coinFamily) {
      apiData = { ...apiData, coin_family: coinFamily }
    }
    if (search != "") {
      apiData = { ...apiData, search: search }
    }

    consoleLogFunc("apiData>>>>", apiData);

    setLoading(true);
    dispatch(getCrossChainCoinList(apiData))
      .then((res: any) => {
        consoleLogFunc("ress>>>>>", res);
        const newData = Array.isArray(res?.data) ? res.data : [];
        setCoinList(page == 1 ? newData : [...coinList, ...newData]);
        setTotalPages(res?.meta?.pages || 1);
        setPage(page);
        setCoinFamily(coinFamily);
        setLoading(false);
      })
      .catch((err: any) => {
        setLoading(false);
        if (page === 1) setCoinList([]);
      })
  };

  //******************************************************************************************/
  const filterFirstList = (value: any, index: any) => {
    consoleLogFunc("value>>>", value);
    consoleLogFunc("index>>>", index);
    setSearchText("");
    setCoinList([]);
    setSelectedListIndex(index);
    getCoinsApiData(1, value);
  }
  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={props.openModel}
      onRequestClose={props.handleBack || props.onPressIn}
    >

      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{
          flex: 1,
          backgroundColor: ThemeManager.colors.mainBgNew,
        }}
      >
        <View style={{ flex: 1 }}>
          <HeaderMain inModal
            backCallBack={props.handleBack}
            BackButtonText={props.title ? props.title : commonText.ChooseAsset}
          />

          <View>
            <ScrollView
              showsHorizontalScrollIndicator={false}
              horizontal
              style={{ marginHorizontal: 15 }}
            >
              {listData.map((item, index) => {
                const isSelected = selectedListIndex == index;
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.tabsViewNew,
                      {
                        marginRight: 18,
                      },
                    ]}
                    onPress={() => filterFirstList(item?.coinFamily, index)}
                  >
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      colors={["#73C9E2", "#6C8DC5", "#6456B2", "#6145EA"]}
                      style={[styles.tabViewNew1, { justifyContent: 'center', alignItems: 'center' }]}
                    >
                      <View style={{
                        position: 'absolute',
                        top: 1,
                        left: 1,
                        right: 1,
                        bottom: 1,
                        backgroundColor: ThemeManager.colors.mainBgNew,
                        borderRadius: 12,
                        opacity: isSelected ? 0 : 1,
                      }} />
                      <Text
                        allowFontScaling={false}
                        style={{
                          color: isSelected
                            ? ThemeManager.colors.Mainbg
                            : ThemeManager.colors.lightGrayTextColor,
                          fontSize: 16,
                          fontFamily: Fonts.dmMedium,
                        }}
                      >
                        {item.title}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ marginHorizontal: 10 }}>
            <SearchToken
              isIconsShow={false}
              value={searchText}
              onSubmitEditing={() => {
                getCoinsApiData(1, coinFamily, searchText)
              }}
              onChangeText={(text: any) => {
                setSearchText(text)
                clearTimeout(searchRef.current)
                searchRef.current = setTimeout(() => {
                  getCoinsApiData(1, coinFamily, text)

                }, 1000);
              }}
              inputProps={{
                autoCorrect: false,
              }}
            />
          </View>
          <View style={{ flex: 1, marginTop: 15 }}>
            <FlatList
              key={`coinlist_${selectedListIndex}`}
              bounces={false}
              removeClippedSubviews={false}
              keyExtractor={(item, index) => item?.coinCode || item?.id || index.toString()}
              onScroll={props.onScroll}
              showsVerticalScrollIndicator={false}
              data={coinList}
              style={{ marginBottom: heightDimen(20) }}
              ListEmptyComponent={() => {
                return (
                  <View style={[styles.emptyView1, , props.noStyle]}>
                    <Text
                      allowFontScaling={false}
                      style={[
                        {
                          ...styles.textStyle,
                          color: ThemeManager.colors.blackWhiteText,
                        },
                      ]}
                    >
                      {isLoading ? "" : "No asset found"}
                    </Text>
                  </View>
                );
              }}
              renderItem={({ item, index }) => {
                return (
                  <CrossChainItem
                    disabled={false}
                    onPress={() => {
                      if (props?.selectedCoin?.coinCode == item?.coinCode) {
                        props.onSamePair()
                      } else {
                        props.onPress(item)
                      }
                    }}
                    item={item}
                    index={index}
                    key={item?.id}
                  />
                );
              }}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (page < totalPages && !isLoading) {
                  getCoinsApiData(page + 1, coinFamily, searchText)
                }
              }}

            />
          </View>
        </View>
        <LoaderView isLoading={isLoading} />
      </ImageBackground>
    </Modal>
  );
};

const getCoinName = (item: any) => {
  const target = Constants.AssetList.find((val) => val.coin_family == item.coinFamily);
  if (target) {
    return target.coin_symbol.toUpperCase();
  }
  return "";
};

const CrossChainItem = (props: any) => {
  const { item, index } = props;
  const data = item?.coin_data;
  /******************************************************************************************/

  return (
    <View
      style={{
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
        marginHorizontal: 15,
        padding: 5,
        backgroundColor: ThemeManager.colors.mnemonicsBg
      }}
    >
      <TouchableOpacity
        key={data?.id || index}
        onPress={() => {
          props.onPress(index);
        }}
        disabled={props.disabled}
      >
        <View style={[styles.tokenItem, { flex: 1 }]}>
          <View style={[styles.tokenItem_first, { flex: 1 }]}>
            {(data?.coin_image == null || data?.coin_image == "null" || data?.coin_image == "") ? (
              <View
                style={[
                  styles.tokenImage_stylee,
                  { backgroundColor: ThemeManager.colors.mnemonicsBorder },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.tokenAbr_stylee,
                    { color: ThemeManager.colors.blackWhiteText },
                  ]}
                >
                  {data?.coin_name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            ) : (
              <View
                style={{ justifyContent: "center", alignContent: "center" }}
              >
                <Image style={styles.icon} source={{ uri: data?.coin_image }} />
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1
              }}
            >
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.tokenAbr_style,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {data?.coin_name}
                {data?.is_token == 1 && (
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.tokenAbr_style,
                      { color: "#A1A1A1", fontSize: 11, marginLeft: 0 },
                    ]}
                  >
                    {(data.coin_family == 1)
                      ? " (BEP-20)"
                      : data.coin_family == 2
                        ? " (ERC-20)"
                        : data.coin_family == 4
                          ? " (POL ERC-20)"
                          : data.coin_family == 5
                            ? " (SPL)"
                            : data.coin_family == 6
                              ? " (TRC-20)"
                              : data.coin_family == 7
                                ? " TICS"
                                : ""}
                  </Text>
                )}
              </Text>

            </View>
          </View>
          {item?.wallet_data?.balance ? <View style={{ flex: .4 }}>
            <Text
              allowFontScaling={false}
              style={[
                styles.tokenAbr_style,
                {
                  fontSize: 12,
                  fontFamily: Fonts.dmRegular,
                  color: ThemeManager.colors.blackWhiteText,
                  textAlign: 'right',
                },
              ]}
            >
              {Singleton.getInstance().isHideBalance ? "*****" : toFixedExp(item?.wallet_data?.balance, item?.wallet_data?.balance > 1 ? 2 : 4)} {!!data?.isToken ? data.name?.toUpperCase() : getCoinName(data)}
            </Text>
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              style={[
                styles.tokenAbr_style,
                {
                  fontSize: 12,
                  fontFamily: Fonts.dmRegular,
                  color: ThemeManager.colors.blackWhiteText,
                  textAlign: 'right',
                  marginTop: 5
                },
              ]}
            >
              {Singleton.getInstance().CurrencySymbol}{(Singleton.getInstance().isHideBalance ? "*****" : toFixedExp(bigNumberSafeMath(item?.wallet_data?.balance, "*", item?.fiat_price_data?.value), 2))}
            </Text>
          </View> : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  emptyView1: {
    alignSelf: "center",
    marginTop: "50%",
  },
  tokenImage_stylee: {
    alignSelf: "center",
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  tokenAbr_stylee: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  textStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },

  //*************************************** STYLES OFRENDER ITEM OF LIST ***************************************/
  tokenItem: {
    alignItems: "center",
    marginHorizontal: 15,
    flexDirection: "row",
    paddingVertical: 8,
  },
  tokenItem_first: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  // BUG PRESERVED: duplicate key tokenImage_stylee (later one wins)
  // @ts-ignore
  tokenImage_stylee: {
    alignSelf: "center",
    width: 33,
    height: 33,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: "#B9CADB",
    //
  },
  // BUG PRESERVED: duplicate key tokenAbr_stylee (later one wins)
  // @ts-ignore
  tokenAbr_stylee: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
    textAlign: "center",
  },
  tokenAbr_style: {
    fontFamily: Fonts.dmMedium,
    fontSize: 16,
    color: ThemeManager.colors.whiteText,
    marginRight: 5,
    marginLeft: 10,
  },
  icon: {
    width: 33,
    height: 33,
    borderRadius: 30,
  },
  tabsViewNew: {
    paddingVertical: 10,
    width: 60,
    borderRadius: 14,
  },
  tabViewNew1: {
    borderRadius: 12,
    height: 40,
    alignItems: "center",
    justifyContent: "center",

  },
});
