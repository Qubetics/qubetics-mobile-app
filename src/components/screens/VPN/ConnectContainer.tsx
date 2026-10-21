import { StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";
import ConnectedStatusCard from "../../common/ConnectedStatusCard";
import LocationInfoCard from "../../common/LocationInfoCard";
import RecentServers from "../../common/RecentServers";
import { Actions } from '../../../navigation/RootNavigation';

const ConnectContainer = ({ vpnLocation = null,vpnIP,planId = null, providers = [] }: any) => {
  const { vpn } = LanguageManager;
  return (
    <>
      <View style={styles.container}>
        <ConnectedStatusCard
          title1={vpn.status}
          title2={vpn.connected}
          rightText={vpn.protected}
        />
        <LocationInfoCard
          icon={ThemeManager.ImageIcons.vpn_globe_grey}
          location={vpnLocation}
          ip={`IP: ${vpnIP}`}
          tintColor={ThemeManager.colors.headersTextColor}
        />
      </View>

      <View style={styles.subHeaderView}>
        <Text
          style={[
            styles.leftText,
            { color: ThemeManager.colors.headersTextColor },
          ]}
        >
          {LanguageManager.vpn.recentProviders}
        </Text>
        <Text
          onPress={() =>
            Actions.currentScene != 'ServiceProvider' &&
            (Actions as any).ServiceProvider({isFrom: "VPN_SCREEN"})
          }
          style={[
            styles.rightText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}
        >
          {LanguageManager.vpn.viewAll}
        </Text>
      </View>
      <View style={{ marginTop: 20, marginHorizontal: widthDimen(24) }}>
      <RecentServers
        fromServerScreen
        isFavShow={false}
        dataList={providers}
        listType={"provider"}
        onPress={(item: any) => {
          Actions.currentScene != "SeverByProvider" && 
          (Actions as any).SeverByProvider({
            selectedProvider: item,})
        }}
      />
      </View>
    </>
  );
};

export default ConnectContainer;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(40),
  },
  subHeaderView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: heightDimen(20),
    marginHorizontal: widthDimen(24),
  },
  leftText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  rightText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
});
