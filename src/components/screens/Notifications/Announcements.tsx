import { Component } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getAdminAnnouncements } from '../../../Redux/Actions';
import { connect } from 'react-redux';
import { LoaderView } from '../../common';
import { ThemeManager } from '../../../../ThemeManager';
import { EventRegister } from 'react-native-event-listeners';
import styles from './NotificationsStyle';
import moment from 'moment';
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from '../../../../LanguageManager';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import * as Constants from '../../../Constants';

class Announcements extends Component<any, any> {
  [key: string]: any;
  constructor(props: any) {
    super(props);
    this.state = {
      page: 1,
      limit: 10,
      search: '',
      isLoading: false,
      Announcements: [],
      loadList: false,
      totalRecords: '',
      data: {
        page: 1,
        limit: 10,
        search: ''
      },
    };
  }
  componentDidMount() {
    getData(Constants.LOGIN_DATA).then((res) => {
      this.announcementList({
        ...this.state.data,
      });
      this.setState({
      });
    });
    EventRegister.addEventListener('hitWalletApi', () => {
      consoleLogFunc('herrererer');
      Actions.currentScene == "NotificationsTab" &&
        this.announcementList({
          ...this.state.data,
        });
    });
    this.props.navigation.addListener('focus', () => {
      consoleLogFunc('chk Focus::::: announcements', this.props);
    });

  }

  /******************************************************************************************/
  announcementList(data: any, fromPagination = false) {
    consoleLogFunc('data----announcementList---', data);

    this.setState({ isLoading: true });
    this.props.getAdminAnnouncements({ data }).then((response: any) => {
      consoleLogFunc('res----announcementList---', response);

      if (response.data.notification_list.length > 0) {
        this.setState({
          Announcements: fromPagination ? this.state.Announcements.concat(response.data?.notification_list) : response.data?.notification_list,
          totalRecords: response.data.total,
          loadList: true,
          isLoading: false,
        });
      } else {
        this.setState({ Announcements: fromPagination ? this.state.Announcements : [], isLoading: false });
      }
    })
      .catch((e: any) => {
        this.setState({ isLoading: false });
      });
  }

  /******************************************************************************************/
  onLoadEnd = () => {
    if (this.state.loadList) {
      let page = this.state.page + 1;
      this.setState({ page: page, loadList: false }, () => {
        if (this.state.Announcements.length != this.state.totalRecords) {
          consoleLogFunc('here::::', 1);
          const data = {
            page: this.state.page,
            limit: this.state.limit,
            search: this.state.search
          };
          this.announcementList(data, true);
        } else {
          consoleLogFunc('here::::', 11);
        }
      });
    }
  };

  /******************************************************************************************/
  render() {
    const { notifications } = LanguageManager;
    return (
      <View style={{ flex: 1, }}>
        <View style={styles.viewMain}>
          {this.state.Announcements.length > 0 ? (
            <FlatList
              bounces={false}
              onEndReached={() => this.onLoadEnd()}
              onEndReachedThreshold={0.01}
              keyExtractor={(item, index) => index + ''}
              style={{ marginTop: 10 }}
              showsVerticalScrollIndicator={false}
              data={this.state.Announcements}
              renderItem={this.renderItem}
            />
          ) : (
            <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>
              {this.state.isLoading ? "" : notifications.nolistfound}</Text>
          )}
          {this.state.isLoading == true && (<LoaderView isLoading={this.state.isLoading} />)}
        </View>
      </View>
    );
  }

  /******************************************************************************************/
  renderItem = ({ item, index }: {item: any; index: any}) => {
    return (
      <View
        style={[
          styles.ViewStyle1,
          {
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: this.state.Announcements.length - 1 == index ? 30 : 0,
            borderColor: ThemeManager.colors.borderColor,
            backgroundColor: ThemeManager.colors.mnemonicsBg
          },
        ]}
      >
        <View style={styles.ViewStyle3}>
          {item?.title && (
            <Text
              allowFontScaling={false}
              style={[
                styles.Title,
                { flex: 1, color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {item?.title}
            </Text>
          )}
          {item?.message && (
            <Text
              allowFontScaling={false}
              style={[
                styles.Title_new,
                { flex: 1, color: ThemeManager.colors.blackWhiteText },
              ]}
            >
              {item?.message}
            </Text>
          )}
          <Text
            allowFontScaling={false}
            style={[
              styles.date,
              { flex: 1, color: ThemeManager.colors.legalGreyColor },
            ]}
          >
            {moment(item.created_at).format("DD MMM, YYYY")} |{" "}
            {moment(item.created_at).format("h:mm A")}
          </Text>
        </View>
      </View>
    );
  };
}
export default connect(null, { getAdminAnnouncements })(Announcements);
