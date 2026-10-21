import { Component } from "react";
import { ImageBackground, Text, View } from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import { requestCoinList } from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
import {
  AppAlert,
  CoinList,
  HeaderMain,
  LoaderView
} from "../../common";
import { SearchToken } from "../../common/SearchToken";
import styles from "./SelectCoinStyle";

class SelectCoin extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      limit: 25,
      loadList: false,
      totalRecords: "",
      coinList: [],
      showAlertDialog: false,
      alertTxt: "",
      dataObj: {
        search: "",
        page: 1,
        limit: 25,
      },
      isLoading: true,
      fromSearch: false,
    };
  }

  /******************************************************************************************/
  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({ showAlertDialog: false, alertTxt: "" ,});
    });
    this.props.navigation.addListener('focus', (event: any) => {
      this.setState({ showAlertDialog: false, alertTxt: "", page: 1, limit: 25, search: "", });
      this.fetchList(this.state.dataObj);
    });
  }


  fetchList(data1: any, fromPagination = false) {
    this.setState({ isLoading: true });
    consoleLogFunc('chk action_type:::::', this.props.action_type);
    setTimeout(() => {
      if (this.props.action_type == 'send') {
        consoleLogFunc("data 1 send>>>>>>>", data1);
        this.props.requestCoinList({ data1 }).then((response: any) => {
          if (response.data.length > 0) {
            const newArr = response.data.filter((item: any) => {
              return parseFloat(item.balance) > 0;
            });
            consoleLogFunc('chk newAr::::::');
            this.setState({ coinList: fromPagination ? this.state.coinList.concat(newArr) : newArr, loadList: true, totalRecords: response?.meta?.total });
          } else {
            this.setState({
              coinList: fromPagination ? this.state.coinList : [],
            });
          }
          this.setState({ isLoading: false });
        }).catch((err: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt: err,
          });
        });
      } else if (this.props.action_type == 'receive') {
        consoleLogFunc("data 1 receive>>>>>>>", data1);
        this.props.requestCoinList({ data1 }).then((response: any) => {
          consoleLogFunc("coin list receive>>>>>", response);
          if (response.data.length > 0) {
            this.setState({ coinList: fromPagination ? this.state.coinList.concat(response.data) : response.data, loadList: true, totalRecords: response?.meta?.total });
          } else {
            this.setState({ coinList: fromPagination ? this.state.coinList : [] });
          }
          this.setState({ isLoading: false });
        }).catch((err: any) => {
          this.setState({
            isLoading: false,
            showAlertDialog: true,
            alertTxt: err,
          });
        });
      }
    }, 150);
  }


  /******************************************************************************************/




  /******************************************************************************************/
  updateSearch(..._args: any[]) {
    if (this.timer != undefined) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.getSearchList();
    }, 1000);
  }

  /******************************************************************************************/
  getSearchList() {
    let data = {
      search: this.state.search?.trim(),
      page: 1,
      limit: this.state.limit,
    };
    this.fetchList(data);
  }

  /******************************************************************************************/
  onLoadEnd = () => {
    consoleLogFunc("chhchchchhc");
    if (this.state.loadList) {
      let page = this.state.page + 1;
      this.setState({ page: page, loadList: false }, () => {
        if (this.state.coinList?.length != this.state.totalRecords) {
          consoleLogFunc("here::::", 1);
          const data = {
            search: "",
            page: this.state.page,
            limit: this.state.limit,
          };
          this.fetchList(data, true);
        } else {
          consoleLogFunc("here::::", 11);
        }
      });
    }
  };


      /******************************************************************************************/
      itemPressedCosmos = (coin: any, item: any, index: any) => {
        consoleLogFunc('itemPressedCosmos--1', item);
  
        if(item?.key == 'evm'){
          Actions.currentScene != "SendBnbPol" &&
          (Actions as any).SendBnbPol({
            selectedCoin: coin,
            tabType: this.props.tabType,
            themeSelected: this.props.themeSelected,
          });
        }
        else{
          Actions.currentScene != "SendCosmos" && (Actions as any).SendCosmos({
            selectedCoin: coin,
            tabType: this.props.tabType,
            themeSelected: this.props.themeSelected,
            balance: coin.balance,
          })
        }
  
      }
  /******************************************************************************************/

  render() {
    const { walletMain } = LanguageManager;
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <HeaderMain
          BackButtonText={`${this.props.action_type.toLowerCase() == "send"
            ? walletMain.send
            : this.props.action_type == "multiSender"
              ? walletMain.send
              : walletMain.receive
            }`}
        />

        {(this.state.coinList?.length > 0 ||
          this.state.search.length > 0 ||
          this.state.fromSearch == true) && (
            <View style={{ marginHorizontal: 20 }}>
              <SearchToken
                isIconsShow={false}
                manage={() => {
                }}
                onSubmitEditing={(text: any) => {
                  this.updateSearch(this.state.search);
                }}
                value={this.state.search}
                onChangeText={(text: any) => {
                  this.setState({ search: text, fromSearch: true });
                  this.updateSearch(text);
                }}
              />
            </View>
          )}

        <View style={{ marginBottom: 22, flex: 1 }}>
          <View style={{ marginTop: 8 }}>
            {this.state.coinList?.length > 0 ? (
              <CoinList
                onEndReached={() => this.onLoadEnd()}
                coinList={this.state.coinList}
                tabType={this.props.tabType}
                selectCoin={this.props.selectCoin}
                action_type={this.props.action_type}
                themeSelected={this.props?.themeSelected}
                hideGraph={true}
                showTransactionHistory="false"
                showFooter={false}
                showViewAll={false}
                style={{ marginBottom: 20 }}
                isHideBalance={Singleton.getInstance().isHideBalance}
                onCosmosItemPress={this.itemPressedCosmos}
              />
            ) : (
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {this.state.isLoading ? "" : walletMain.Noasset}
              </Text>
            )}
          </View>
        </View>

        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({ showAlertDialog: false });
          }}
        />
        <LoaderView isLoading={this.state.isLoading} />

      </ImageBackground>
    );
  }
}
const mapStateToProp = (state: any) => {
  const { coinList } = state.walletReducer;
  return { coinList };
};

export default connect(mapStateToProp, { requestCoinList })(SelectCoin);
