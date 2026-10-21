import moment from "moment";
import { useEffect, useState } from "react";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { Colors, Fonts, Images } from "../../theme";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { moderateScale } from "../../layouts/responsive";
import fonts from "../../theme/Fonts";
import { getDimensionPercentage as dimen, getDimensionPercentage } from '../../Utils';
import {
  getData,
  getFirstDecimalNumber,
  toFixedExp
} from "../../Utils/MethodsUtils";
import { TICS_EXPLORER_URL_LINK } from "../../EndPoint";

//******************************************************************************************/
const Item = ({
  item,
  style,
  oddColor,
  selectedCoin,
  themeSelected,
  address,
  index,
}: any) => (
  <TouchableOpacity
    disabled={!item.tx_id ? true : false}
    activeOpacity={0.7}
    onPress={() => {
      if (item.coin_family == 2) {
        return Linking.openURL(
          Constants.network == "testnet"
            ? "https://goerli.etherscan.io/tx/" + item.tx_id
            : "https://etherscan.io/tx/" + item.tx_id
        );
      } else if (item.coin_family == 1) {
        return Linking.openURL(
          Constants.network == "testnet"
            ? "https://testnet.bscscan.com/tx/" + item.tx_id
            : "https://bscscan.com/tx/" + item.tx_id
        );
      } else if (item.coin_family == 3) {
        return Linking.openURL(
          Constants.network == "testnet"
            ? "https://live.blockcypher.com/btc-testnet/tx/" + item.tx_id
            : "https://live.blockcypher.com/btc/tx/" + item.tx_id
        );
      } else if (item.coin_family == 4) {
        return Linking.openURL(
          Constants.network == "testnet"
            ? "https://mumbai.polygonscan.com/tx/" + item.tx_id
            : "https://polygonscan.com/tx/" + item.tx_id
        );
      } else if (item.coin_family == 5) {
        return Linking.openURL("https://solscan.io/tx/" + item.tx_id);
      } else if (item.coin_family == 6) {
        return Linking.openURL(
          Constants.network == "testnet"
            ? "https://shasta.tronscan.org/#/transaction/" + item.tx_id
            : "https://tronscan.org/#/transaction/" + item.tx_id
        );
      } else if (item.coin_family == 7) {
        return Linking.openURL(TICS_EXPLORER_URL_LINK + item.tx_id);
      }
    }}
  >
    <View style={styles.ViewStyle3}>
      <View style={{ width: "10%", justifyContent: "center" }}>
        {item.type == "dapp" ? (
          <View
            style={{
              ...styles.ViewStyle4,
              backgroundColor: ThemeManager.colors.transactionIconBg,
            }}
          >
            <Image
              style={{
                alignSelf: "center",
                height: 20,
                width: 20,
                resizeMode: "contain",
                tintColor: ThemeManager.colors.blackWhiteText,
              }}
              source={Images.wallet_backup}
            />
          </View>
        ) : (
          <View
            style={{
              ...styles.ViewStyle4,
              backgroundColor: ThemeManager.colors.transactionIconBg,
            }}
          >
            <Image
              style={{ alignSelf: "center" }}
              source={Singleton.getInstance().getStatusImage(item, address)}
            />
          </View>
        )}
      </View>

      <View
        style={{ width: "42%", alignSelf: "flex-start", marginLeft: dimen(12) }}
      >
        {item.type == "dapp" ? (
          <Text
            allowFontScaling={false}
            style={[
              styles.transTypeStyle,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            {LanguageManager.commonText.SmartContractExecution}
          </Text>
        ) : item.type == "card_fees" ? (
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={[
              styles.transTypeStyle,
              {
                color: ThemeManager.colors.settingsText,
                textTransform: "capitalize",
              },
            ]}
          >
            {LanguageManager.detailTrx.cardFee}
          </Text>
        ) : item.type == "card_recharge" ? (
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={[
              styles.transTypeStyle,
              {
                color: ThemeManager.colors.settingsText,
                textTransform: "capitalize",
              },
            ]}
          >
            {LanguageManager.detailTrx.cardRecharge}
          </Text>
        ) : item.type == "level_upgradation_fee" ? (
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={[
              styles.transTypeStyle,
              {
                color: ThemeManager.colors.settingsText,
                textTransform: "capitalize",
              },
            ]}
          >
            {LanguageManager.referral.levelUpgrade +
              " (" +
              item?.referral_upgrade_level +
              ")"}
          </Text>
        ) : (
          <Text
            allowFontScaling={false}
            style={[
              styles.transTypeStyle,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            {item.is_approval == 1
              ? LanguageManager.swapText.approval
              : item?.type?.toLowerCase() == "withdraw" &&
                address?.toLowerCase() == item?.from_adrs?.toLowerCase()
                ? LanguageManager.detailTrx.Withdraw
                : item?.type?.toLowerCase() == "withdraw" &&
                  Singleton.getInstance().defaultCosmosAddress?.toLowerCase() == item?.from_adrs?.toLowerCase()
                  ? LanguageManager.detailTrx.Withdraw
                  : item?.type?.toLowerCase() == "withdraw" &&
                    address?.toLowerCase() == item?.to_adrs?.toLowerCase()
                    ? LanguageManager.detailTrx.Deposit
                    : item?.type?.toLowerCase() == "withdraw" &&
                      Singleton.getInstance().defaultCosmosAddress?.toLowerCase() == item?.to_adrs?.toLowerCase()
                      ? LanguageManager.detailTrx.Deposit
                      : item?.type?.toLowerCase() == "buy"
                        ? LanguageManager.buySell.buy
                        : item?.type?.toLowerCase() == "sell"
                          ? LanguageManager.buySell.sell
                          : item?.type?.toLowerCase() == "swap"
                            ? "Swap"
                            : item?.type?.toLowerCase() == "cross_chain"
                              ? "Cross Chain Swap"
                              : item?.type?.toLowerCase() == "approve"
                                ? LanguageManager.swapText.approve
                                : LanguageManager.detailTrx.Deposit}
          </Text>
        )}

        {item?.from_adrs ? (
          <View style={{ flexDirection: "row", marginTop: dimen(4) }}>
            <Text
              allowFontScaling={false}
              style={[
                styles.transtimeStyle,
                { color: ThemeManager.colors.pinBgWhiteBlack, marginTop: -2 },
              ]}
            >
              {item?.type?.toLowerCase() == "withdraw" &&
                address?.toLowerCase() == item?.from_adrs?.toLowerCase()
                ? LanguageManager.browser.to
                : LanguageManager.browser.From}
              {":"}
            </Text>
            {item?.type?.toLowerCase() == "withdraw" &&
              address?.toLowerCase() == item?.from_adrs?.toLowerCase() ? (
              <Text
                allowFontScaling={false}
                style={[
                  styles.transtimeStyle,
                  { color: ThemeManager.colors.pinBgWhiteBlack, marginTop: -2 },
                ]}
              >
                {" "}
                {item?.to_adrs?.substring(0, 10) +
                  "..." +
                  item?.to_adrs?.substring(
                    item?.to_adrs?.length - 4,
                    item?.to_adrs?.length
                  )}
              </Text>
            ) : (
              <Text
                allowFontScaling={false}
                style={[
                  styles.transtimeStyle,
                  { color: ThemeManager.colors.pinBgWhiteBlack, marginTop: -2 },
                ]}
              >
                {" "}
                {item?.from_adrs?.substring(0, 10) +
                  "..." +
                  item?.from_adrs?.substring(
                    item?.from_adrs?.length - 4,
                    item?.from_adrs?.length
                  )}
              </Text>
            )}
          </View>
        ) : (
          <View style={{ flexDirection: "row", marginTop: dimen(4) }}>
            <Text
              allowFontScaling={false}
              style={[
                styles.transtimeStyle,
                { color: ThemeManager.colors.pinBgWhiteBlack, marginTop: -2 },
              ]}
            >
              {LanguageManager.detailTrx.Status}
              {":"}
            </Text>
            <Text
              allowFontScaling={false}
              style={[
                styles.transtimeStyle,
                {
                  color: ThemeManager.colors.pinBgWhiteBlack,
                  marginTop: -2,
                  textTransform: "capitalize",
                },
              ]}
            >
              {" "}
              {item?.blockchain_status}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.ViewStyle2}>
        {item.is_approval == 1 && (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromValueStyle,
              {
                color:
                  themeSelected == 2
                    ? ThemeManager.colors.headersTextColor
                    : ThemeManager.colors.whiteText,
              },
            ]}
          >
            {item.coin_symbol.toUpperCase()} approval{" "}
            {(Singleton.getInstance() as any).getStatus(
              item.status,
              item.blockchain_status,
              item.type
            )}
          </Text>
        )}

        {item.is_approval == 1 ? null : item.is_approval != 1 &&
          !item.token_id ? (
          <View>
            <Text
              allowFontScaling={false}
              style={[
                styles.fromValueStyle,
                {
                  color:
                    (item?.type?.toLowerCase() == "withdraw" &&
                      address?.toLowerCase() ==
                      item.from_adrs?.toLowerCase()) ||
                      item.type == "card_fees" ||
                      item.type == "card_recharge"
                      ? ThemeManager.colors.blackWhiteText
                      : ThemeManager.colors.blackWhiteText,
                },
              ]}
            >
              {item.amount > 0
                ? toFixedExp(item?.amount, 6) > 0
                  ? toFixedExp(item?.amount, 6)
                  : getFirstDecimalNumber(toFixedExp(item?.amount, 6))
                : toFixedExp(item?.amount, 6)}{" "}
              {selectedCoin.coin_symbol.toUpperCase()}
            </Text>
            <Text
              allowFontScaling={false}
              style={[
                styles.transtimeStyle,
                {
                  color: ThemeManager.colors.pinBgWhiteBlack,
                  marginTop: -2,
                  textAlign: "right",
                },
              ]}
            >
              {moment(item.created_at).format("MMM DD YYYY")}
            </Text>
          </View>
        ) : (
          <Text
            allowFontScaling={false}
            style={[
              styles.fromValueStyle,
              {
                color: ThemeManager.colors.headersTextColor,
                textAlign: "center",
              },
            ]}
          >
            {LanguageManager.commonText.TokenId} {item.token_id}
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

//******************************************************************************************/
const TransactionList = ({
  txnList,
  selectedCoin,
  themeSelected,
  onScroll,
  isLoading
}: any) => {
  const [, setTransactionList] = useState(txnList);
  const { merchantCard } = LanguageManager;

  //******************************************************************************************/
  useEffect(() => {
    setTransactionList(txnList);
    getCosmosAddress()
  }, [txnList]);

  const getCosmosAddress= async()=>{
    let cosmosAddress = await getData(Constants.COSMOS_ADDRESS)
    Singleton.getInstance().defaultCosmosAddress = cosmosAddress
  }

  // BUG PRESERVED: assigns to undeclared global `getAddress` (ReferenceError in strict mode) and renderItem calls `this.getAddress` where `this` is undefined
  // @ts-ignore
  getAddress = (item: any) => {
    const fromAdd= item?.from_adrs;
    const toAdd= item?.to_adrs;
    let address;
    switch (item?.coin_family) {
      case 1:
        address = Singleton.getInstance().defaultBnbAddress;
        break;
      case 3:
        address = Singleton.getInstance().defaultBtcAddress;
        break;
      case 4:
        address = Singleton.getInstance().defaultMaticAddress;
        break;
      case 5:
        address = Singleton.getInstance().defaultSolAddress;
        break;
      case 6:
        address = Singleton.getInstance().defaultTrxAddress;
        break;
      case 7:
        if (fromAdd?.includes('qubetics') || toAdd?.includes('qubetics') ) {
          address = Singleton.getInstance().defaultCosmosAddress
        } else {
          address = Singleton.getInstance().defaultTicsAddress;
        }
        break;
      default:
        address = Singleton.getInstance().defaultEthAddress;
    }
    return address;
  };

  //******************************************************************************************/
  const renderItem = ({ item, index }: {item: any; index: any}) => {

    return (
      <Item
        item={item}
        oddColor={{
          backgroundColor: index % 2 == 0 ? Colors.defiListbg : "green",
        }}
        selectedCoin={selectedCoin}
        themeSelected={themeSelected}
        // @ts-ignore
        address={this.getAddress(item)}

      />
    );
  };

  //******************************************************************************************/
  return (
    <View style={{ flex: 1, marginBottom: Platform.OS == 'ios' ? getDimensionPercentage(45) : getDimensionPercentage(10) }}>
      <FlatList
        bounces={false}
        data={txnList}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.ViewStyle1,
              { backgroundColor: ThemeManager.colors.dividerColor, marginHorizontal: 15, marginVertical: 8 },
            ]}
          />
        )}
        renderItem={renderItem}
        keyExtractor={(item, index) => index + ""}
        ListEmptyComponent={() => {
          return (
            <View
              style={{
                height: Dimensions.get("screen").height / 2.7,
                justifyContent: "center",
              }}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.transactionHistoryTitle,
                  { color: ThemeManager.colors.blackWhiteText, alignSelf: "center" },
                ]}
              >
                {isLoading ? "" : merchantCard.noTransactionHistoryFound}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle4: {
    borderRadius: 14,
    height: 40,
    width: 40,
    justifyContent: 'center',
  },
  ViewStyle3: {
    flexDirection: "row",
    width: "92%",
    alignSelf: "center",
    paddingVertical: 8,
  },
  ViewStyle2: {
    width: "44%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  transtimeStyle: {
    fontFamily: fonts.dmSemiBold,
    fontSize: dimen(14),
    lineHeight: dimen(21),
    color: ThemeManager.colors.lightWhiteText,
  },
  fromValueStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 14,
    color: Colors.textColor,
    marginVertical: 5,
    textAlign: "right",
  },
  transTypeStyle: {
    fontFamily: fonts.dmSemiBold,
    fontSize: moderateScale(14),
    lineHeight: 20,
    color: Colors.textColor,
    marginTop: 5,
    marginRight: 10,
  },
  transactionHistoryTitle: {
    fontFamily: Fonts.dmMedium,
    fontSize: 15,
    textAlign: "center",
    width: "90%",
  },
  ViewStyle1: {
    height: 1,
    width: "100%",
  },
});

export { TransactionList };
