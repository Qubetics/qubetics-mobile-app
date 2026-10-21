/* eslint-disable react-native/no-inline-styles */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Actions } from '../../navigation/RootNavigation';
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import {
  horizontalScale,
  verticalScale
} from "../../layouts/responsive";
import { Colors, Fonts } from "../../theme";
import fonts from "../../theme/Fonts";
import { dynamicFontNew, heightDimen } from "../../Utils";
import {
  CommaSeprator1,
  consoleLogFunc,
  toFixedExp,
} from "../../Utils/MethodsUtils";
import { EventRegister } from "react-native-event-listeners";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { getDimensionPercentage as dimen } from "../../Utils";
import { CosmoModalSend } from "./CosmoModalSend";
import { GradientBorderView as GradientBorderViewTyped } from "./GradientBorderView";

const GradientBorderView: any = GradientBorderViewTyped;

//******************************************************************************************/
const pressItem = (
  item: any,
  showTransactionHistory: any,
  themeSelected: any,
  selectCoin: any,
  updateSelectedCoin: any,
  action_type: any,
  tabType: any,
  setIsCosmosModal: any,       // <-- add this
  setSelectedCoin: any
) => {

  if (showTransactionHistory == "true") {
    return (
      Actions.currentScene != "TransactionHistory" &&
      (Actions as any).TransactionHistory({
        selectedCoin: item,
        themeSelected: themeSelected,
      })
    );
  }
  if (selectCoin) {
    return updateSelectedCoin(item);
  }
  if (action_type == "send") {
    if (item.coin_family == 1 || item.coin_family == 4 || item.coin_family == 7) {
      if (item.coin_family === 7) {
        setSelectedCoin(item);        // set selected coin
        setIsCosmosModal(true);       // open modal
        return;
      }
      else {
        Actions.currentScene != "SendBnbPol" &&
          (Actions as any).SendBnbPol({
            selectedCoin: item,
            tabType: tabType,
            themeSelected: themeSelected,
          });
      }

    }

    else if (item.coin_family == 2)
      Actions.currentScene != "Send" &&
        (Actions as any).Send({
          selectedCoin: item,
          tabType: tabType,
          themeSelected: themeSelected,
        });
    else if (item.coin_family == 3)
      Actions.currentScene != "SendBtc" &&
        (Actions as any).SendBtc({
          selectedCoin: item,
          tabType: tabType,
          themeSelected: themeSelected,
        });
    else if (item.coin_family == 5)
      Actions.currentScene != "SendSol" &&
        (Actions as any).SendSol({
          selectedCoin: item,
          tabType: tabType,
          themeSelected: themeSelected,
        });
    else if (item.coin_family == 6)
      Actions.currentScene != "SendTrx" &&
        (Actions as any).SendTrx({
          selectedCoin: item,
          tabType: tabType,
          themeSelected: themeSelected,
        });
  } else {
    Actions.currentScene != "Receive" &&
      (Actions as any).Receive({
        selectedCoin: item,
        tabType: tabType,
        themeSelected: themeSelected,
      });
  }
};

//******************************************************************************************/
const getValue = (bal: any) => {
  if (bal > 0) {
    const NewBal =
      bal < 0.000001
        ? toFixedExp(bal, 8)
        : bal < 0.0001
          ? toFixedExp(bal, 6)
          : toFixedExp(bal, 4);
    return NewBal;
  } else return "0.0000";
};

//******************************************************************************************/
const getFiatValue = (bal: any) => {
  if (bal > 0) {
    const NewBal =
      bal < 0.000001
        ? toFixedExp(bal, 8)
        : bal < 0.0001
          ? toFixedExp(bal, 6)
          : toFixedExp(bal, 2);
    return NewBal;
  } else return "0.00";
};

