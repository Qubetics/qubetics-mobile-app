import {BigNumber} from 'bignumber.js';
import {ethers} from 'ethers';
import {memo, useCallback, useEffect, useRef, useState} from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import LinearGradient from 'react-native-linear-gradient';
import {Actions} from '../../../navigation/RootNavigation';
import {useDispatch} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import {
  checkInchAllowance,
  fetchNativePrice,
  getCommissionData,
  getInchQuote,
  getSwapPriceDiff,
  getUserBalance,
  inchSwap,
  inchSwapSpender,
  onChainSwapList,
  requestGasEstimation,
  requestSendCoin,
} from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import {
  getDimensionPercentage,
  getSymbolByCoinFamily,
  heightDimen,
} from '../../../Utils';
import {
  bigNumberFormat,
  bigNumberSafeMath,
  consoleLogFunc,
  currencyFormat,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  swapToFixed,
  toFixed,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import {Fonts} from '../../../theme';
import images from '../../../theme/Images';
import TOKEN_ABI from '../../../tokenContract.ABI.json';
import {
  AppAlert,
  Button,
  ConfirmSwap,
  GradientBorderView,
  LoaderView,
  ModalCoinList,
  SelectCurrencyNew,
} from '../../common';
import CommonDraggableModal from '../../common/CommonDraggableModal';
import {ConfirmAlert} from '../../common/ConfirmAlert';
import PriceImpactModal from '../../common/PriceImpactModal';
import SlippageImpactModal from '../../common/SlippageImpactModal';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import styles from './onChainStyle';

var debounce = require('lodash.debounce');
let routerAddress = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'; // uniswap router address

const GAS_FEE_MULTIPLIER = 0.000000000000000001;
let tokenOne: any = '';
let tokenTwo: any = '';
let chainId: any = 1;
const inputType = {
  firstInput: 'firstInput',
  secondInput: 'secondInput',
};
let blockChain: any = 'binancesmartchain';
let commissionData: any = '';
let savedSlippage: any = 1;
let isApprovalTxn: any = false;
let firstInputAmount: any = '';

const tabData = [
  {title: '25%', key: '1', selected: false},
  {title: '50%', key: '2', selected: false},
  {title: '75%', key: '3', selected: false},
  {title: '100%', key: '4', selected: false},
];
const slippageData = [
  {title: 'Auto', key: '1', value: 1},
  {title: '0.1%', key: '2', value: 0.1},
  {title: '0.5%', key: '3', value: 0.5},
  {title: '1%', key: '4', value: 1},
  {title: 'Custom', key: '5'},
];
let walletAddressDefault: any = null; // kept it here because it's updated value is not being fetched when api's are called from focus listener

/******************************************************************************************/
const OneInchSwap = (props: any) => {
  const {alertMessages, pins, swapText} = LanguageManager;
  const RESET_SLIPPAGE_VALUE = {
    title: 'Auto',
    key: '1',
    value: 1,
  };
  const [isLoading, setLoading] = useState<any>(false);
  const [isLoadingText, setLoadingText] = useState<any>(false);
  const [coinList, setCoinList] = useState<any>([]);
  const [ExistingCoinList, setExistingCoinList] = useState<any>([]);
  const [NonExistingCoinList, setNonExistingCoinList] = useState<any>([]);
  const [tokenFirst, setTokenFirst] = useState<any>();
  const [tokenSecond, setTokenSecond] = useState<any>();
  const [userBal, setUserBal] = useState<any>(0);
  const [ExistingCoinModal, setExistingCoinModal] = useState<any>(false);
  const [selectedIndex, setSelectedIndex] = useState<any>(null);
  const [AlertDialogNew, showAlertDialogNew] = useState<any>(false);
  const [tokenOneAmount, setTokenOneAmount] = useState<any>('');
  const [tokenTwoAmount, setTokenTwoAmount] = useState<any>('');
  const [alertTxt, setAlertTxt] = useState<any>('');
  const [gasPrice, setGasPrice] = useState<any>(0);
  const [NonExistingCoinModal, setNonExistingCoinModal] = useState<any>(false);
  const [search, setSearch] = useState<any>('');
  const [isInsufficientBalance, setInsufficientBalance] = useState<any>(false);
  const [PairNotExist, setPairNotExist] = useState<any>(false);
  const [isApproved, setUserApproval] = useState<any>(true);
  const [gasEstimate, setGasEstimate] = useState<any>(0);
  const [transactionFee, setTransactionFee] = useState<any>('0.000000');
  const [allownceTxnObj, setAllowancetxnObj] = useState<any>({});
  const [toggleSwap, setToggleSwap] = useState<any>(false);
  const [showApproveModaL, setShowApproveModal] = useState<any>(false);
  const [alertText, setAlertText] = useState<any>('');
  const [fromSearch, setFromSearch] = useState<any>(false);
  const [inputTypeForApproval, setInputTypeForApproval] = useState<any>(null);
  const [tokenFirstForApproval, setTokenFirstForApproval] = useState<any>(null);
  const [tokenSecondForApproval, setTokenSecondForApproval] = useState<any>(null);
  const [valueForApproval, setValueForApproval] = useState<any>(null);
  const [fromToAmtDiff, setFromToAmtDiff] = useState<any>(0);
  const [AlertDialog1, showAlertDialog1] = useState<any>(false);
  const [showSuccess, setShowSucess] = useState<any>(false);
  const [isInfoShow, setIsInfoShow] = useState<any>(false);
  const [confirmTxnModalApprove, setConfirmTxnModalApprove] = useState<any>(false);
  const [confirmTxnModalSwap, setConfirmTxnModalSwap] = useState<any>(false);
  const [nativePrice, setNativePrice] = useState<any>('0.00');
  const [slippageModal, setslippageModal] = useState<any>(false);
  const [isReqSent, setIsReqSent] = useState<any>(false);
  const [showPinModal, setShowPinModal] = useState<any>(false);
  const [slippageImpactModal, setSlippageImpactModal] = useState<any>(false);
  const [inputSlippage, setinputSlippage] = useState<any>('');
  const [selectedSlippage, setselectedSlippage] =
    useState<any>(RESET_SLIPPAGE_VALUE);
  const [conversionQuote, setconversionQuote] = useState<any>('0');
  const [priceImpactState, setPriceImpactState] = useState<any>(true);
  const [pairModalAlert, setPairModalAlert] = useState<any>(false);
  const scrollRef = useRef<any>(undefined);
  const dispatch = useDispatch<any>();
  /****************************************************************** */
  const [encodeData, setencodeData] = useState<any>('');
  const [isConfirmPress, setIsConfirmPress] = useState<any>(false);

  const getEthersProvider = (rpcUrl: any) => {
    return new ethers.JsonRpcProvider(rpcUrl);
  };
  /******************************************************************************************/
  useEffect(() => {
    if (!props?.isVisible) {
      setTokenTwoAmount('');
      setTokenOneAmount('');
      setconversionQuote('0');
      setSelectedIndex(null);
    }
  }, [props?.isVisible]);
  /******************************************************************************************/
  useEffect(() => {
    const downModalListener = EventRegister.addEventListener(
      Constants.DOWN_MODAL,
      () => {
        setIsConfirmPress(false);
        consoleLogFunc('chk currentScene:::::::', Actions.currentScene);
        (Actions.currentScene == '_Swap' || Actions.currentScene == 'Swap') &&
          loadState();
      },
    );

    loadState();

    let focusListener = props.navigation.addListener('focus', () => {
      loadState();
    });
    let blurListener = props.navigation.addListener('blur', () => {
      saveLastSelectedCoins(tokenOne?.coin_id, tokenTwo?.coin_id);
      setExistingCoinModal(false);
      setNonExistingCoinModal(false);
      setConfirmTxnModalApprove(false);
      setConfirmTxnModalSwap(false);
      setslippageModal(false);
      setPriceImpactState(true);
      setPairModalAlert(false);
      showAlertDialog1(false);
      showAlertDialogNew(false);

      _scrollToTop();
    });

    return () => {
      typeof focusListener === 'function'
        ? focusListener()
        : focusListener?.remove?.();
      typeof blurListener === 'function'
        ? blurListener()
        : blurListener?.remove?.();
      (EventRegister as any).removeEventListener(downModalListener);
    };
  }, []);

  const _scrollToTop = () => {
    if (scrollRef !== null) {
      if (scrollRef.current !== null) {
        scrollRef.current?.scrollTo({x: 0, y: 0, animated: true});
      }
    }
  };

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Updates the wallet address according to the currently selected network.
   * @private
   */
  /******  5d67d859-c3f6-47e9-b15d-d58fa83873c1  *******/
  const updateWalletAddress = () => {
    consoleLogFunc(
      'updateWalletAddress -------',
      Singleton.getInstance()?.defaultEthAddress,
    );
    walletAddressDefault =
      Singleton.getInstance()?.defaultEthAddress ??
      Singleton.getInstance().defaultBnbAddress ??
      Singleton.getInstance().defaultMaticAddress;

    savedSlippage = 1;
    setselectedSlippage(RESET_SLIPPAGE_VALUE);
  };
  /******************************************************************************************/
  const loadState = () => {
    setLoading(false);
    firstInputAmount = '';
    setLoadingText(false);
    getFromToAmtDiff();
    setTokenOneAmount('');
    setTokenTwoAmount('');
    setinputSlippage('');
    setconversionQuote('0');
    setSelectedIndex(null);
    setUserApproval(true);
    setInsufficientBalance(false);
    setConfirmTxnModalApprove(false);
    setConfirmTxnModalSwap(false);
    showAlertDialogNew(false);
    setPairNotExist(false);
    setTransactionFee('0.00');
    getList_gasPrice();
    getApiCommissonData();
    updateWalletAddress();
    setIsConfirmPress(false);

    // ******
  };

  /******************************************************************************************/
  const getFromToAmtDiff = () => {
    dispatch(getSwapPriceDiff())
      .then(async (res: any) => {
        consoleLogFunc('res===>>>>>', res);
        setFromToAmtDiff(res?.value);
      })
      .catch((err: any) => {
        consoleLogFunc('getFromToAmtDiff_Err===>>>>>', err);
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const getList_gasPrice = async () => {
    getGasPrice();
    await getData(Constants.ONCHAIN_LIST).then(async swapList => {
      if (swapList != null) {
        consoleLogFunc('swapList>>>>', typeof swapList);
        const SwapList = JSON.parse(swapList);
        const swapSelectedCoin =
          Singleton.getInstance().swapSelectedCoin?.selectedCoin;
        const lastSelectedCoins = await getLastSelectedCoins(swapSelectedCoin);
        consoleLogFunc('swapList>>>>11', SwapList);
        consoleLogFunc('swapSelectedCoin>>>>11', swapSelectedCoin);
        consoleLogFunc('lastSelectedCoins>>>>11', lastSelectedCoins);
        consoleLogFunc(
          'isOnChain>>>>',
          Singleton.getInstance().swapSelectedCoin?.isOnChain,
        );

        let selectedCoin: any = null;
        try {
          if (
            Singleton.getInstance().swapSelectedCoin != null &&
            Singleton.getInstance().swapSelectedCoin?.isOnChain
          ) {
            selectedCoin = SwapList.find(
              (item: any) => item.coin_id == swapSelectedCoin?.coin_id,
            );
            consoleLogFunc('selectedCoin>>>>11', selectedCoin);
          } else {
            selectedCoin = lastSelectedCoins?.from
              ? SwapList.find((item: any) => item.coin_id == lastSelectedCoins?.from)
              : SwapList[0];
            consoleLogFunc('selectedCoin>>>>22', selectedCoin);
          }
        } catch (error) {
          selectedCoin = SwapList[0];
        }
        selectedCoin = selectedCoin || SwapList[0];
        const existingList = SwapList.filter(
          (item: any) =>
            item.wallets?.length > 0 &&
            item.coin_family == selectedCoin?.coin_family,
        );
        const nonExistItem = SwapList.filter(
          (item: any) => item.coin_family == selectedCoin.coin_family,
        );
        selectedCoin = selectedCoin || existingList[0];

        setCoinList(SwapList);
        setExistingCoinList(existingList);
        setNonExistingCoinList(nonExistItem);
        setTokenFirst(selectedCoin);
        getUserBal(selectedCoin);
        tokenOne = selectedCoin;

        chainId =
          tokenOne?.coin_family == 1
            ? 56
            : tokenOne?.coin_family == 4
            ? 137
            : 1;
        let toToken: any = lastSelectedCoins?.to
          ? nonExistItem.find((item: any) => item.coin_id == lastSelectedCoins?.to)
          : nonExistItem[0];
        toToken = toToken ? toToken : nonExistItem[0];
        let isExist =
          nonExistItem && existingList
            ? toToken?.coin_symbol?.toLowerCase() ==
              selectedCoin?.coin_symbol?.toLowerCase()
            : '';
        if (isExist) {
          toToken = nonExistItem[0];
          isExist =
            toToken?.coin_symbol?.toLowerCase() ==
            selectedCoin?.coin_symbol?.toLowerCase();
        }

        if (existingList?.length > 0) {
          setTokenSecond(isExist ? nonExistItem[1] : toToken);
          tokenTwo = isExist ? nonExistItem[1] : toToken;
        } else {
          (setTokenSecond as any)();
        }
        getSwapList();
      } else {
        getSwapList();
      }
    });
  };
  /****************************************get commission data**************************************************/
  const getApiCommissonData = () => {
    dispatch(getCommissionData())
      .then(async (res: any) => {
        consoleLogFunc('getCommissionData==success=>>>>>', res);
        commissionData = res?.data;
      })
      .catch((err: any) => {
        consoleLogFunc('getCommissionData===error>>>>>', err);
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const getGasPrice = async () => {
    const provider = getWeb3Object();
    await provider
      .getFeeData()
      .then(({ gasPrice }) => {
        consoleLogFunc('-----------------gasPrice-----------', gasPrice);
        setGasPrice(Number(gasPrice));
      })
      .catch(err => {
        consoleLogFunc(':::::::::getGasPrice_ERR', err);
        if (err == 'Please check your network connection') {
          setAlertTxt(alertMessages.pleaseCheckYourNetworkConnection);
          showAlertDialogNew(true);
        }
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const getSwapList = async () => {
    getData(Constants.ACCESS_TOKEN)
      .then(async ACCESS_TOKEN => {
        setLoading(true);
        const ethAddress = walletAddressDefault;
        const addrsListKeys = [ethAddress, ethAddress, ethAddress];
        let tempCoinFam = await getData(Constants.COIN_FAMILY_LIST);
        try {
          tempCoinFam = tempCoinFam ? JSON.parse(tempCoinFam) : tempCoinFam;
        } catch (error) {
          consoleLogFunc('tempCoinFam json parse error-------');
        }
        consoleLogFunc('>tempCoinFam>>>>', tempCoinFam);

        let coin_family = tempCoinFam;
        coin_family = coin_family?.filter(
          (res: any) => res != 3 && res != 5 && res != 6,
        );

        dispatch(onChainSwapList({ACCESS_TOKEN, addrsListKeys, coin_family}))
          .then(async (res: any) => {
            const swapSelectedCoin =
              Singleton.getInstance().swapSelectedCoin?.selectedCoin;
            const lastSelectedCoins = await getLastSelectedCoins(
              swapSelectedCoin,
            );
            let selectedCoin: any = null;
            try {
              if (
                Singleton.getInstance()?.swapSelectedCoin != null &&
                Singleton.getInstance()?.swapSelectedCoin?.isOnChain
              ) {
                selectedCoin = res?.find(
                  (item: any) => item.coin_id == swapSelectedCoin?.coin_id,
                );
              } else {
                selectedCoin = lastSelectedCoins?.from
                  ? res?.find((item: any) => item.coin_id == lastSelectedCoins?.from)
                  : res[0];
              }
            } catch (error) {
              selectedCoin = res[0];
            }

            selectedCoin = selectedCoin ? selectedCoin : res[0];
            const existingList = res.filter(
              (item: any) =>
                item.wallets?.length > 0 &&
                item.coin_family == selectedCoin.coin_family,
            );

            const nonExistItem = res.filter(
              (item: any) => item?.coin_family == selectedCoin?.coin_family,
            );
            setCoinList(res);
            setExistingCoinList(existingList);
            setNonExistingCoinList(nonExistItem);
            selectedCoin = await getUserBalanceFunction(selectedCoin); //{ ...selectedCoin, balance: newBalance }
            setTokenFirst(selectedCoin);
            getUserBal(selectedCoin);
            tokenOne = selectedCoin;
            chainId =
              tokenOne?.coin_family == 1
                ? 56
                : tokenOne?.coin_family == 4
                ? 137
                : 1;
            1;
            blockChain =
              selectedCoin?.coin_family == 1
                ? 'binancesmartchain'
                : selectedCoin?.coin_family == 4
                ? 'polygon'
                : 'ethereum';

            let toToken: any;
            try {
              toToken = lastSelectedCoins?.to
                ? nonExistItem.find(
                    (item: any) => item.coin_id == lastSelectedCoins?.to,
                  )
                : nonExistItem[0];
            } catch (error) {
              toToken = nonExistItem[0];
            }
            toToken = toToken ? toToken : nonExistItem[0];
            let isExist =
              nonExistItem && existingList
                ? toToken?.coin_symbol?.toLowerCase() ==
                  selectedCoin?.coin_symbol?.toLowerCase()
                : '';

            if (isExist) {
              toToken = nonExistItem[0];
              isExist =
                toToken?.coin_symbol?.toLowerCase() ==
                selectedCoin?.coin_symbol?.toLowerCase();
            }
            setTokenSecond(isExist ? nonExistItem[1] : toToken);
            tokenTwo = isExist ? nonExistItem[1] : toToken;
            consoleLogFunc('tokenTwo:::::::', tokenTwo);
            fetchNativePrice_(selectedCoin?.coin_family);
            setLoading(false);
          })
          .catch((err: any) => {
            consoleLogFunc('Err====== getswapcoinlist', err);
            setLoading(false);
          });
      })
      .catch(() => {
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const fetchNativePrice_ = (coin_family: any) => {
    let data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: coin_family,
    };
    consoleLogFunc('coin_family>>>', data);

    dispatch(fetchNativePrice({data}))
      .then((res: any) => {
        setNativePrice(toFixedExp(res?.fiatCoinPrice?.value, 2));
        consoleLogFunc('chk res native price:::::', res);
      })
      .catch((err: any) => {
        consoleLogFunc('chk err native price:::::', err);
      });
  };

  const getWeb3Object = () => {
    return blockChain == 'ethereum'
      ? getEthersProvider(Singleton.getInstance().ETH_RPC_URL)
      : blockChain == 'polygon'
      ? getEthersProvider(Singleton.getInstance().MATIC_RPC_URL)
      : getEthersProvider(Singleton.getInstance().BSC_RPC_URL);

  };
  /******************************************************************************************/
  const getUserBal = async (item: any) => {
    try {
      const userBal_ = item?.wallets[0].balance;
      consoleLogFunc('userBal_>>>', typeof userBal_, userBal_);

      const TokenBal = userBal_
        ? userBal_ > 0
          ? toFixedExp(userBal_, getTokenFirstDecimal(item))
          : '0.00'
        : '0.00';
      consoleLogFunc('TokenBal>>>', TokenBal);
      setUserBal(TokenBal);
      setLoading(false);
      return TokenBal;
    } catch (error) {
      setLoading(false);
    }
  };

  /******************************************************************************************/
  const existingCoinList = (text: any) => {
    setSearch(text);
    setFromSearch(true);
    debounceLoadData(text);
  };

  /******************************************************************************************/
  const debounceLoadData = useCallback(
    debounce((text: any) => {
      searchExistingFilterFunction(text);
    }, 1000),
    [],
  );

  /******************************************************************************************/
  const searchExistingFilterFunction = async (search: any) => {
    consoleLogFunc('checkkk111111');
    const coinListData = await getData(Constants.ONCHAIN_LIST);
    const coinList = JSON.parse(coinListData);
    const NameList: any[] = [];
    setExistingCoinList([]);
    search = search?.trim();
    if (search == '') {
      consoleLogFunc('checkkk2222222');
      setExistingCoinList(coinList.filter((item: any) => item.wallets?.length > 0));
    } else {
      const list = coinList.filter((item: any) => item.wallets?.length > 0);
      list.filter((value: any) => {
        if (
          value?.coin_name?.toLowerCase()?.includes(search.toLowerCase()) ||
          value?.coin_symbol?.toLowerCase()?.includes(search.toLowerCase())
        ) {
          NameList.push(value);
          consoleLogFunc('checkkk3333333');

          setExistingCoinList(NameList);
        }
      });
    }
  };

  /******************************************************************************************/
  const nonExistingCoinList = (text: any) => {
    setSearch(text);
    setFromSearch(true);
    debounceLoadDataTwo(text);
  };

  /******************************************************************************************/
  const debounceLoadDataTwo = useCallback(
    debounce((text: any) => {
      searchNonExistingFilterFunction(text);
    }, 1000),
    [],
  );

  /******************************************************************************************/
  const searchNonExistingFilterFunction = async (search: any) => {
    const coinListData = await getData(Constants.ONCHAIN_LIST);
    const coinList = JSON.parse(coinListData);
    const NameList: any[] = [];
    setNonExistingCoinList([]);
    if (search == '') {
      setNonExistingCoinList(
        coinList.filter((item: any) => item?.coin_family == tokenOne?.coin_family),
      );
    } else {
      const arr = await coinList.filter(
        (item: any) => item?.coin_family == tokenOne?.coin_family,
      );
      consoleLogFunc(tokenOne?.coin_family, 'chk arr::::::', arr);
      arr.filter((value: any) => {
        if (
          value?.coin_name?.toLowerCase()?.includes(search.toLowerCase()) ||
          value?.coin_symbol?.toLowerCase()?.includes(search.toLowerCase())
        ) {
          NameList.push(value);
          setNonExistingCoinList(NameList);
        }
      });
    }
  };

  /******************************************************************************************/
  const initialState = () => {
    setTokenOneAmount('');
    setTokenTwoAmount('');
    setconversionQuote('0');
    setInsufficientBalance(false);
  };

  /******************************************************************************************/
  const onPressExistList = (item: any) => {
    if (!(global as any).isConnected) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseCheckYourNetworkConnection);
      return;
    } else {
      setTimeout(async () => {
        consoleLogFunc('chk item::::', item);
        let secondItem = tokenSecond;
        consoleLogFunc('chk secondItem::::', secondItem);
        blockChain =
          item.coin_family == 1
            ? 'binancesmartchain'
            : item.coin_family == 4
            ? 'polygon'
            : 'ethereum';
        const list = await coinList.filter(
          (itemNew: any) => itemNew?.coin_family == item?.coin_family,
        );
        setNonExistingCoinList(list);
        if (item?.coin_family != tokenSecond?.coin_family) {
          if (item?.coin_symbol == list[0]?.coin_symbol) {
            setTokenSecond(list[1]);
            secondItem = list[1];
            tokenTwo = list[1];
          } else {
            setTokenSecond(list[0]);
            secondItem = list[0];
            tokenTwo = list[0];
          }
        }
        if (item?.coin_symbol == secondItem?.coin_symbol) {
          const temp = tokenFirst;
          consoleLogFunc('setTokenSecond==-temp-===-==', temp);

          setTokenSecond(temp);
          tokenTwo = temp;
        }

        fetchNativePrice_(item?.coin_family);
        item = await getUserBalanceFunction(item);
        setTokenFirst(item);
        getUserBal(item);
        tokenOne = item;
        setExistingCoinModal(false);
        setTokenOneAmount('');
        setTokenTwoAmount('');
        setSelectedIndex(null);
        setTransactionFee('0.00');
      }, 100);
    }
  };

  /******************************************************************************************/
  const onPressNonExistList = async (item: any) => {
    if (!(global as any).isConnected) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseCheckYourNetworkConnection);
      return;
    } else {
      setTimeout(async () => {
        let firstItem = tokenFirst;
        blockChain =
          item?.coin_family == 1
            ? 'binancesmartchain'
            : item?.coin_family == 4
            ? 'polygon'
            : 'ethereum';
        const list =
          item?.coin_family == 1
            ? ExistingCoinList.sort((a: any, b: any) => a.coin_family - b.coin_family)
            : ExistingCoinList.sort((a: any, b: any) => b.coin_family - a.coin_family);
        consoleLogFunc('list:::: non exist', list);
        if (item?.coin_family != tokenFirst?.coin_family) {
          let selectedCoin = list[0];
          if (item?.coin_symbol == list[0]?.coin_symbol) {
            selectedCoin = list[1];
          }
          selectedCoin = await getUserBalanceFunction(selectedCoin);
          setTokenFirst(selectedCoin);
          getUserBal(selectedCoin);
          tokenOne = selectedCoin;
          firstItem = selectedCoin;
        }
        if (item?.coin_symbol == firstItem?.coin_symbol) {
          setNonExistingCoinModal(false);
          setSearch('');
          setTimeout(() => {
            setAlertTxt('Cannot select the same coin.');
            showAlertDialog1(true);
          }, 200);
          return;
        }
        consoleLogFunc('setTokenSecond==-item-==', item);

        setTokenSecond(item);
        tokenTwo = item;
        setTokenOneAmount('');
        setTokenTwoAmount('');
        setSelectedIndex(null);
        setTransactionFee('0.00');
        setNonExistingCoinModal(false);
      }, 100);
    }
  };

  /******************************************************************************************/
  const onChangeTextDebounce = useCallback(
    debounce(({tokenFirst, tokenSecond, type, value, isTogglePress}: {tokenFirst: any; tokenSecond: any; type: any; value: any; isTogglePress: any}) => {
      consoleLogFunc('value:::::!11111', value);
      if (
        value?.length == 0 ||
        value == 0 ||
        value == '.' ||
        value?.trim() == ''
      ) {
        initialState();
        return;
      } else {
        onChangeTextFinal({tokenFirst, tokenSecond, type, value});
      }
    }, 1500),
    [],
  );

  /******************************************************************************************/
  const getContractObject = async (tokenAddress: any, abi = TOKEN_ABI) => {
    try {
      const web3Object = getWeb3Object();

      const tokenContractObject = new ethers.Contract(
        tokenAddress,
        abi,
        web3Object,
      );
      return tokenContractObject;
    } catch (e) {
      console.error('error ===>>', e);
    }
  };

  /******************************************************************************************/
  const onChangeTextFinal = async ({tokenFirst, tokenSecond, type, value}: {tokenFirst: any; tokenSecond: any; type: any; value: any}) => {
    if (tokenFirst == undefined) {
      setLoading(false);
      setLoadingText(false);
      return;
    }
    if (savedSlippage?.length == 0) {
      setAlertTxt('Select slippage');
      showAlertDialog1(true);
      return;
    }
    Keyboard.dismiss();
    setLoading(false);
    setLoadingText(true);
    setTimeout(async () => {
      setTokenFirstForApproval(tokenFirst);
      consoleLogFunc('setTokenSecond==-tokenSecond-==', tokenSecond);
      setTokenSecondForApproval(tokenSecond);
      setInputTypeForApproval(type);
      setValueForApproval(value);
      chainId =
        tokenFirst?.coin_family == 1
          ? 56
          : tokenFirst?.coin_family == 4
          ? 137
          : 1;
      blockChain =
        tokenFirst?.coin_family == 1
          ? 'binancesmartchain'
          : tokenFirst?.coin_family == 4
          ? 'polygon'
          : 'ethereum';
      const userAddress = walletAddressDefault;
      consoleLogFunc('value>>>', value);

      let amount = await exponentialToDecimal(
        bigNumberSafeMath(value, '*', tokenFirst?.decimals),
      );
      let source =
        tokenFirst?.is_token == 1
          ? tokenFirst?.token_address
          : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      let destination =
        tokenSecond?.is_token == 1
          ? tokenSecond?.token_address
          : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      consoleLogFunc('userAddress:::::', userAddress);
      consoleLogFunc('tokenFirst:::::', tokenFirst);
      consoleLogFunc('tokenSecond:::::', tokenSecond);
      consoleLogFunc('amount:::::', amount);
      consoleLogFunc('source:::::', source);
      consoleLogFunc('destination:::::', destination);
      consoleLogFunc('commissionData:::::', commissionData);
      const userBal = await getUserBal(tokenFirst);
      consoleLogFunc(
        'BAL1>>',
        userBal,
        tokenFirst.decimals,
        userBal * tokenFirst.decimals,
      );

      const bal_user = bigNumberSafeMath(userBal, '*', tokenFirst.decimals);
      consoleLogFunc('BAL1>>', bal_user);
      if (amount?.includes('.')) {
        amount = amount?.split('.')[0];
      }

      if (bigNumberFormat(bal_user).isLessThan(amount)) {
        setInsufficientBalance(true);
      } else {
        setInsufficientBalance(false);
      }

      let data = {
        src: source,
        dst: destination,
        amount: amount.toString(),
        fee: commissionData?.percentage || 0,
        chain_id: chainId,
      };

      consoleLogFunc('data>>', data);
      let gasEstimationReq = {
        from: walletAddressDefault,
        to: walletAddressDefault,
        amount: '',
      };
      // chain_id, src, dst, amount, fee
      getData(Constants.ACCESS_TOKEN).then(token => {
        dispatch(
          requestGasEstimation({
            url: `${
              tokenFirst?.coin_family == 1
                ? 'binancesmartchain'
                : tokenFirst?.coin_family == 4
                ? 'polygon'
                : 'ethereum'
            }/${
              tokenFirst?.is_token == 0
                ? tokenFirst?.coin_symbol
                : tokenFirst?.token_address
            }/gas_estimation`,
            // @ts-ignore - coinSymbol is not in the typed action params (extra prop preserved)
            coinSymbol: tokenFirst?.coin_symbol,
            gasEstimationReq,
            token,
          }),
        )
          .then(async (res1: any) => {
            let gasPrice =
              parseFloat(res1?.resultList?.fast_gas_price) * 10 ** 9;
            consoleLogFunc('userBal:::::', gasPrice);
            if (!value || parseFloat(value) <= 0) {
              //empty value
              setconversionQuote('0');
              setLoadingText(false);
              return;
            }

            dispatch(getInchQuote({data}))
              .then(async (res: any) => {
                consoleLogFunc('getInchQuote==success=>>>>>', res);
                let receivingAmt = await exponentialToDecimal(
                  bigNumberSafeMath(res?.toAmount, '/', tokenSecond?.decimals),
                );
                let perQuote = await exponentialToDecimal(
                  bigNumberSafeMath(receivingAmt, '/', value),
                );
                consoleLogFunc('calculatedAmt::::: ', receivingAmt);
                consoleLogFunc(
                  'calculatedAmt11::::: ',
                  swapToFixed(receivingAmt),
                );
                consoleLogFunc('perQuote::::: ', perQuote);
                if (firstInputAmount != '') {
                  setTokenTwoAmount(swapToFixed(receivingAmt));
                  setconversionQuote(perQuote);
                }
                const txnFee = res?.gas * 1.5 * gasPrice * GAS_FEE_MULTIPLIER;
                consoleLogFunc(txnFee, 'txnFeetxnFeetxnFee');
                setTransactionFee(toFixed(txnFee, 6));
                setGasEstimate((res?.gas * 1.5).toFixed(0).toString());
                setGasPrice(gasPrice);
                if (tokenFirst?.is_token == 1) {
                  checkContractApproval(tokenFirst, data?.amount);
                } else {
                  setUserApproval(true);
                  setLoadingText(false);
                  setLoading(false);
                }
              })
              .catch((err: any) => {
                consoleLogFunc('getInchQuote===error>>>>> ', err);
                setTokenTwoAmount('');
                setLoadingText(false);
                setLoading(false);
                setAlertTxt(err);
                showAlertDialogNew(true);
              });
          })
          .catch((err: any) => {
            consoleLogFunc('getInchQuote===error>>>>> ', err);
            setLoading(false);
            setLoadingText(false);
            setAlertTxt(err);
            showAlertDialogNew(true);
          });
      });
    }, 100);
  };
  /******************************************************************************************/
  const checkContractApproval = async (tokenFirst: any, amount: any) => {
    try {
      let data = {
        chain_id: chainId,
        tokenAddress: tokenFirst?.token_address,
        walletAddress: walletAddressDefault,
      };
      let allowanceData = await dispatch(checkInchAllowance({data}));
      setLoadingText(false);
      setLoading(false);
      if (BigNumber(allowanceData?.allowance).isLessThan(BigNumber(amount))) {
        let tokenContractObject = await getContractObject(
          tokenFirst?.token_address,
          TOKEN_ABI,
        );
        setAllowancetxnObj({
          tokenContractObject: tokenContractObject,
          path: tokenFirst?.token_address,
        });
        consoleLogFunc(':::::::::allowance required:::::::::');
        setUserApproval(false);
        return false;
      } else {
        consoleLogFunc(':::::::::allowance NOT required:::::::::');
        setUserApproval(true);
        return true;
      }
    } catch (error) {
      setUserApproval(false);
      setLoadingText(false);
      setLoading(false);
    }
  };

  const onPressToggle = async (tokenFirst: any, tokenSecond: any) => {
    setconversionQuote('0');

    if (!(global as any).isConnected) {
      setAlertTxt(alertMessages.pleaseCheckYourNetworkConnection);
      showAlertDialogNew(true);
      setLoading(false);
      return;
    }
    if (tokenSecond?.wallets?.length == 0) {
      setAlertTxt(alertMessages.addTokenFromAddCustomToken);
      showAlertDialogNew(true);
      setLoading(false);
      return;
    }
    let temp = tokenFirst;
    tokenSecond = await getUserBalanceFunction(tokenSecond);
    setTokenFirst(tokenSecond);
    getUserBal(tokenSecond);
    tokenOne = tokenSecond;
    consoleLogFunc('setTokenSecond==--==', temp);
    setTokenSecond(temp);
    tokenTwo = temp;
    setTokenOneAmount('');
    setTokenTwoAmount('');
    setSelectedIndex(null);
    setTransactionFee('0.00');
    setInsufficientBalance(false);
    setUserApproval(true);
    setToggleSwap(!toggleSwap);
  };

  /******************************************************************************************/
  const onPressSwap = async (transactionFee: any, hideModal?: any, isSlippageModal?: any) => {
    setLoading(true);
    const fromAmount =
      tokenFirst?.fiat_price_data?.value != undefined &&
      currencyFormat(
        tokenFirst?.fiat_price_data?.value * tokenOneAmount,
        Constants.FIAT_DECIMALS,
      );
    const receivedAmount =
      tokenSecond?.fiat_price_data?.value != undefined &&
      currencyFormat(
        tokenSecond?.fiat_price_data?.value * tokenTwoAmount,
        Constants.FIAT_DECIMALS,
      );

    consoleLogFunc(
      'tokenFirst>>>>',
      tokenFirst?.fiat_price_data?.value,
      'tokenOneAmount>>>>',
      tokenOneAmount,
    );
    consoleLogFunc(
      'tokenSecond>>>>',
      tokenSecond?.fiat_price_data?.value,
      'tokenTwoAmount>>>>',
      tokenTwoAmount,
    );
    consoleLogFunc(
      'receivedAmount>>>>',
      receivedAmount,
      'fromAmount>>>>',
      fromAmount,
    );

    const percVal = (parseFloat(receivedAmount) / parseFloat(fromAmount)) * 100;
    blockChain =
      tokenFirst.coin_family == 1
        ? 'binancesmartchain'
        : tokenFirst?.coin_family == 4
        ? 'polygon'
        : 'ethereum';
    const userAddress = walletAddressDefault;
    const diffVal = parseFloat(fromToAmtDiff) > 0 ? fromToAmtDiff : 0;
    consoleLogFunc('percVal::::::::::', percVal);
    consoleLogFunc('diffVal::::::::::', diffVal);
    if (tokenOneAmount == undefined || tokenOneAmount == 0) {
      setAlertTxt(alertMessages.pleaseEnterAmountToSwap);
      showAlertDialogNew(true);
      setLoading(false);
      return;
    }
    if (
      parseFloat((percVal || 0) as any) < parseFloat(diffVal) &&
      (!!hideModal ? false : priceImpactState)
    ) {
      // if receiving amount less than 90% of invested amount
      setPairModalAlert(true);
      setLoading(false);
      return;
    } else if (parseFloat(savedSlippage) >= 3 && !isSlippageModal) {
      setSlippageImpactModal(true);
      setLoading(false);
      return;
    } else if (tokenTwoAmount == undefined || tokenTwoAmount == 0) {
      setAlertTxt(
        tokenFirst?.coin_name +
          alertMessages.equivalentAmountTo +
          tokenSecond?.coin_name +
          alertMessages.isNotReceived,
      );
      showAlertDialogNew(true);
      setLoading(false);
      return;
    } else if (
      (tokenFirst?.coin_symbol?.toLowerCase() != 'bnb' &&
        tokenFirst?.coin_symbol?.toLowerCase() != 'eth' &&
        parseFloat(userBal) >= parseFloat(tokenOneAmount)) ||
      parseFloat(userBal) > parseFloat(tokenOneAmount)
    ) {
      if (isApproved) {
        const totalFee = exponentialToDecimal(
          parseFloat(gasPrice) * parseFloat(gasEstimate) * GAS_FEE_MULTIPLIER,
        );
        const web3Object = getWeb3Object();
        const ethBal_ = Number(await web3Object.getBalance(userAddress));
        const value = ethBal_ / tokenFirst.decimals;
        const ethBal = exponentialToDecimal(value);
        consoleLogFunc('chk:::::UserBalance====', ethBal);
        const calcAmount = parseFloat(value as any) - parseFloat(totalFee);
        consoleLogFunc('calcAmount====', calcAmount);
        if (calcAmount < 0) {
          setAlertTxt(
            alertMessages.youDontHaveEnough +
              `${getSymbolByCoinFamily(tokenFirst.coin_family)}` +
              alertMessages.toPerformTransaction,
          );
          showAlertDialogNew(true);
          setLoading(false);
          return;
        }
        get1inchSwapData();
      } else {
        const totalFee = (gasPrice * gasEstimate).toFixed(0);
        const web3Object = getWeb3Object();
        const ethBal = Number(await web3Object.getBalance(userAddress));
        if (ethBal - exponentialToDecimal(totalFee) < 0) {
          setAlertTxt(
            alertMessages.youDontHaveEnough +
              `${getSymbolByCoinFamily(tokenFirst.coin_family)}` +
              alertMessages.toPerformTransaction,
          );
          showAlertDialogNew(true);
          setLoading(false);
          return;
        }
        setLoading(false);
        setAlertText(
          alertMessages.youHaveToPay +
            `${parseFloat(transactionFee).toFixed(6)} ${getSymbolByCoinFamily(
              tokenFirst.coin_family,
            )}` +
            alertMessages.areYouWillingToGiveApproval,
        );
        setShowApproveModal(true);
      }
    } else {
      setAlertTxt(
        alertMessages.youDontHaveEnough +
          `${getSymbolByCoinFamily(tokenFirst.coin_family)}` +
          alertMessages.toPerformTransaction,
      );
      showAlertDialogNew(true);
      setLoading(false);
      return;
    }
  };
  /******************************************************************************************/
  const get1inchSwapData = async () => {
    let amount = await exponentialToDecimal(
      bigNumberSafeMath(tokenOneAmount, '*', tokenFirst?.decimals),
    );

    if (amount?.toString()?.includes('.')) {
      amount = amount?.toString()?.split('.')[0];
    }
    consoleLogFunc('tokenOneAmount>>>>>>>>', amount, tokenOneAmount);

    let slippageSwap = await bigNumberSafeMath(savedSlippage, '/', 100);
    let source =
      tokenFirst?.is_token == 1
        ? tokenFirst?.token_address
        : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let destination =
      tokenSecond?.is_token == 1
        ? tokenSecond?.token_address
        : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let data = {
      coin_family: tokenFirst?.coin_family,
      chain_id: chainId,
      src: source,
      dst: destination,
      amount: amount.toString(),
      slippage: slippageSwap,
      from: walletAddressDefault,
      referrer: commissionData?.walletAddress,
      fee: commissionData?.percentage,
    };

    consoleLogFunc('getdata::::::', data);
    consoleLogFunc('getchainId::::::', chainId);
    dispatch(inchSwap({data}))
      .then(async (res: any) => {
        consoleLogFunc('getInchQuote==success::::::', res);
        const gasPriceData = Number(res?.tx?.gasPrice || gasPrice);
        const txnFee = res?.tx?.gas * 1.5 * gasPriceData * GAS_FEE_MULTIPLIER;
        consoleLogFunc('txn fee:::::>>>>>', txnFee);
        const userBal = await getUserBal(tokenFirst);
        const bal_amount = bigNumberSafeMath(amount, '/', tokenFirst.decimals);
        const totalAmount =
          tokenFirst?.is_token == 0
            ? bigNumberSafeMath(bal_amount, '+', txnFee)
            : bal_amount;
        consoleLogFunc(
          'User Balance:',
          userBal,
          bal_amount,
          totalAmount,
          txnFee,
        );
        if (bigNumberFormat(userBal).isLessThan(totalAmount)) {
          setLoading(false);
          setAlertTxt(
            "You don't have enough balance to cover the amount + transaction fee.",
          );
          showAlertDialogNew(true);
          return;
        } else {
          setInsufficientBalance(false);
        }
        setTransactionFee(toFixed(txnFee, 6));
        setGasEstimate((res?.tx?.gas * 1.5).toFixed(0).toString());
        setGasPrice(gasPriceData);
        routerAddress = res?.tx?.to;
        setencodeData(res?.tx?.data);
        setLoadingText(false);
        setLoading(false);
        setConfirmTxnModalSwap(true);
      })
      .catch((err: any) => {
        consoleLogFunc('getInchQuote===error::::::: ', err);
        setTokenTwoAmount('');
        setLoadingText(false);
        setLoading(false);
        setAlertTxt(err);
        showAlertDialogNew(true);
      });
  };

  /******************************************************************************************/
  const getApproval = async (pin: any) => {
    consoleLogFunc('routerAddress::::::: ', routerAddress);
    consoleLogFunc('allownceTxnObj::::::: ', allownceTxnObj);
    setLoading(true);

    setTimeout(async () => {
      setShowApproveModal(false);
      let spenderAddress = await dispatch(
        inchSwapSpender({data: {chain_id: chainId}}),
      );
      routerAddress = spenderAddress?.address;
      const approveRes: any = await approveTransaction(
        allownceTxnObj.tokenContractObject,
        routerAddress,
        allownceTxnObj.path,
        pin,
      );
      if (approveRes) {
        setTimeout(async () => {
          const contract = await getWeb3Object();
          const txnReceipt: any = await contract.getTransactionReceipt(
            approveRes?.tx_hash || approveRes?.transactionHash,
          );
          consoleLogFunc('txnReceipt::::::', txnReceipt);
          if (txnReceipt) {
            if (txnReceipt.status == true) {
              setUserApproval(true);
              onChangeTextFinal({
                tokenFirst: tokenFirstForApproval,
                tokenSecond: tokenSecondForApproval,
                type: inputTypeForApproval,
                value: valueForApproval,
              });
              setAlertTxt(alertMessages.approvalSuccess);
              setShowSucess(true);
              showAlertDialog1(false);
              setTimeout(() => {
                showAlertDialogNew(true);
              }, 1000);

              setLoading(false);
            } else {
              setUserApproval(false);
              // BUG PRESERVED: 'err' is undeclared here (ReferenceError at runtime)
              // @ts-ignore
              setAlertTxt(err || alertMessages.approvalFailed);
              showAlertDialog1(false);
              setTimeout(() => {
                showAlertDialogNew(true);
              }, 1000);

              setLoading(false);
            }
          } else {
            setShowSucess(true);
            setUserApproval(false);
            setShowApproveModal(false);
            setAlertTxt(approveRes?.message);
            setIsReqSent(true);
            showAlertDialog1(true);
            setLoading(false);
          }
        }, 6000);
      } else {
        setTimeout(async () => {
          let data = {
            chain_id: chainId,
            tokenAddress: tokenFirst?.token_address,
            walletAddress: walletAddressDefault,
          };
          let isApproved = await dispatch(checkInchAllowance({data}));
          isApproved = isApproved?.allowance != 0;
          if (isApproved) {
            onChangeTextFinal({
              tokenFirst: tokenFirstForApproval,
              tokenSecond: tokenSecondForApproval,
              type: inputTypeForApproval,
              value: valueForApproval,
            });
            setLoading(false);
          } else {
            setUserApproval(false);
            setLoading(false);
            setShowSucess(true);
            showAlertDialog1(true);
            setAlertTxt(alertMessages.pleaseWaitForBlockchainConfirmation);
          }
        }, 6000);
      }
    }, 100);
  };

  /******************************************************************************************/
  const approveTransaction = async (
    tokenContractObject: any,
    spenderAddress: any,
    tokenAddress: any,
    pin: any,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        consoleLogFunc('spenderAddress:::::: ', spenderAddress);
        const userAddress = walletAddressDefault;
        consoleLogFunc(
          '\n\n\n **** APPROVED TRANSACTION userAddress ***** \n\n\n',
          userAddress,
        );
        blockChain =
          tokenFirst.coin_family == 1
            ? 'binancesmartchain'
            : tokenFirst?.coin_family == 4
            ? 'polygon'
            : 'ethereum';
        const web3Object = getWeb3Object();
        const approveTrans =
          await tokenContractObject.populateTransaction.approve(
            spenderAddress,
            BigNumber(10 ** 70).toFixed(0),
          );
        consoleLogFunc('approveTrans ===>>>', approveTrans);
        const approveGasLimit = await tokenContractObject.approve.estimateGas(
          spenderAddress,
          BigNumber(10 ** 70).toFixed(0),
          {
            from: userAddress,
          },
        );
        const nonce = await web3Object.getTransactionCount(
          userAddress,
          'latest',
        );
        consoleLogFunc('nonce ===>>>approve', nonce);
        consoleLogFunc('gasPrice ===>>>approve', gasPrice);

        const resultApprove: any = await makeTransaction(
          approveTrans.data,
          gasPrice,
          Number(approveGasLimit) + 10000,
          nonce,
          '0x0',
          tokenAddress,
          true,
          pin,
        );
        consoleLogFunc('chk approve Result::::', resultApprove);
        if (!!resultApprove?.message) {
          setUserApproval(false);
          setLoading(false);
          setShowSucess(true);
          setAlertTxt(resultApprove?.message);
          showAlertDialog1(true);
        }
        return resolve(resultApprove);
      } catch (e) {
        consoleLogFunc('chk approve txn err::::', e);
        return reject(null);
      }
    });
  };

  /******************************************************************************************/
  const swap = async (amount: any, tokenFirst: any, encodeData: any, pin: any) => {
    setLoading(true);
    setTimeout(async () => {
      const userAddress = walletAddressDefault;
      blockChain =
        tokenFirst?.coin_family == 1
          ? 'binancesmartchain'
          : tokenFirst?.coin_family == 4
          ? 'polygon'
          : 'ethereum';
      saveLastSelectedCoins(tokenOne?.coin_id, tokenTwo?.coin_id);
      const web3Object = getWeb3Object();
      const nonce = await web3Object.getTransactionCount(userAddress, 'latest');
      consoleLogFunc('chk gasEstimate::::::', gasEstimate);

      let toAddress = routerAddress;

      const result: any = await makeTransaction(
        encodeData,
        gasPrice,
        gasEstimate,
        nonce,
        tokenFirst?.is_token == 0 ? amount : 0,
        toAddress,
        false,
        pin,
      );

      consoleLogFunc('--------------result---------------', result);
      getUserBal(tokenFirst);
      setLoading(false);
      if (result) {
        setShowSucess(true);
        setAlertTxt(result?.message);
        showAlertDialog1(true);
        loadState();
      }
      return result;
    }, 150);
  };

  /******************************************************************************************/
  const makeTransaction = async (
    transactionData: any,
    gasPrice: any,
    gasLimit: any,
    nonce: any,
    value: any,
    to: any,
    fromApproval = false,
    pin: any,
  ) => {
    setLoading(true);
    const from = walletAddressDefault;
    return new Promise(async (resolve, reject) => {
      consoleLogFunc('chk value ::::::::', value);
      const chainID =
        tokenFirst?.coin_family == 1
          ? 56
          : tokenFirst?.coin_family == 4
          ? 137
          : 1;
      const rawTransaction = {
        gasPrice: gasPrice,
        gasLimit: BigInt(gasLimit),
        to: to,
        value: ethers.toBeHex(BigInt(value)),
        data: transactionData,
        nonce: nonce,
        from: from,
        chainId: chainID,
      };

      consoleLogFunc('rawTransaction =>', rawTransaction);
      consoleLogFunc('fromApproval =>', fromApproval);
      let finalTxn = '';
      let pvtKey = await getEncryptedData(
        `${Singleton.getInstance().defaultEthAddress}_pk`,
        pin,
      );
      const wallet = new ethers.Wallet(pvtKey);
      consoleLogFunc('wallet =>newwwwwOneInch', wallet);
      const txn = (await wallet.signTransaction(rawTransaction)).slice(2);
      pvtKey = '';
      finalTxn = txn;

      consoleLogFunc('chk signtxn:::::', finalTxn);
      const fiatval = tokenFirst.fiat_price_data?.value;
      const fiatValue = toFixedExp(
        parseFloat(tokenOneAmount) * parseFloat(fiatval),
        10,
      );
      const currencyCode = await getData(Constants.SELECTED_CURRENCY);

      const sendCoinReq = {
        nonce: nonce,
        tx_raw: finalTxn,
        from: from,
        to: to,
        amount: tokenOneAmount,
        gas_estimate: gasLimit,
        gas_price: gasPrice?.toString(),
        tx_type: fromApproval == true ? 'Approve' : 'Swap',
        approval: fromApproval == true ? 1 : 0,
        amount_in_fiat: fiatValue,
        swap_fee: commissionData?.percentage,
        fiat_type: currencyCode,
      };
      const access_token = await getData(Constants.ACCESS_TOKEN);
      consoleLogFunc('sendCoinReq::::::', sendCoinReq);
      const symbol =
        tokenFirst?.token_address != null
          ? tokenFirst?.token_address
          : tokenFirst?.coin_symbol?.toLowerCase();
      const blockChainSymbol =
        tokenFirst?.coin_family == 1
          ? 'binancesmartchain'
          : tokenFirst?.coin_family == 4
          ? 'polygon'
          : 'ethereum';
      await dispatch(
        requestSendCoin({
          url: `${blockChainSymbol}/${symbol}/send`,
          sendCoinReq,
          token: access_token,
        }),
      )
        .then((res: any) => {
          fromApproval == true ? setLoading(true) : setLoading(false);
          return resolve(res);
        })
        .catch((err: any) => {
          consoleLogFunc('chk err:::::data', err);
          setLoading(false);
          setAlertTxt(err);
          showAlertDialogNew(true);
          return reject(null);
        });
    });
  };

  /******************************************************************************************/
  const onChangeNumber = (value: any) => {
    if (value.includes(',')) value = value.replace(',', '.');
    if (value == '.') value = '0.';
    if (/^\d*\.?\d*$/.test(value)) {
      if (value.includes('.') && value.split('.')[1].length > 18) {
        return;
      } else {
        firstInputAmount = value;
        const isTogglePress = false;
        setTokenOneAmount(value);
        setToggleSwap(false);
        onChangeTextDebounce({
          tokenFirst,
          tokenSecond,
          value,
          type: inputType.firstInput,
          isTogglePress,
        });
      }
    }
    setSelectedIndex(null);
  };

  /******************************************************************************************/
  const onPressCoin = () => {
    if (ExistingCoinList.length == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseEnableYourAssetsToProceed);
      return;
    }
    saveData(Constants.ONCHAIN_LIST, JSON.stringify(coinList));
    tokenSecond && setNonExistingCoinModal(true);
    setSearch('');
    tokenSecond &&
      setNonExistingCoinList(
        coinList.filter((item: any) => item.coin_family == tokenFirst?.coin_family),
      );
  };

  /******************************************************************************************/
  const onPressCoinFirst = () => {
    if (ExistingCoinList.length == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseEnableYourAssetsToProceed);
      return;
    } else {
      tokenFirst && setExistingCoinModal(true);
      setSearch('');

      tokenFirst &&
        setExistingCoinList(coinList.filter((item: any) => item.wallets?.length > 0));
    }
  };

  /******************************************************************************************/
  const onPressItem = (item: any, index: any) => {
    var amount: any = 0;
    setLoading(true);
    const data = {
      wallet_address: walletAddressDefault,
      coin_id: tokenFirst?.coin_id,
    };
    dispatch(getUserBalance({data}))
      .then((res: any) => {
        consoleLogFunc(res, 'datadatadatadata');
        let balance = res;
        setLoading(false);
        if (Number(balance) <= 0) {
          setAlertTxt(alertMessages.insufficientBalance);
          showAlertDialogNew(true);
          return;
        }
        setSelectedIndex(index);
        const totalFee = gasEstimate * gasPrice * GAS_FEE_MULTIPLIER;
        consoleLogFunc('total fee %>>>>>>>', totalFee);
        if (index == 0) {
          amount =
            tokenFirst?.is_token == 1
              ? toFixedExp(
                  0.25 * parseFloat(balance),
                  getTokenFirstDecimal(tokenFirst),
                ).toString()
              : toFixedExp(0.25 * parseFloat(balance), 8).toString();
        } else if (index == 1) {
          amount =
            tokenFirst?.is_token == 1
              ? toFixedExp(
                  0.5 * parseFloat(balance),
                  getTokenFirstDecimal(tokenFirst),
                ).toString()
              : toFixedExp(0.5 * parseFloat(balance), 8).toString();
        } else if (index == 2) {
          amount =
            tokenFirst?.is_token == 1
              ? toFixedExp(
                  0.75 * parseFloat(balance),
                  getTokenFirstDecimal(tokenFirst),
                ).toString()
              : toFixedExp(0.75 * parseFloat(balance), 8).toString();
        } else if (index == 3) {
          if (tokenFirst?.is_token == 1) {
            consoleLogFunc('BALANCE>>>', balance);
            amount = toFixedExp(
              balance,
              getTokenFirstDecimal(tokenFirst),
            ).toString(); //toFixedExp(balance, 8).toString();
          } else {
            if (balance > totalFee) {
              amount = toFixedExp(
                (balance * 0.9 - totalFee).toString(),
                8,
              ).toString();
            } else {
              amount = toFixedExp(balance, 8).toString();
            }
          }
        }
        firstInputAmount = amount;
        consoleLogFunc(amount, 'tokenFirsttokenFirst');

        setTokenOneAmount(amount);
        setToggleSwap(false);
        if (
          amount?.length == 0 ||
          amount == 0 ||
          amount == '.' ||
          amount?.trim() == '' ||
          amount.includes('-') ||
          parseFloat(amount) <= 0
        ) {
          consoleLogFunc('EERR>>', amount);

          initialState();
          setInsufficientBalance(true);
          return;
        } else {
          onChangeTextFinal({
            tokenFirst,
            tokenSecond,
            type: inputType.firstInput,
            value: amount,
          });
        }
      })
      .catch((err: any) => {
        consoleLogFunc('error in onPressItem', err);
        setLoading(false);
        setAlertTxt(err);
        showAlertDialogNew(true);
      });
  };

  /************************************** alertDialogPressed ****************************************************/
  const alertDialogPressed = () => {
    showAlertDialog1(false);
    setShowSucess(false);
    setinputSlippage('');
    if (isReqSent) {
      setIsReqSent(false);
      Actions.jump('Main', {screen: 'WalletMain'});
    }
  };

  const getLastSelectedCoins = async (item: any) => {
    consoleLogFunc('getLastSelectedCoins---', item);

    let id = '102';
    if (item) {
      id = item?.coin_family == 1 && item?.is_token == 0 ? '102' : '1';
    }
    try {
      const address =
        Singleton.getInstance().defaultEthAddress ||
        Singleton.getInstance().defaultBnbAddress;
      const result = await getData(Constants.ON_CHAIN_LAST_PAIRS);
      const data = JSON.parse(result);
      consoleLogFunc('data>>>>>>>', data);
      consoleLogFunc(
        'getLastSelectedCoins---1',
        data?.[address]?.from,
        '---',
        data?.[address]?.to,
        '---',
        id,
      );
      return {
        from: data?.[address]?.from || '1',
        to: data?.[address]?.to || id,
      };
    } catch (error) {
      return {from: '1', to: id};
    }
  };

  const saveLastSelectedCoins = async (from: any, to: any) => {
    const address =
      Singleton.getInstance().defaultEthAddress ||
      Singleton.getInstance().defaultBnbAddress;
    let data = await getData(Constants.ON_CHAIN_LAST_PAIRS);
    data = data ? JSON.parse(data) : {};
    consoleLogFunc('data>>>>', data);

    saveData(
      Constants.ON_CHAIN_LAST_PAIRS,
      JSON.stringify({...data, [address]: {from, to}}),
    );
  };

  const getTokenFirstDecimal = (item: any, isExact?: any) => {
    const decim =
      item?.decimals.toString().length - 1 > 18
        ? 8
        : item?.decimals.toString().length - 1;
    return isExact ? item?.decimals.toString().length - 1 : decim;
  };

  const getUserBalanceFunction = (item: any) => {
    return new Promise((resolve, reject) => {
      const data = {
        wallet_address: walletAddressDefault,
        coin_id: item?.coin_id,
      };
      dispatch(getUserBalance({data}))
        .then((res: any) => {
          consoleLogFunc('BALANCE>>>>', res);
          resolve({
            ...item,
            wallets: [{balance: res, user_id: item?.wallets?.[0]?.user_id}],
          });
        })
        .catch((err: any) => {
          consoleLogFunc('BALANCE_ERR>>>>', (this as any).state.balance, err);
          resolve(item);
        });
    });
  };

  /******************************************************************************************/
  if (!props?.isVisible) {
    return <View />;
  }

  /******************************************************************************************/
  return (
    <>
      <View style={styles.ViewStyle}>
        <ScrollView
          ref={scrollRef}
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1}}>
          <View style={styles.ViewStyle1}>
            <SelectCurrencyNew
              type={'from'}
              label={'You Pay'}
              item={tokenFirst}
              tokenOneAmount={exponentialToDecimal(tokenOneAmount)}
              maxLength={10}
              placeholder="0.00"
              custStyle={{textAlign: 'right'}}
              onPressCoin={() => onPressCoinFirst()}
              value={tokenOneAmount}
              keyboardType={'numeric'}
              onChangeNumber={(value: any) => {
                onChangeNumber(value);
              }}
            />

            <View style={{marginTop: heightDimen(16)}}>
              <TouchableOpacity
                style={{alignSelf: 'center'}}
                onPress={() => {
                  onPressToggle(tokenFirst, tokenSecond);
                }}>
                <Image
                  source={ThemeManager.ImageIcons.toggle}
                  style={[styles.imgstyle]}
                />
              </TouchableOpacity>
              <SelectCurrencyNew
                type={'to'}
                label={'You Get'}
                inputandselectStyle={{marginTop: heightDimen(16)}}
                styleImg={{height: 28, width: 28}}
                item={tokenFirst != undefined ? tokenSecond : undefined}
                placeholder="0.00"
                editable={false}
                custStyle={{textAlign: 'right'}}
                onPressCoin={() => onPressCoin()}
                value={tokenTwoAmount}
                tokenOneAmount={exponentialToDecimal(tokenTwoAmount)}
              />
            </View>

            <View
              style={{
                justifyContent: 'space-between',
                marginTop: getDimensionPercentage(10),
                marginHorizontal: getDimensionPercentage(5),
              }}>
              <View style={styles.sliderView}>
                {tabData.map((item, index) => (
                  <TouchableOpacity
                    key={index + ''}
                    onPress={async () => onPressItem(item, index)}
                    style={[styles.tabsViewTwo]}>
                    {selectedIndex == index ? (
                      <LinearGradient
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        colors={['#73C9E2', '#6C8DC5', '#6456B2', '#6145EA']}
                        style={[
                          styles.tabsViewTwo,
                          {height: 40},
                        ]}>
                        <View
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Text
                            allowFontScaling={false}
                            style={{
                              color: ThemeManager.colors.blackWhiteText,
                              fontSize: 16,
                              fontFamily: Fonts.dmSemiBold,
                            }}>
                            {item.title}
                          </Text>
                        </View>
                      </LinearGradient>
                    ) : (
                      <GradientBorderView
                        gradientStyle={{height: 40}}
                        mainStyle={[styles.tabsViewTwo]}>
                        <Text
                          allowFontScaling={false}
                          style={{
                            color: ThemeManager.colors.TextColor,
                            fontSize: 16,
                            fontFamily: Fonts.dmSemiBold,
                          }}>
                          {item.title}
                        </Text>
                      </GradientBorderView>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View
                style={[
                  styles.sliderView,
                  {marginTop: 10, justifyContent: 'space-between'},
                ]}>
                <Text
                  style={[
                    styles.textStyle,
                    {color: ThemeManager.colors.blackWhiteText, fontSize: 16},
                  ]}>
                  Slippage
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    onPress={() => {
                      setslippageModal(true);
                    }}>
                    <Text
                      style={[
                        styles.textStyle,
                        {
                          color: ThemeManager.colors.blackWhiteText,
                          fontSize: 16,
                        },
                      ]}>
                      {savedSlippage}%
                    </Text>
                    <Image
                      style={{tintColor: ThemeManager.colors.blackWhiteText}}
                      source={images.setting_inactiveNew}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      marginLeft: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'center',
                    }}
                    onPress={() => {
                      setIsInfoShow(true);
                      setAlertTxt(
                        'Slippage is the price change between order placement and execution. Higher slippage helps prevent failed transactions, particularly in fast moving markets. For taxed tokens, we recommend you set slippage at least 1% above the tax rate of the token.',
                      );
                      showAlertDialog1(true);
                    }}>
                    <Image
                      style={{
                        width: 22,
                        height: 22,
                        tintColor: ThemeManager.colors.blackWhiteText,
                      }}
                      source={images.infoIconPhrase}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* *********************************************************** MODAL FOR EXISTING COINS ********************************************************************** */}
          <ModalCoinList
            showSearch={true}
            isFrom={'From'}
            openModel={ExistingCoinModal}
            handleBack={() => {
              setExistingCoinModal(false);
              setSearch('');
            }}
            list={ExistingCoinList}
            onPress={(item: any) => {
              onPressExistList(item);
            }}
            pressClear={() => existingCoinList('')}
            onChangeNumber={(text: any) => existingCoinList(text)}
            onSubmitEditing={() => existingCoinList(search)}
            search={search}
            fromSearch={fromSearch}
          />

          {/* *********************************************************** MODAL FOR NON-EXISTING COINS ********************************************************************** */}
          <ModalCoinList
            showSearch={true}
            openModel={NonExistingCoinModal}
            handleBack={() => {
              setNonExistingCoinModal(false);
              setSearch('');
            }}
            list={NonExistingCoinList}
            onPress={(item: any) => {
              onPressNonExistList(item);
            }}
            pressClear={() => nonExistingCoinList('')}
            onChangeNumber={(text: any) => nonExistingCoinList(text)}
            onSubmitEditing={() => nonExistingCoinList(search)}
            search={search}
            fromSearch={fromSearch}
          />

          {/* <----------------------------------------------slippage modal-----------------------------------------------------------------------------------> */}
          <CommonDraggableModal
            visible={slippageModal}
            onClose={() => setslippageModal(false)}
            title={LanguageManager.swapText.trasactionSetting}>
            <View style={styles.main_container}>
              <View style={styles.slippageTabView}>
                <Text
                  style={[
                    styles.slippageText,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  Slippage Tolerance
                </Text>
                <View
                  style={{
                    justifyContent: 'space-between',
                    marginTop: 15,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderColor:
                      ThemeManager.colors.addressBookDropBorederColor,
                    padding: 4,
                  }}>
                  <View style={styles.sliderView}>
                    {slippageData.map((item, index) =>
                      (item.key as any) != 5 ? (
                        <TouchableOpacity
                          key={index + ''}
                          onPress={async () => {
                            setinputSlippage('');
                            setselectedSlippage(item);
                          }}
                          style={[
                            styles.tabsView,
                            {
                              backgroundColor:
                                selectedSlippage?.title == item.title
                                  ? ThemeManager.colors.primaryColor
                                  : ThemeManager.colors.mnemonicsBg,
                              borderColor:
                                ThemeManager.colors.addressBookDropBorederColor,
                            },
                          ]}>
                          <Text
                            allowFontScaling={false}
                            style={{
                              color:
                                selectedSlippage?.title == item.title
                                  ? ThemeManager.colors.Mainbg
                                  : ThemeManager.colors.blackWhiteText,
                              fontSize: 14,
                              fontFamily: Fonts.dmMedium,
                            }}>
                            {item.title}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TextInput
                          key={index + ''}
                          keyboardType="numeric"
                          value={inputSlippage}
                          placeholderTextColor={
                            ThemeManager.colors.blackWhiteText
                          }
                          placeholder={item.title}
                          style={[
                            styles.tabsView,
                            {
                              paddingHorizontal: 10,
                              alignItems: 'flex-start',
                              borderColor:
                                ThemeManager.colors.addressBookDropBorederColor,
                              color: ThemeManager.colors.blackWhiteText,
                              paddingVertical:
                                Platform.OS == 'android' ? 0 : undefined,
                            },
                          ]}
                          onChangeText={text => {
                            if (Constants.TWO_DECIMAL_REGEX.test(text)) {
                              if ((text as any) <= 100) {
                                setselectedSlippage({
                                  title: 'Custom',
                                  key: '4',
                                  value: text,
                                });
                                setinputSlippage(text);
                              }
                            }
                          }}></TextInput>
                      ),
                    )}
                  </View>
                </View>

                <View style={{marginVertical: 20, flexDirection: 'row'}}>
                  <TouchableOpacity
                    style={styles.cancelView}
                    onPress={() => {
                      savedSlippage = 1;
                      setselectedSlippage(RESET_SLIPPAGE_VALUE);
                      setslippageModal(false);
                      setinputSlippage('');
                    }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: ThemeManager.colors.blackWhiteText,
                        fontSize: 16,
                        fontFamily: Fonts.dmMedium,
                      }}>
                      {'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <View style={{width: 20}}></View>
                  <TouchableOpacity
                    style={[
                      styles.cancelView,
                      {backgroundColor: ThemeManager.colors.primaryColor},
                    ]}
                    onPress={() => {
                      setslippageModal(false);

                      if (parseFloat(inputSlippage) >= 100) {
                        setTimeout(() => {
                          setAlertTxt('Enter a valid slippage percentage.');
                          showAlertDialog1(true);
                        }, 500);

                        return;
                      }
                      if (
                        selectedSlippage?.value == undefined ||
                        selectedSlippage?.value?.length == 0
                      ) {
                        setselectedSlippage({
                          title: 'Auto',
                          key: '1',
                          value: 1,
                        });
                      }
                      consoleLogFunc(
                        'selectedSlippage ',
                        selectedSlippage?.value,
                      );
                      consoleLogFunc('savedSlippage1111 ', savedSlippage);
                      savedSlippage = selectedSlippage?.value || '1';
                    }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: ThemeManager.colors.Mainbg,
                        fontSize: 16,
                        fontFamily: Fonts.dmMedium,
                      }}>
                      {'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </CommonDraggableModal>
        </ScrollView>

        <View style={styles.btnView}>
          <Button
            buttontext={
              isInsufficientBalance
                ? alertMessages.insufficientBalance
                : PairNotExist
                ? swapText.pairNotSupported
                : isApproved
                ? swapText.swap
                : !isApproved
                ? swapText.approval
                : swapText.swap
            }
            disabled={
              isInsufficientBalance ||
              PairNotExist ||
              !tokenFirst ||
              isConfirmPress
            }
            onPress={async () => {
              consoleLogFunc(
                'hasvavghvd ----',
                JSON.stringify({
                  tokenOneAmount,
                  tokenOne,
                  tokenSecond,
                  // amountTokenSecond,
                  savedSlippage,
                }),
              );
              if (!isLoading || !isLoadingText) {

                if (isApproved) {
                  isApprovalTxn = false;
                  onPressSwap(transactionFee);
                } else if (!isApproved) {
                  isApprovalTxn = true;
                  setShowPinModal(true);
                }
              }
            }}
          />
        </View>
        <AppAlert
          visible={AlertDialogNew}
          showSuccess={showSuccess}
          alertTxt={alertTxt}
          hideAlertDialog={() => {
            showAlertDialogNew(false);
            setShowSucess(false);
            if (isReqSent) {
              setIsReqSent(false);
              loadState();
            }
          }}
        />
        <AppAlert
          visible={AlertDialog1}
          alertTxt={alertTxt}
          showSuccess={showSuccess}
          isInfo={isInfoShow}
          hideAlertDialog={() => {
            setIsInfoShow(false);
            alertDialogPressed();
          }}
        />
        <LoaderView isSwap={true} isLoading={isLoading} />
        <LoaderView isSwap={true} isLoading={isLoadingText} />
        {confirmTxnModalApprove && (
          <ConfirmSwap
            tokenFirst={tokenFirst}
            tokenSecond={tokenSecond}
            tokenOneAmount={tokenOneAmount}
            tokenTwoAmount={tokenTwoAmount}
            networkFee={transactionFee}
            showConfirmTxnModal={confirmTxnModalApprove}
            conversionRate={`1 ${tokenFirst?.coin_symbol?.toUpperCase()} = ${conversionQuote} ${tokenSecond?.coin_symbol?.toUpperCase()}`}
            slippage={savedSlippage}
            comissionFee={commissionData?.percentage}
            handleBack={() => {
              setLoading(false);
              setConfirmTxnModalApprove(false);
              setIsConfirmPress(false);
            }}
            text={swapText.approve}
            onPress={() => {
              setIsConfirmPress(true);
              setConfirmTxnModalApprove(false);
              setTimeout(() => {
                isApprovalTxn = true;
                setShowPinModal(true);
              }, 100);
            }}
            nativePrice={toFixedExp(
              parseFloat(transactionFee) * parseFloat(nativePrice),
              2,
            )}
          />
        )}

        {confirmTxnModalSwap && (
          <ConfirmSwap
            tokenFirst={tokenFirst}
            tokenSecond={tokenSecond}
            tokenOneAmount={tokenOneAmount}
            tokenTwoAmount={tokenTwoAmount}
            networkFee={transactionFee}
            showConfirmTxnModal={confirmTxnModalSwap}
            conversionRate={`1 ${tokenFirst?.coin_symbol?.toUpperCase()} = ${conversionQuote} ${tokenSecond?.coin_symbol?.toUpperCase()}`}
            slippage={savedSlippage}
            comissionFee={commissionData?.percentage}
            handleBack={() => {
              setLoading(false);
              setConfirmTxnModalSwap(false);
              setIsConfirmPress(false);
            }}
            text={pins.continueSwap}
            onPress={async () => {
              setIsConfirmPress(true);
              setConfirmTxnModalSwap(false);
              setTimeout(() => {
                setShowPinModal(true);
              }, 800);
            }}
            nativePrice={toFixedExp(
              parseFloat(transactionFee) * parseFloat(nativePrice),
              2,
            )}
          />
        )}
        {showApproveModaL && (
          <ConfirmAlert
            {...({} as any)}
            text={pins.Continue}
            alertTxt={alertText}
            hideAlertDialog={() => setShowApproveModal(false)}
            ConfirmAlertDialog={() => {
              setConfirmTxnModalApprove(true);
              setShowApproveModal(false);
            }}
          />
        )}

        {/* --------------------------------Modal for Pin----------------------------------- */}
        <Modal
          statusBarTranslucent
          animationType="slide"
          transparent={true}
          visible={showPinModal}
          onRequestClose={() => {
            setShowPinModal(false);
            setIsConfirmPress(false);
          }}>
          <View style={{flex: 1}}>
            <EnterPinForTransaction
              onBackClick={() => {
                setShowPinModal(false);
                setIsConfirmPress(false);
              }}
              closeEnterPin={async (pin: any) => {
                setLoading(true);
                setShowPinModal(false);
                setIsConfirmPress(false);

                setTimeout(async () => {
                  if (isApprovalTxn) {
                    getApproval(pin);
                  } else {
                    let amount = await bigNumberSafeMath(
                      tokenOneAmount,
                      '*',
                      tokenFirst?.decimals,
                    );
                    swap(amount.toString(), tokenFirst, encodeData, pin);
                  }
                }, 1500);
              }}
              checkBiometric={true}
            />
          </View>
        </Modal>
        <PriceImpactModal
          visible={pairModalAlert}
          onPress={async () => {
            await setPriceImpactState(false);
            await setPairModalAlert(false);
            if (!isLoading || !isLoadingText) {
              if (isApproved) {
                consoleLogFunc('====swap======');
                isApprovalTxn = false;
                onPressSwap(transactionFee, true);
              } else if (!isApproved) {
                consoleLogFunc('====get approval =====');
                isApprovalTxn = true;
                setShowPinModal(true);
              }
            }
          }}
          onRequestClose={() => {
            setPairModalAlert(false);
          }}
        />
        <SlippageImpactModal
          visible={slippageImpactModal}
          onRequestClose={() => {
            setSlippageImpactModal(false);
          }}
          onContinuePress={() => {
            setSlippageImpactModal(false);
            onPressSwap(transactionFee, undefined, true);
          }}
          onReduceSlippagePress={() => {
            setslippageModal(true);
            setSlippageImpactModal(false);
          }}
        />
      </View>
    </>
  );
};
export default memo(OneInchSwap);
