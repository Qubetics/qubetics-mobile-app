import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { Actions } from '../../../navigation/RootNavigation';
import { useDispatch } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { requestWalletLogin } from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Images } from '../../../theme';
import { getDimensionPercentage as dimen, heightDimen } from '../../../Utils';
import {
  consoleLogFunc,
  createUserWalletLocal,
  getData,
  requestWalletApiData,
} from '../../../Utils/MethodsUtils';
import {
  importWallet,
  signCosmosMessage,
  validateMnemonics,
} from '../../../Utils/MnemonicsUtils';
import WalletConnectInstance from '../../../Utils/WalletConnectInstance';
import {
  AppAlert,
  Button,
  HeaderMain,
  Input,
  LoaderView,
  OnboardingHeadings,
} from '../../common';
import { CongratsModel } from '../../common/CongratsModel';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';

import styles from './ManageImportWalletStyles';
import { loginWithCosmosWallet } from '../../Api/VPN/api/authWithCosmosWallet';
import { disconnectVpn, stopVPN } from '../../common/WireGuardNative';
import { KeyBoardAwareComp } from '../../common/KeyBoardAwareComp';
import { EventRegister } from 'react-native-event-listeners';


const ManageImportWallet = (props: any) => {
  const dispatch = useDispatch();
  const toast = useRef<any>(null);
  const [wallet_name, setWallet_name] = useState('');
  const [, setIsKeyboard] = useState(false);
  const [mnemonics, setMnemonics] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [multiwallet, setmultiwallet] = useState<any[]>([]);
  const [isShowCongrats, setShowCongrats] = useState(false);
  const [state, updateState] = useState({
    PinModal: false,
    myPin: '',
  });

  const setState = (newObj = {}) => {
    updateState(prev => ({ ...prev, ...newObj }));
  };

  useEffect(() => {
    getData(Constants.MULTI_WALLET_LIST).then(multiWalletArray => {
      setmultiwallet(JSON.parse(multiWalletArray));
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setShowCongrats(false)
      setState({ PinModal: false });
    });
  }, []);
  const importAction = (enteredPin: any) => {
    setLoading(true);
    (importWallet as any)(mnemonics?.toLowerCase()?.trim())
      .then(async (response: any) => {
        let WalletData = response;
        consoleLogFunc('multi importWallet response---- ', WalletData);
        const ethAddress = WalletData.eth_address?.toLowerCase();
        const btcAddress = WalletData.btc_address?.toLowerCase();
        const trxAddress = WalletData.trx_address?.toLowerCase();
        const cosmosAddress = WalletData.cosmos_address?.toLowerCase();

        const iswalletExist = multiwallet?.find(
          ({ loginRequest, isPrivateKey }) =>
            !isPrivateKey &&
            [ethAddress, btcAddress, trxAddress, cosmosAddress].includes(
              loginRequest?.wallet_address?.toLowerCase(),
            ),
        );

        if (iswalletExist) {
          setLoading(false);
          setAlertModal(true);
          setAlertText(
            'Please delete the existing wallet to proceed with importing this wallet.',
          );
          return;
        }
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        const message = WalletData?.cosmos_address
          ? WalletData?.cosmos_address
          : 'Hello Cosmos';
        const { pubKey, signature } = await signCosmosMessage(
          mnemonics?.toLowerCase()?.trim(),
          WalletData?.cosmos_address,
          message,
        );

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
          walletName: wallet_name,
        });
        importWalletApiCall({
          WalletData,
          apiData: data,
          enteredPin,
        });
      })
      .catch((error: any) => {
        setLoading(false);
        consoleLogFunc('importWallet error---- ', error);
        toast.current?.show(error);
      });
  };

  const importWalletApiCall = (data: any) => {
    const { WalletData, apiData, enteredPin } = data;

    (dispatch as any)(requestWalletLogin({ data: apiData }))
      .then(async (resp: any) => {
        consoleLogFunc('requestWalletLogin---', resp);
        const createWalletData = {
          resp,
          walletData: WalletData,
          walletName: wallet_name,
          pin: enteredPin,
          walletAlreadyExist: true,
          onSuccess: () => {
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
  };

  /******************************************************************************************/
  const onPinSuccess = (pin: any) => {
    setState({ PinModal: false, myPin: pin });

    importAction(pin);
  };

  const pasteAction = async () => {
    const text = await Clipboard.getString();
    setMnemonics(text);
  };
  return (
    <KeyBoardAwareComp>
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{
          flex: 1,
          backgroundColor: ThemeManager.colors.mainBgNew,
        }}>
        <HeaderMain />
        <View style={[styles.mainView]}>
          <OnboardingHeadings
            title={LanguageManager.importWallet.importWallet}
            subTitle={LanguageManager.importWallet.importWalletH1}
          />

          <View style={styles.mainViewStyle}>
            <Input
              inputStyle={{
                borderRadius: 14,
                color: ThemeManager.colors.blackWhiteText,
              }}
              label={LanguageManager.walletName.enterWalletName}
              value={wallet_name}
              onChangeText={(val: any) => {
                if (Constants.ALPHANUMERIC_WITH_SPACE_REGEX.test(val)) {
                  setWallet_name(val?.trimStart());
                }
              }}
              placeholder={LanguageManager.walletName.enterHere}
              maxLength={20}
              onBlur={() => setIsKeyboard(false)}
              onFocus={() => setIsKeyboard(true)}
              labelcustom={{
                marginTop: dimen(40),
                color: ThemeManager.colors.blackWhiteText,
              }}
            />

            <View>
              <Input
                inputStyle={[
                  styles.placeHolderStyle,
                  {
                    borderColor: ThemeManager.colors.pasteInput,
                    color: ThemeManager.colors.blackWhiteText,
                  },
                ]}
                placeholder={LanguageManager.importWallet.secret}
                multiline
                returnKeyType="next"
                icon={false}
                value={mnemonics}
                maxLength={256}
                onChangeText={(val: any) => {
                  setMnemonics(val);
                  consoleLogFunc('val', val);
                }}
                numberOfLines={3}
                style={styles.inputPhraseStyle}
                onBlur={() => setIsKeyboard(false)}
                onFocus={() => setIsKeyboard(true)}
              />
              <TouchableOpacity
                onPress={() => {
                  pasteAction();
                }}
                style={{ position: 'absolute', bottom: 12, right: 15 }}>
                <Image
                  style={{ tintColor: ThemeManager.colors.primaryColor }}
                  source={Images.pasteIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.btnContainer}>
            <View style={styles.btnView}>
              <Button
                myStyle={{ marginBottom: heightDimen(50) }}
                buttontext={LanguageManager.pins.Continue}
                onPress={async () => {
                  if (wallet_name?.trim().length == 0) {
                    setAlertModal(true);
                    setAlertText(LanguageManager.alertMessages.enterWalletName);
                    return;
                  }
                  if (wallet_name?.trim()?.length < 3) {
                    setAlertModal(true);
                    setAlertText(LanguageManager.createWalletTexts.validName);
                    return;
                  }
                  if (mnemonics?.trim()?.length <= 0) {
                    setAlertModal(true);
                    setAlertText('Please enter mnemonics');
                    return;
                  }
                  const isValidMnemonics = await validateMnemonics(mnemonics?.trim());
                  consoleLogFunc('isValidMnemonics', isValidMnemonics);
                  if (!isValidMnemonics) {
                    toast.current?.show(
                      LanguageManager.alertMessages.invalidMnemonics,
                    );
                    return;
                  }

                  const iswalletNameExist = multiwallet?.find(
                    item =>
                      item?.walletName.toLowerCase() ==
                      wallet_name?.toLowerCase(),
                  );
                  if (iswalletNameExist) {
                    setAlertModal(true);
                    setAlertText(
                      LanguageManager.alertMessages.walletNameAlreadyExists,
                    );
                    return;
                  }

                  setState({ PinModal: true });
                }}
              />
            </View>
          </View>
        </View>
        <AppAlert
          visible={alertModal}
          alertTxt={alertText}
          hideAlertDialog={() => {
            setAlertModal(false);
          }}
        />
        <LoaderView isLoading={loading} />
        <Toast
          ref={toast}
          position="bottom"
          positionValue={250}
          {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
        />
        {/* --------------------------------Modal for Pin----------------------------------- */}
        <Modal
          statusBarTranslucent
          animationType="slide"
          transparent={true}
          visible={state.PinModal}
          onRequestClose={() => {
            setState({ PinModal: false });
          }}>
          <View style={{ flex: 1 }}>
            <EnterPinForTransaction
              onBackClick={() => {
                setState({ PinModal: false });
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
            importwallet={true}
            title={LanguageManager.commonText.walletImportedSuccessfully}
            onPress={() => {
              setShowCongrats(false);
              Singleton.bottomBar?.navigateTab('WalletMain');
              (Actions as any).jump('Main', { screen: 'WalletMain' });
            }}
          />
        )}
      </ImageBackground>
    </KeyBoardAwareComp>
  );
};

export default ManageImportWallet;
