import { FlatList, StyleSheet, Text, View } from 'react-native';
import { dimen, widthDimen } from '../../Utils';
import SessionCard from './SessionCard';
import { ThemeManager } from '../../../ThemeManager';
import { Fonts } from '../../theme';

const RecentSessions = ({
  fromSession,
  speedUp,
  speedDown,
  sessions,
  handleEndReached,
  onReconnectPress, loading,
  hideReconnectButton,
}: any) => {
  const renderItem = ({ item }: any) => (
    <SessionCard
      flag={item?.nodes?.flag_url} // item?.['nodes.flag_url'] 
      country={item?.nodes?.country} // item?.['nodes.country']
      city={item?.nodes?.city} // item?.['nodes.city']
      fromSession={fromSession}
      speedDown={speedDown}
      speedUp={speedUp}
      startAt={item?.start_at}
      statusAt={item?.status_at}
      onReconnectPress={() => {
        onReconnectPress(item);
      }}
      hideReconnectButton={hideReconnectButton}
    />
  );
  const renderEmptyComponent = () => (
    <View style={{ flex: 1, marginBottom: widthDimen(30), justifyContent: 'center' }}>
      <Text
        allowFontScaling={false}
        style={[
          {
            color: ThemeManager.colors.blackWhiteText,
            fontFamily: Fonts.dmMedium,
            fontSize: dimen(15),
            paddingHorizontal: widthDimen(8),
            alignSelf: 'center',
          },
        ]}>
        {loading ? '' : 'No session found'}
      </Text>
    </View>
  );
  return (
    <FlatList
      data={sessions}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmptyComponent}
      onEndReached={() => {
        handleEndReached()
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    marginHorizontal: widthDimen(24),
    flexGrow: 1,
  },
});

export default RecentSessions;
