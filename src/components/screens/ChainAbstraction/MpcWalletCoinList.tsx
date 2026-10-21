import React, {
  useState,
  useCallback,
  useMemo,
  useDeferredValue,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';
import {
  getChainAbstractionCoinList,
  requestBtcAndTicsCoinList,
} from '../../../Redux/Actions/WalletAction';
import {Colors, Fonts} from '../../../theme';
import {horizontalScale, verticalScale} from '../../../layouts/responsive';
import {
  consoleLogFunc,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import Singleton from '../../../Singleton';
import {HeaderMain, LoaderView} from '../../common';
import {Actions} from '../../../navigation/RootNavigation';


const MpcWalletCoinList = ({
  onCoinSelect,
  showDepositOptions = true,
  refreshTrigger = null,
  coinList: propCoinList = [], // Get coinList from props
}: any) => {
  // Modern React hooks for optimal performance
  const [coinList, setCoinList] = useState<any[]>(propCoinList);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDepositType, setSelectedDepositType] = useState('internal'); // 'internal' or 'external'
  const [searchQuery] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const [tempLoading, setTempLoading] = useState(false);

  // Use deferred value for search optimization (React 18+)
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const dispatch: any = useDispatch();

  // Memoized filtered coin list for performance
  const filteredCoinList = useMemo(() => {
    if (!deferredSearchQuery.trim()) return coinList;

    return coinList.filter(
      (coin: any) =>
        coin.coin_symbol
          ?.toLowerCase()
          .includes(deferredSearchQuery.toLowerCase()) ||
        coin.coin_name
          ?.toLowerCase()
          .includes(deferredSearchQuery.toLowerCase()),
    );
  }, [coinList, deferredSearchQuery]);

  // Update coinList when propCoinList changes
  React.useEffect(() => {
    if (propCoinList && propCoinList.length > 0) {
      setCoinList(propCoinList);
    }
  }, [propCoinList]);

  // Optimized coin list fetching with useCallback (fallback if no props)
  const fetchCoinList = useCallback(
    async (isRefresh = false) => {
      // If we have coinList from props, don't fetch
      if (propCoinList && propCoinList.length > 0) {
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = {
          coinFamilies: [3, 7, 2], // BTC, ETH, TICS
          addrsList: [
            Singleton.getInstance().defaultMpcBtcAddress,
            Singleton.getInstance().defaultMpcEthAddress,
            Singleton.getInstance().defaultMpcEthAddress,
          ],
        };

        const response = await dispatch(getChainAbstractionCoinList(data));
        consoleLogFunc(
          'MpcWalletCoinList - getChainAbstractionCoinList response:',
          response?.data,
        );

        if (response?.data) {
          setCoinList(response.data);
        }
      } catch (error) {
        consoleLogFunc('MpcWalletCoinList - Error fetching coin list:', error);
        Alert.alert('Error', 'Failed to load coins. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch, propCoinList],
  );

  // Handle refresh with useCallback
  const handleRefresh = useCallback(() => {
    // If we have coinList from props, don't refresh via API
    if (propCoinList && propCoinList.length > 0) {
      setRefreshing(false);
      return;
    }
    fetchCoinList(true);
  }, [fetchCoinList, propCoinList]);

  // Animation functions
  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const animateButtonPress = useCallback(
    (callback: any) => {
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (callback) callback();
      });
    },
    [buttonScaleAnim],
  );

  // Handle coin selection with useCallback
  const handleCoinSelect = useCallback(
    (coin: any) => {
      setSelectedCoin(coin);
      animateButtonPress(() => {
        if (onCoinSelect) {
          onCoinSelect(coin, selectedDepositType);
        }
      });
    },
    [onCoinSelect, selectedDepositType, animateButtonPress],
  );

  // Handle deposit type change
  const handleDepositTypeChange = useCallback(
    (type: any, coinDetails: any) => {
      setSelectedDepositType(type);
      animateButtonPress(async () => {
        if (type === 'internal') {
          setTempLoading(true);
          consoleLogFunc(
            'MpcWalletCoinList - handleDepositTypeChange:',
            coinDetails,
          );
          setLoading(true);
          let walletAddress = '';
          if (coinDetails?.coin_family == 3) {
            walletAddress = Singleton.getInstance().defaultBtcAddress;
          } else if (coinDetails?.coin_family == 7) {
            walletAddress = Singleton.getInstance().defaultTicsAddress;
          }

          try {
            const response = await dispatch(
              requestBtcAndTicsCoinList(
                coinDetails?.coin_family,
                walletAddress,
              ),
            );
            const coinData = response?.find?.((item: any) => item.coin?.is_token == 0);
            consoleLogFunc(
              'MpcWalletCoinList - getCoinDetails response:',
              coinData,
            );

            if (coinDetails?.coin_family == 3) {
              (Actions as any).SendBtc({
                selectedCoin: coinData,
                preFillAddress: Singleton.getInstance().defaultMpcBtcAddress,
              });
            } else if (coinDetails?.coin_family == 7) {
              (Actions as any).SendBnbPol({
                selectedCoin: coinData,
                preFillAddress: Singleton.getInstance().defaultMpcEthAddress,
              });
            }
          } catch (error) {
            consoleLogFunc('MpcWalletCoinList - getCoinDetails error:', error);
          } finally {
            setTempLoading(false);
          }
        } else {
          Actions.currentScene != 'Receive' &&
            (Actions as any).Receive({
              isFromChainAbstraction: true,
              selectedCoin: {
                coin_family: coinDetails?.coin_family,
                coin_symbol: coinDetails?.coin_symbol,
                coin_name: coinDetails?.coin_name,
              },
            });
        }
      });
    },
    [animateButtonPress],
  );

  // Memoized render item for FlatList performance
  const renderCoinItem = useCallback(
    ({item, index}: {item: any; index: any}) => {
      // Use balance from different possible sources
      const balance = item.balance || 0;
      const formattedBalance = toFixedExp(balance, 8);

      const usdValue = (item.fiat_price_data?.value || 0) * balance;
      const formattedUsdValue = toFixedExp(usdValue, 2);
      const isSelected = selectedCoin?.coin_symbol === item.coin_symbol;

      return (
        <Animated.View
          style={[
            styles.coinItemContainer,
            {
              transform: [{translateY: slideAnim}, {scale: scaleAnim}],
              opacity: fadeAnim,
            },
          ]}>
          <TouchableOpacity
            style={[styles.coinItem, isSelected && styles.selectedCoinItem]}
            activeOpacity={0.8}>
            <LinearGradient
              colors={
                isSelected
                  ? [Colors.themeColor, Colors.buttonBgColor]
                  : ['#1A202E', '#1A202E']
              }
              style={styles.coinItemGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <View style={{padding: horizontalScale(20)}}>
                <View style={styles.coinInfo}>
                  <View style={styles.coinHeader}>
                    <View style={styles.coinImageContainer}>
                      <Image
                        source={{uri: item.coin_image}}
                        style={styles.coinImage}
                        resizeMode="contain"
                      />
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.coinDetails}>
                      <Text style={[styles.coinSymbol, {color: Colors.White}]}>
                        {item.coin_symbol?.toUpperCase()}
                      </Text>
                      <Text style={[styles.coinName, {color: Colors.grayIcon}]}>
                        {item.coin_name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.balanceInfo}>
                    <Text style={[styles.balanceText, {color: Colors.White}]}>
                      {formattedBalance}
                    </Text>
                    <Text
                      style={[styles.usdValueText, {color: Colors.grayIcon}]}>
                      ${formattedUsdValue}
                    </Text>
                  </View>
                </View>

                {showDepositOptions && (
                  <View style={styles.depositOptions}>
                    <Animated.View style={[styles.buttonContainer]}>
                      <TouchableOpacity
                        style={[
                          styles.depositButton,
                          styles.selectedDepositButton,
                        ]}
                        onPress={() =>
                          handleDepositTypeChange('internal', item)
                        }
                        activeOpacity={0.7}>
                        <LinearGradient
                          colors={[Colors.themeColor, Colors.buttonBgColor]}
                          style={styles.depositButtonGradient}>
                          <View
                            style={{
                              flex: 1,
                              paddingVertical: verticalScale(12),
                              paddingHorizontal: horizontalScale(16),
                            }}>
                            <Text
                              style={[
                                styles.depositButtonText,
                                styles.selectedDepositButtonText,
                              ]}>
                              Internal
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.depositButton]}
                        onPress={() =>
                          handleDepositTypeChange('external', item)
                        }
                        activeOpacity={0.7}>
                        <LinearGradient
                          colors={['transparent', 'transparent']}
                          style={styles.depositButtonGradient}>
                                                      <View
                            style={{
                              flex: 1,
                              paddingVertical: verticalScale(12),
                              paddingHorizontal: horizontalScale(16),
                            }}>

                          <Text
                            style={[
                              styles.depositButtonText,
                              selectedDepositType === 'external' &&
                                styles.selectedDepositButtonText,
                            ]}>
                            External
                          </Text>
                           </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [
      selectedDepositType,
      handleCoinSelect,
      handleDepositTypeChange,
      showDepositOptions,
      selectedCoin,
      slideAnim,
      scaleAnim,
      fadeAnim,
      buttonScaleAnim,
    ],
  );

  // Memoized key extractor
  const keyExtractor = useCallback(
    (item: any, index: any) => `${item.coin_symbol}_${index}`,
    [],
  );

  // Effect to fetch data on mount and when refreshTrigger changes
  React.useEffect(() => {
    // Only fetch if we don't have coinList from props
    if (!propCoinList || propCoinList.length === 0) {
      fetchCoinList();
    }
    animateIn();
  }, [fetchCoinList, refreshTrigger, animateIn, propCoinList]);

  // Skeleton loader component
  const renderSkeletonItem = useCallback(
    () => (
      <View style={styles.skeletonItem}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonText} />
          <View style={[styles.skeletonText, {width: '60%'}]} />
        </View>
        <View style={styles.skeletonBalance} />
      </View>
    ),
    [],
  );

  return (
    <View style={[styles.container, {backgroundColor: Colors.newBg}]}>
      <HeaderMain BackButtonText={'Select Coin'} />

      {loading &&
      !refreshing &&
      (!propCoinList || propCoinList.length === 0) ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map(index => (
            <View key={index}>{renderSkeletonItem()}</View>
          ))}
        </View>
      ) : (
        <Animated.View
          style={[
            styles.listContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <FlatList
            data={filteredCoinList}
            renderItem={renderCoinItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return (
                <View style={[styles.emptyView1]}>
                  <Text style={[styles.noListText]}>{'No List Found'}</Text>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.themeColor}
                colors={[Colors.themeColor]}
                progressBackgroundColor={Colors.newBg}
              />
            }
            contentContainerStyle={styles.flatListContent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>
      )}

      {tempLoading && <LoaderView isLoading={loading} />}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyView1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    marginTop: verticalScale(100),
  },
  noListText: {
    fontSize: 16,
    fontFamily: Fonts.dmSemiBold,
    color: '#fff',
  },
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(16),
  },
  flatListContent: {
    paddingBottom: verticalScale(20),
  },
  separator: {
    height: verticalScale(12),
  },

  // Coin Item Styles
  coinItemContainer: {
    marginBottom: verticalScale(8),
  },
  coinItem: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.borderShadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedCoinItem: {
    shadowColor: Colors.themeColor,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  coinItemGradient: {
    borderRadius: 20,
  },

  // Coin Info Styles
  coinInfo: {
    marginBottom: verticalScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinImageContainer: {
    position: 'relative',
    marginRight: horizontalScale(16),
  },
  coinImage: {
    width: horizontalScale(48),
    height: horizontalScale(48),
    borderRadius: 24,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.themeColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.White,
  },
  selectedIndicatorText: {
    color: Colors.White,
    fontSize: 12,
    fontFamily: (Fonts as any).DMSansBold,
  },
  coinDetails: {
    flex: 1,
  },
  coinSymbol: {
    fontSize: 18,
    fontFamily: (Fonts as any).DMSansBold,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  coinName: {
    fontSize: 13,
    fontFamily: (Fonts as any).DMSansRegular,
    opacity: 0.8,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 18,
    fontFamily: (Fonts as any).DMSansBold,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  usdValueText: {
    fontSize: 13,
    fontFamily: (Fonts as any).DMSansRegular,
    opacity: 0.8,
  },

  // Deposit Options Styles
  depositOptions: {
    marginTop: verticalScale(8),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositButton: {
    flex: 1,
    marginHorizontal: horizontalScale(6),
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedDepositButton: {
    borderColor: Colors.themeColor,
    shadowColor: Colors.themeColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  depositButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositButtonText: {
    fontSize: 14,
    fontFamily: (Fonts as any).DMSansMedium,
    color: Colors.White,
    opacity: 0.8,
  },
  selectedDepositButtonText: {
    color: Colors.White,
    opacity: 1,
    fontWeight: '600',
  },

  // Skeleton Loader Styles
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(20),
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(12),
    backgroundColor: '#1A202E',
    borderRadius: 20,
  },
  skeletonImage: {
    width: horizontalScale(48),
    height: horizontalScale(48),
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: horizontalScale(16),
  },
  skeletonTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonText: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonBalance: {
    width: horizontalScale(80),
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
});

export default MpcWalletCoinList;
