import { FlatList, StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import { Fonts } from "../../theme";
import ServerCards from "./ServerCards";
import { Actions } from '../../navigation/RootNavigation';


const RecentServers = ({ fromServerScreen, container, isFavShow, onPress, dataList, listType,cityFlag, onBuyPlanPress, loading }: any) => {
  const { vpn } = LanguageManager;

  const renderItem = ({ item, index }: any) => (
    <ServerCards
      flag={listType === 'City' ? cityFlag : item?.flag_url}
      name={listType === 'Country' ?item?.country: listType === 'City' ? item?.city : listType === 'provider' ? (item?.name || item?.identity || "Unknown") : ''}
      index={index}
      locations={item?.node_count || item?.subscribedPlanIds?.length || 0}
      ping={''}
      isFavShow={isFavShow}
      onPress={() => {
        onPress && onPress(item);
      }}
    />
  );

  return (
    <>
      <View style={[styles.container, container, {}]}>
        {!fromServerScreen && (
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: ThemeManager.colors.headersTextColor },
              ]}
            >
              {vpn.recentServers}
            </Text>
            <Text
              onPress={() =>
                Actions.currentScene != "ServersScreen" &&
                (Actions as any).ServersScreen()
              }
              style={[
                styles.viewAll,
                { color: ThemeManager.colors.legalGreyColor },
              ]}
            >
              {vpn.viewAll}
            </Text>
          </View>
        )}
      </View>
      <FlatList
        data={dataList}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={ (
          loading ? null : <View style={{ flex: 1, marginTop: "50%", justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: dimen(16), fontFamily: Fonts.dmMedium, color: ThemeManager.colors.blackWhiteText }}>{vpn.noNodeOnPlan}</Text>
        </View>) as any}
      />
    </>
  );
};

export default RecentServers;

const styles = StyleSheet.create({
  listContainer: {
  },
  container: {
    marginTop: heightDimen(20),
    marginHorizontal: widthDimen(24),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightDimen(10),
  },
  title: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  viewAll: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
});
