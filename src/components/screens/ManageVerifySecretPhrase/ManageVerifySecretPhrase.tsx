import {useEffect, useState, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import BackgroundImage from "../../common/BackgroundImage";
import styles from './ManageVerifySecretPhraseStyles';
import Toast from 'react-native-easy-toast';
import {
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import {
  AppAlert,
  Button,
  ButtonIcon,
  HeaderMain,
  LoaderView,
  OnboardingHeadings,
} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import Singleton from '../../../Singleton';
import {useDispatch} from 'react-redux';
import {
  consoleLogFunc,
  createUserWalletLocal,
  requestWalletApiData,
} from '../../../Utils/MethodsUtils';
import {requestWalletLogin} from '../../../Redux/Actions';
import { Actions } from '../../../navigation/RootNavigation';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import {CongratsModel} from '../../common/CongratsModel';
import WalletConnectInstance from '../../../Utils/WalletConnectInstance';
import { signCosmosMessage } from '../../../Utils/MnemonicsUtils';
import { disconnectVpn, stopVPN } from '../../common/WireGuardNative';
import { loginWithCosmosWallet } from '../../Api/VPN/api/authWithCosmosWallet';

const ManageVerifySecretPhrase = (props: any) => {
  const dispatch = useDispatch();
  const toast = useRef<any>(null);
  const [seqenceMn, setSeqenceMn] = useState<any[]>([]);
  const [jumbleMn, setJumbleMn] = useState<any[]>([]);
  const [indexArr, setIndexArr] = useState<any[]>([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShowCongrats, setShowCongrats] = useState(false);
  const [state, updateState] = useState({
    PinModal: false,
    myPin: '',
  });

  const setState = (newObj = {}) => {
    updateState(prev => ({...prev, ...newObj}));
  };
  const originalMnemonics = props?.walletData?.mnemonics.split(' ')

  
  useEffect(() => {
    let shuffle = originalMnemonics?.sort(() => Math.random() - 0.5);
    setJumbleMn(shuffle);
    setSeqenceMn([]);
  }, []);
  const addMnemonic = (item: any, indexValue: any) => {
    setSeqenceMn([...seqenceMn, item]);
    setIndexArr([...indexArr, indexValue]);
    removeMnemonicBottom(item, indexValue, true);
  };
  const removeMnemonicBottom = (item: any, indexValue: any, isUpperSide: any) => {
    let index = 0;
    let arr = indexArr;
    if (isUpperSide) {
      index = indexValue;
    } else {
      index = arr.indexOf(indexValue);
    }
    let mn = jumbleMn;
    if (index > -1) {
      mn.splice(index, 1);
      setJumbleMn([...mn]);

      arr.splice(index, 1);
      setIndexArr([...arr]);
    }
  };
  const removeMnemonic = (item: any, indexValue: any, isUpperSide: any) => {
    let index = 0;
    let arr = indexArr;
    if (isUpperSide) {
      index = indexValue;
    } else {
      index = arr.indexOf(indexValue);
    }
    let mn = seqenceMn;
    if (index > -1) {
      mn.splice(index, 1);
      setSeqenceMn([...mn]);
      setJumbleMn([...jumbleMn, item]);
      arr.splice(index, 1);
      setIndexArr([...arr]);
    }
  };
  const continueAction = async (enteredPin: any) => {
    if (JSON.stringify(originalMnemonics) != JSON.stringify(seqenceMn)) {
      toast.current?.show(LanguageManager.alertMessages.invalidMnemonics);
    } else {
      setLoading(true);
      let WalletData = props?.walletData;
      consoleLogFunc('WalletData ', WalletData);
            const mnemonicString = originalMnemonics.join(' ');
      const message = WalletData?.cosmos_address
        ? WalletData?.cosmos_address
        : 'Hello Cosmos';
      const {pubKey, signature} = await signCosmosMessage(
        mnemonicString?.toLowerCase()?.trim(),
        WalletData?.cosmos_address,
        message,
      );
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      try {
        await loginWithCosmosWallet({
          wallet_address: WalletData?.cosmos_address,
          pubKey: pubKey,
          signatureBase64: signature,
        });
      } catch (err: any) {
        console.error('Login error:', err);
        setLoading(false);
        setAlertModal(true);
        setAlertText(err);
        return;
      }

      const data = await requestWalletApiData({
        walletData: WalletData,
        walletName: props?.walletName,
      });

      (dispatch as any)(requestWalletLogin({data}))
        .then(async (resp: any) => {
          consoleLogFunc('requestWalletLogin---', resp);
          const createWalletData = {
            resp,
            walletData: WalletData,
            walletName: props?.walletName,
            pin: enteredPin,
            walletAlreadyExist: true,
            onSuccess: () => {
              consoleLogFunc('ON_SUCCESS>>>>>>>>');

              setLoading(false);
              setTimeout(() => {
                setShowCongrats(true);
              }, 150);
            },
          };
          await WalletConnectInstance.getInstance()?.deleteAllSessions();
          await createUserWalletLocal(createWalletData);
        })
        .catch((err: any) => {
          setLoading(false);
          toast.current?.show(err);
          consoleLogFunc('error requestWalletLogin:::::', err);
        });
    }
  };

  /******************************************************************************************/
  const onPinSuccess = (pin: any) => {
    setState({PinModal: false, myPin: pin});
    continueAction(pin);
  };

  return (
    <BackgroundImage
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <HeaderMain />
<ScrollView>


      <View style={styles.mainViewStyle}>
        <OnboardingHeadings
          title={LanguageManager.verifyPhrase.verifySecretPhrase}
          subTitle={LanguageManager.verifyPhrase.taptheWord}
        />
        <View
          style={[
            styles.mnemonicInput,
            {
              borderColor: ThemeManager.colors.blackWhiteText,
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} >
            <View style={styles.mnemonicsViewStyle}>
              {seqenceMn.map((item, index) => {
                return (
                  <View
                    style={{
                      marginTop: heightDimen(11),
                      marginHorizontal: widthDimen(5.5),
                    }}>
                    <ButtonIcon
                      directionReverse={true}
                      onPress={() => {
                        removeMnemonic(item, index, true);
                      }}
                      index={index}
                      name={item}
                      width={'100%'}
                      imageSize={8}
                      textStyle={{color: ThemeManager.colors.blackWhiteText}}
                      fontSize={getDimensionPercentage(16)}
                      textHeight={getDimensionPercentage(42)}
                      lineHeight={getDimensionPercentage(27.52)}
                      borderRadius={55}
                      tintColor={ThemeManager.colors.lightBlack}
                      outline={true}
                      borderColor={ThemeManager.colors.dividerColor}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.mnemonicsStyle}>
          {jumbleMn?.map((item, index) => {
            let isActive = seqenceMn?.includes(item);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mnemonic_style,
                  {backgroundColor: ThemeManager.colors.mnemonicsBg},
                ]}
                onPress={() => {
                  consoleLogFunc('jumbleMn----', isActive);
                  isActive
                    ? removeMnemonic(item, index, false)
                    : addMnemonic(item, index);
                }}>
                <Text
                  style={[
                    styles.jumleText,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {item}{' '}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
      </View>
      </ScrollView>
      <View style={[styles.txtButtonContainer]}>
        <View>
          <Button
            buttontext={LanguageManager.pins.Continue}
            onPress={() => {
              if (
                JSON.stringify(originalMnemonics) != JSON.stringify(seqenceMn)
              ) {
                toast.current?.show(
                  LanguageManager.alertMessages.invalidMnemonics,
                );
              } else {
                setState({PinModal: true});
              }
            }}
          />
        </View>
      </View>

      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => {
          setAlertModal(false);
        }}
      />
      <Toast
        ref={toast}
        position="bottom"
        positionValue={250}
        {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
      />
      <LoaderView isLoading={loading} />
      {/* --------------------------------Modal for Pin----------------------------------- */}
      <Modal
        statusBarTranslucent
        animationType="slide"
        transparent={true}
        visible={state.PinModal}
        onRequestClose={() => {
          setState({PinModal: false});
        }}>
        <View style={{flex: 1}}>
          <EnterPinForTransaction
            onBackClick={() => {
              setState({PinModal: false});
            }}
            checkBiometric={true}
            closeEnterPin={(pin: any) => {
              onPinSuccess(pin);
            }}
          />
        </View>
      </Modal>

      {isShowCongrats && (
        <CongratsModel
          openModel={isShowCongrats}
          title={LanguageManager.commonText.walletCreatedSuccessfully}
          onPress={() => {
            setShowCongrats(false);
            Singleton.bottomBar?.navigateTab('WalletMain');
            (Actions as any).jump('Main', { screen: 'WalletMain' });
          }}
        />
      )}
    </BackgroundImage>
  );
};

export default ManageVerifySecretPhrase;