//******************************************************************************************/
const Item = ({
  hideGraph,
  item,
  tabType,
  index,
  showTransactionHistory,
  selectCoin,
  updateSelectedCoin,
  action_type,
  themeSelected,
  isHideBalance,
  setIsCosmosModal,
  setSelectedCoin
}: any) => {
  return (
    <TouchableOpacity
      onPress={() =>
        pressItem(
          item,
          showTransactionHistory,
          themeSelected,
          selectCoin,
          updateSelectedCoin,
          action_type,
          tabType,
          setIsCosmosModal,
          setSelectedCoin
        )
      }
    >
      <View>
        <View style={styles.viewStyle}>
          <View style={styles.viewStyle3}>
            {item.coin_image ? (
              <Image
                style={[styles.imgStyle]}
                source={{ uri: item.coin_image }}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.imgViewStyle,
                  { backgroundColor: ThemeManager.colors.placeholderColorNew },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    color: ThemeManager.colors.primaryColor,
                    fontSize: heightDimen(22),
                  }}
                >
                  {item?.coin_name?.charAt(0)}
                </Text>
              </View>
            )}

            <View style={{ paddingLeft: 8, justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[
                    styles.titleTextStyle,
                    {
                      overflow: "hidden",
                      color: ThemeManager.colors.blackWhiteText,
                    },
                  ]}
                >
                  {hideGraph
                    ? item.is_token == 1
                      ? item?.coin_name?.toString().length > 8
                        ? item?.coin_name?.substring(0, 7) + "..."
                        : item.coin_name
                      : item?.coin_name?.toString().length > 8
                        ? item?.coin_name?.substring(0, 7) + "..."
                        : item.coin_name
                    : item.coin_family == 4 && item.is_token == 1
                      ? item?.coin_name?.substring(0, 4) + "..."
                      : item?.coin_name?.toString().length > 8
                        ? item?.coin_name?.substring(0, 7) + "..."
                        : item.coin_name}
                </Text>
                {(item.is_token == 1 || item.coin_family == 1) && (
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.titleTextStyle,
                      {
                        color: ThemeManager.colors.blackWhiteText,
                        fontSize: dimen(14),
                      },
                    ]}
                  >
                    {item.coin_family == 1
                      ? " (BEP-20)"
                      : item.coin_family == 2
                        ? " (ERC-20)"
                        : item.coin_family == 4
                          ? " (POL ERC-20)"
                          : item.coin_family == 5
                            ? " (SPL)"
                            : item.coin_family == 6
                              ? " (TRC-20)"
                              : item.coin_family == 7
                                ? " (TICS)"
                                : ""}
                  </Text>
                )}
              </View>

              <View style={styles.viewStyle1}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.titleTextStyleNew,
                    { color: ThemeManager.colors.legalGreyColor },
                  ]}
                >
                  {Singleton.getInstance().CurrencySymbol}
                  {item?.currentPriceInMarket
                    ? CommaSeprator1(item?.currentPriceInMarket, 2)
                    : "0.00"}
                </Text>
                {item?.price_change_percentage_24h?.toString().includes("-") ? (
                  <View style={styles.viewStyle2}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.precentText, { color: Colors.lossColor }]}
                    >
                      {"-"}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.titleTextStyleNew,
                        { color: Colors.lossColor },
                      ]}
                    >
                      {item?.price_change_percentage_24h
                        ? item?.price_change_percentage_24h
                          .toFixed(2)
                          .toString()
                          .replace(/[-]/g, "")
                        : 0.0}
                      %
                    </Text>
                  </View>
                ) : (
                  <View style={styles.viewStyle2}>
                    <Text
                      allowFontScaling={false}
                      style={[
                        {
                          color: Colors.profitColor,
                          marginBottom: Platform.OS == "ios" ? 3 : 0,
                        },
                      ]}
                    >
                      {"+"}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.titleTextStyleNew,
                        { color: Colors.profitColor },
                      ]}
                    >
                      {item?.price_change_percentage_24h
                        ? (item?.price_change_percentage_24h).toFixed(2)
                        : 0.0}
                      %
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.viewStyle4}>
          </View>

          <View
            style={{
              width: hideGraph ? "38%" : "32%",
              alignItems: "flex-end",
              paddingRight: 8,
            }}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.cValueStyle,
                {
                  color: ThemeManager.colors.blackWhiteText,
                  fontSize: dynamicFontNew(String(getValue(item?.balance))),
                },
              ]}
            >
              {isHideBalance ? "*****" : getValue(item?.balance)}
            </Text>

            <Text
              allowFontScaling={false}
              style={[
                styles.cUSDStyle,
                {
                  color: ThemeManager.colors.legalGreyColor,
                },
              ]}
            >
              {Singleton.getInstance().CurrencySymbol}
              {isHideBalance ? "*****" : getFiatValue(item?.fiatBal)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

//******************************************************************************************/
const CoinList = ({
  onEndReached,
  hideGraph,
  coinList,
  tabType,
  searchTxt,
  showTransactionHistory,
  selectCoin,
  updateSelectedCoin,
  action_type,
  themeSelected,
  showBalance,
  showFooter,
  onAddressBookPress,
  isHideBalance,
  refreshControl,
  refScroll,
  onCosmosItemPress,
  isCosmosModalDown,
  paginationLoading
}: any) => {
  const [selectedId, setSelectedId] = useState(null);
  const [coinArr, setCoinArr] = useState<any[]>([]);
  const [filteredArr, setFilteredArr] = useState<any[]>([]);
  const [isCosmosModal, setIsCosmosModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  //******************************************************************************************/
  useEffect(() => {
    if (coinList && coinList.length > 0) {
      if (searchTxt) {
        const arr = coinArr;
        let filteredArray: any[] = [];
        arr.map((item) => {
          if (item?.coin_name?.toLowerCase().includes(searchTxt.toLowerCase()))
            filteredArray.push(item);
          return item;
        });
        setFilteredArr(filteredArray);
      } else setFilteredArr(coinList);
      setCoinArr(coinList);
    }
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setIsCosmosModal(false)
    });
  }, [coinList, searchTxt]);

  //******************************************************************************************/
  const renderItem = ({ item, index }: {item: any; index: any}) => {
    const { walletMain } = LanguageManager;
    if (
      selectCoin &&
      item.coin_family != 1 &&
      item.coin_family != 2 &&
      item.coin_family != 3 &&
      item.coin_family != 4 &&
      item.coin_family != 5 &&
      item.coin_family != 6 &&
      item.coin_family != 7
    )
      return null;
    return coinList ? (
      <View key={index + ""}>
        <LinearGradient
          colors={["#101010", "#101010", "#18171F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.6763, 0.95]}
          style={{
            flex: 1,
            marginHorizontal: 20,
            height: verticalScale(76),
            justifyContent: "center",
            marginTop: 10,
            borderRadius: 14,
          }}
        >
          <Item
            showTransactionHistory={showTransactionHistory}
            selectCoin={selectCoin}
            updateSelectedCoin={updateSelectedCoin}
            index={index}
            filteredArr={filteredArr}
            item={item}
            onPress={() => setSelectedId(item.id)}
            tabType={tabType}
            action_type={action_type}
            themeSelected={themeSelected}
            showBalance={showBalance}
            hideGraph={hideGraph}
            isHideBalance={isHideBalance}
            setIsCosmosModal={setIsCosmosModal}
            setSelectedCoin={setSelectedCoin}
          />
        </LinearGradient>
      </View>
    ) : (
      <View style={styles.ViewNew}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 18,
            fontFamily: fonts.dmMedium,
            color:
              themeSelected == 2
                ? ThemeManager.colors.subTextColor
                : ThemeManager.colors.TextColor,
          }}
        >
          {walletMain.Noasset}
        </Text>
      </View>
    );
  };

  return (
    <>

      <View style={[styles.container]}>
        <FlatList
          ref={refScroll}
          refreshControl={refreshControl}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          data={filteredArr}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item, index) => `key_${index}`}
          extraData={selectedId}
          ListFooterComponent={((item: any, index: any) => {
            return showFooter ? (
              <>
                {paginationLoading && <ActivityIndicator
                  style={{ marginTop: 10 }}
                  size="large" color={Colors.White} />}

                <TouchableOpacity
                  key={index + ""}
                  onPress={onAddressBookPress}
                  style={[styles.touchAbleStyle]}
                >

                  <GradientBorderView mainStyle={styles.copyButton}>
                    <Text
                      style={[
                        styles.copyButtonText,
                        {
                          color: ThemeManager.colors.blackWhiteText,
                          marginRight: dimen(8),
                        },
                      ]}
                    >
                      Add Custom Token
                    </Text>
                  </GradientBorderView>
                </TouchableOpacity>
              </>
            ) : null;
          }) as any}
        />

      </View>
      { }
      {isCosmosModal && <CosmoModalSend
        onPressIn={() =>
          setIsCosmosModal(false)
        }
        openModel={isCosmosModal}
        onPressItem={(item: any, index: any) => {
          consoleLogFunc('item---', item);
          if (onCosmosItemPress) {
            onCosmosItemPress(selectedCoin, item, index); // 👈 pass selectedCoin back
          }
          setIsCosmosModal(false)
        }}
      />}
    </>

  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  viewStyle4: {
    width: "19%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewStyle3: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
  },
  viewStyle2: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  touchAbleStyle: {
    marginVertical: 20,
    alignSelf: "center",
    height: dimen(45),
  },
  ViewNew: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  viewStyle1: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 0,
  },
  imgViewStyle: {
    height: 50,
    alignSelf: "center",
    width: 50,

    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderRadius: 25,
  },
  imgStyle: {
    height: dimen(50),
    alignSelf: "center",
    width: dimen(50),
    borderRadius: 25,
    resizeMode: "contain",
    marginLeft: 10,
  },
  viewStyle: {
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: horizontalScale(10),
  },
  container: {
    marginTop: Platform.OS == "android" ? 15 : 10,
  },
  titleTextStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(16),
    lineHeight: dimen(24),
    paddingRight: 5,
  },
  titleTextStyleNew: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
    paddingRight: 5,
  },
  precentText: {
    fontFamily: Fonts.dmRegular,
  },
  cValueStyle: {
    fontFamily: Fonts.dmSemiBold,
    color: ThemeManager.colors.whiteText,
    marginBottom: 6,
    textAlign: "right",
  },
  cUSDStyle: {
    color: "#FCFCFC",
    fontSize: 14,
    lineHeight: 19.88,
    fontFamily: Fonts.dmRegular,
    bottom: 6,
    textAlign: "right",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  copyButtonText: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(16),
    lineHeight: dimen(24),
    textAlign: "center",
  },
});

export { CoinList };
