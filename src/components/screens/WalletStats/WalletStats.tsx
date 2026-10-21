import { Component } from 'react';
import { View, Image, Text, FlatList } from 'react-native';
import { Fonts } from '../../../theme';
import { ThemeManager } from '../../../../ThemeManager';
import { AllocationGraph, AppAlert } from '../../common';
import { connect } from 'react-redux';
import { consoleLogFunc, exponentialToDecimal, toFixedExp } from '../../../Utils/MethodsUtils';
import styles from './WalletStatsStyle';
import Singleton from '../../../Singleton';
import * as Constants from '../../../Constants';
import { EventRegister } from 'react-native-event-listeners';
import { LanguageManager } from '../../../../LanguageManager';
import { getDimensionPercentage as dimen, getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import { moderateScale } from '../../../layouts/responsive';
import { requestCoinList } from '../../../Redux/Actions';


class WalletStats extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      totalFiat: 0,
      balanceArr: ["0", "00"],
      pieData: [],
      showAlertDialog: false,
      alertTxt: "",
    };
  }

  //******************************************************************************************/
  componentDidMount() {
    // Show cached Redux data instantly so screen isn't blank on first visit
    if (this.props.coinList?.length > 0) {
      this.processCoinsData(this.props.coinList, null);
    }
    this.getPieData();
    this.downModalListener = EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({ showAlertDialog: false, alertTxt: "" });
    });
    this.focusListener = this.props.navigation.addListener('focus', () => {
      if (!(global as any).isConnected) {
        this.setState({
          showAlertDialog: true,
          alertTxt:
            LanguageManager.alertMessages.pleaseCheckYourNetworkConnection,
        });
      }
      // Show cached data instantly on tab switch, then refresh from API
      if (this.props.coinList?.length > 0) {
        this.processCoinsData(this.props.coinList, null);
      }
      this.getPieData();
    });
  }

  componentWillUnmount() {
    if (this.downModalListener) EventRegister.removeEventListener(this.downModalListener);
    if (this.focusListener) this.focusListener();
  }

  //******************************************************************************************/
  processCoinsData(data: any, totalBalance: any) {
    let list = data.filter((item: any) => item.fiatBal > 0);
    if (list.length > 0) {
      list = list.map((item: any, index: any) => ({
        ...item,
        value: parseFloat(
          item.fiatBal < 0.000001
            ? toFixedExp(item.fiatBal, 8, "4")
            : item.fiatBal < 0.0001
            ? toFixedExp(item.fiatBal, 6, "1")
            : item.fiatBal < 0.01
            ? toFixedExp(item.fiatBal, 4, "5")
            : toFixedExp(item.fiatBal, 2, "6")
        ),
        svg: { fill: this.stringToColour(item.coin_name) },
        key: `pie-${index}`,
      }));
      // Derive totalBalance from coinList when not provided by API response
      const total = totalBalance ?? list.reduce((sum: any, item: any) => sum + (item.fiatBal || 0), 0);
      let totalBal = toFixedExp(exponentialToDecimal(total), 2);
      let [wholePart, decimalPart = "00"] = totalBal.toString().split(".");
      wholePart = Number(wholePart).toLocaleString("en-GB");
      this.setState({
        pieData: list,
        totalFiat: totalBal,
        balanceArr: [wholePart, decimalPart],
      });
    } else {
      this.setState({
        pieData: [],
        totalFiat: 0.0,
        balanceArr: ["0", "00"],
      });
    }
  }

  //******************************************************************************************/
  getPieData() {
    const data1 = { limit: 200, page: 1 };
    this.props
      .requestCoinList({data1})
      .then((response: any) => {
        if (response?.data?.length > 0) {
          this.processCoinsData(response.data, response?.totalBalance);
        } else {
          this.setState({
            pieData: [],
            totalFiat: 0.0,
            balanceArr: ["0", "00"],
          });
        }
      })
      .catch((error: any) => {
        consoleLogFunc("error getPieData>>>>", error);
      });
  }

  //******************************************************************************************/
  stringToColour = function (name: any) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate RGB values for lighter blue shades
    const r = (hash & 0x3f) + 96; // Restrict red to 96-159 for lighter red tones
    const g = ((hash >> 5) & 0x3f) + 96; // Restrict green to 96-159 for lighter green tones
    const b = ((hash >> 10) & 0x7f) + 160; // Restrict blue to 160-255 for bright blue tones

    // Convert to hex color code
    return `#${("00" + r.toString(16)).slice(-2)}${(
      "00" + g.toString(16)
    ).slice(-2)}${("00" + b.toString(16)).slice(-2)}`;
  };

  //******************************************************************************************/
  render() {
    const { walletMain } = LanguageManager;
    return !this.props.isVisible && !this.props.isWatchList ? (
      <View />
    ) : (
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text
            allowFontScaling={false}
            style={[
              styles.textStyle2,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            {walletMain.totalBal}
          </Text>

          <Text
            allowFontScaling={false}
            style={[
              styles.balAmount,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            {Singleton.getInstance().CurrencySymbol}
            {Singleton.getInstance().isHideBalance
              ? "*****"
              : this.state.balanceArr?.[0] || "0"}
            <Text
              allowFontScaling={false}
              style={[
                styles.bal,
                { color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {"."}
              {Singleton.getInstance().isHideBalance
                ? "**"
                : this.state.balanceArr?.[1] || "00"}
            </Text>
          </Text>
        </View>

        <View
          style={{
            marginTop: heightDimen(25),
            height: heightDimen(140),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AllocationGraph pieData={this.state.pieData} />
          <View
            style={{
              flexDirection: "row",
              height: heightDimen(140),
              flex: 1,
            }}
          >
            <FlatList
              bounces={false}
              keyExtractor={(item, index) => index + ""}
              data={this.state.pieData}

              renderItem={({ item, index }) => {
                const color = item.svg?.fill;

                return (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      overflow: "hidden",
                      justifyContent: "space-between",
                      marginBottom: heightDimen(12),
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: color,
                          borderRadius: widthDimen(4),
                          width: widthDimen(16),
                          height: widthDimen(16),
                        }}
                      />
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        style={[
                          {
                            fontFamily: Fonts.dmRegular,
                            fontSize: dimen(12),
                            lineHeight: heightDimen(18),
                            paddingVertical: heightDimen(6.5),
                            paddingLeft: widthDimen(11),
                            paddingRight: widthDimen(18),
                            color: ThemeManager.colors.blackWhiteText,
                          },
                        ]}
                      >
                        {item.coin_name}
                      </Text>
                    </View>

                    <Text
                      allowFontScaling={false}
                      style={[
                        {
                          fontFamily: Fonts.dmRegular,
                          fontSize: dimen(12),
                          lineHeight: heightDimen(18),
                          paddingVertical: heightDimen(6.5),
                          paddingLeft: widthDimen(11),
                          paddingRight: widthDimen(18),
                          color: ThemeManager.colors.blackWhiteText,
                        },
                      ]}
                    >
                      {toFixedExp(
                        (exponentialToDecimal(item.value) /
                          this.state.totalFiat) *
                          100,
                        2,
                        "8"
                      )}
                      %
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </View>

        <Text
          style={{
            color: ThemeManager.colors.blackWhiteText,
            fontSize: moderateScale(18),
            lineHeight: moderateScale(24.84),
            fontFamily: Fonts.dmMedium,
            marginHorizontal: getDimensionPercentage(22),
            marginTop: 50,
          }}
        >
          Crypto
        </Text>

        <FlatList
          style={{ marginTop: heightDimen(10) }}
          bounces={false}
          keyExtractor={(item, index) => index + ""}
          showsVerticalScrollIndicator={false}
          data={this.state.pieData}
          ListEmptyComponent={() => {
            return (
              <View style={styles.ViewNew}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 16,
                    fontFamily: Fonts.dmMedium,
                    color: ThemeManager.colors.TextColor,
                  }}
                >
                  {walletMain.noassetsfound}
                </Text>
              </View>
            );
          }}
          renderItem={({ item, index }) => {
            return (
              <View
                style={{
                  ...styles.ViewStyle2,
                  marginBottom:
                    index == this.state.pieData.length - 1 ? 180 : 0,
                  marginTop: dimen(10),
                  backgroundColor: ThemeManager.colors.mnemonicsBg,
                }}
              >
                <View style={styles.ViewStyle}>
                  {item.coin_image ? (
                    <Image
                      style={{
                        height: dimen(44),
                        width: dimen(44),
                        borderRadius: 22,
                        marginLeft: widthDimen(15),
                        resizeMode:'contain'
                      }}
                      source={{ uri: item.coin_image }}
                    />
                  ) : (
                    <View
                      style={[
                        styles.imgViewStyle,
                        {
                          backgroundColor: ThemeManager.colors.borderUnderLine,
                          marginLeft: widthDimen(15),
                        },
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ color: ThemeManager.colors.Text }}
                      >
                        {item?.coin_symbol?.toUpperCase()?.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={{ marginLeft: 8 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle1,
                        color: ThemeManager.colors.blackWhiteText,
                      }}
                    >
                      {item.coin_symbol.toUpperCase()}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.textStyle,
                        { color: ThemeManager.colors.legalGreyColor },
                      ]}
                    >
                      {walletMain.percentage + " "}
                      <Text style={{ color: ThemeManager.colors.primaryColor }}>
                        {toFixedExp(
                          (exponentialToDecimal(item.value) /
                            this.state.totalFiat) *
                            100,
                          2,
                          "8"
                        )}
                        %
                      </Text>
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: "30%",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: dimen(18),
                      fontFamily: Fonts.dmSemiBold,
                      color: ThemeManager.colors.blackWhiteText,
                    }}
                  >
                    {Singleton.getInstance().CurrencySymbol}
                    {Singleton.getInstance().isHideBalance
                      ? "*****"
                      : toFixedExp(item.value, 2, "9")}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.textStyle,
                      { color: ThemeManager.colors.legalGreyColor },
                    ]}
                  >
                    {walletMain.amount}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
          }}
        />
      </View>
    );
  }
}
const mapStateToProp = (state: any) => {
  const { coinList } = state.walletReducer;
  return { coinList };
};
export default connect(mapStateToProp, {
  requestCoinList
})(WalletStats);
