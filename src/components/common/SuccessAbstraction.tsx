import { useRef } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { CHAIN_ABSTRACTION_EXPLORER } from '../../Constants';
import { Images } from '../../theme';
import { dimen } from '../../Utils';
import { Button } from './Button';
import { consoleLogFunc } from '../../Utils/MethodsUtils';
import Toast from 'react-native-easy-toast';
import Clipboard from "@react-native-clipboard/clipboard";

const SuccessAbstraction = ({
  txnFees,
  onClose,
  onExplorerPress,
  solver = 'UniSwap Protocol V3',
  networkFee,
  fromToken,
  swapStatusData
}: any) => {
  const toastRef = useRef<any>(null);

  const txHash = swapStatusData?.intent_hash;
  consoleLogFunc("swapStatusData>>11", swapStatusData);

  const status = swapStatusData?.intent_status

  const getStatusText = (statusValue: any) => {
    const value = statusValue?.toLowerCase();
    consoleLogFunc("value>>11", value);
    consoleLogFunc("statusValue>>11", statusValue);
    switch (value) {
      case "rejected":
        return {
          title: "Transaction Failed",
          status: 'Failed',
          image: Images.abFailed,
          color: ThemeManager.colors.redColor,
        };
      case "solved":
        return {
          title: "Transaction Successful",
          status: 'Confirmed',
          image: Images.abSuccess,
          color: ThemeManager.colors.greenColor,
        };
      default:
        return {
          title: "Transaction Processing",
          status: 'Pending',
          image: Images.abPending,
          color: ThemeManager.colors.yellowColor,
        };;
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(txHash);
    toastRef.current?.show("Transaction Hash Copied to clipboard", 2000);
  };

  return (
    <View style={{ ...styles.modalContainer, backgroundColor: ThemeManager.colors.mnemonicsBg }}>
      <Image
        source={getStatusText(status)?.image}
        style={styles.checkIcon}
      />
      <Text style={{ ...styles.title, color: ThemeManager.colors.blackWhiteText }}>{getStatusText(status)?.title}!</Text>
      <Text style={{ ...styles.subtitle, color: ThemeManager.colors.legalGreyColor }}>Your intent has been sent successfully</Text>

      {/* Hash box */}
      <View style={{ ...styles.hashContainer, backgroundColor: ThemeManager.colors.inputBgNew }}>
          <Text style={{ ...styles.hashLabel, color: ThemeManager.colors.legalGreyColor }}>Intent ID</Text>
        <View style={styles.hashRow}>
          <Text style={{ ...styles.hashText, color: ThemeManager.colors.blackWhiteText }} numberOfLines={1}>
            {txHash}
          </Text>
          <TouchableOpacity onPress={copyToClipboard}>
            <Image
              source={Images.copy1} // ✅ Replace with your copy icon
              style={styles.copyIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Rows */}
      <View style={styles.infoRow}>
        <Text style={{ ...styles.infoLabel, color: ThemeManager.colors.legalGreyColor }}>Status</Text>
        <Text style={{ ...styles.infoValue, color: getStatusText(status)?.color }}>
          {getStatusText(status)?.status}
        </Text>
      </View>
      {swapStatusData?.final_solver_id != "" && <View style={styles.infoRow}>
        <Text style={{ ...styles.infoLabel, color: ThemeManager.colors.legalGreyColor }}>Solver</Text>
        <Text
          numberOfLines={1}
          ellipsizeMode='middle'

          style={{ ...styles.infoValue, color: ThemeManager.colors.blackWhiteText, width: swapStatusData?.final_solver_id ? '50%' : '10%', textAlign: 'center' }}>{swapStatusData?.final_solver_id || "--"}</Text>
      </View>}
      <View style={styles.infoRow}>
        <Text style={{ ...styles.infoLabel, color: ThemeManager.colors.legalGreyColor }}>Network Fee</Text>
        <Text style={{ ...styles.infoValue, color: ThemeManager.colors.blackWhiteText }}>{txnFees}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>

        <View style={{ flex: 1, marginRight: dimen(10) }}>
          <Button
            normalBtn1={true}
            buttontext={"Close"} onPress={onClose} />
        </View>
        <View style={{ flex: 1, marginLeft: dimen(10) }}>
          <Button buttontext={"View on Explorer"} onPress={() => {
            consoleLogFunc("txHash>>22", `${CHAIN_ABSTRACTION_EXPLORER}${txHash}`);
            Linking.openURL(`${CHAIN_ABSTRACTION_EXPLORER}${txHash}`);
          }} />
        </View>
      </View>

      <Toast
        ref={toastRef}
        position="bottom"
        positionValue={350}
        {...({ style: { backgroundColor: ThemeManager.colors.toastBg } } as any)}
      />
    </View>
  );
};

export default SuccessAbstraction;

const styles = StyleSheet.create({
  modalContainer: {
    borderRadius: 16,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  checkIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  hashContainer: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  hashLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashText: {
    flex: 1,
    color: '#222',
    fontSize: 13,
    marginRight: 10,
  },
  copyIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
    resizeMode: 'contain',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#555',
  },
  infoValue: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
});
