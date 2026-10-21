import { BlurView } from "@react-native-community/blur";
import Lottie from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import { Colors, Fonts, Images } from "../../theme";
import images from "../../theme/Images";
import { dimen, heightDimen, screenWidth, widthDimen } from "../../Utils";
import SuccessAbstraction from "./SuccessAbstraction";
import { useDispatch } from "react-redux";
import { updateIntentStatus } from "../../Redux/Actions";
import { consoleLogFunc } from "../../Utils/MethodsUtils";
import { getIntentDetails } from "../../Utils/chainAbstractionUtils";

const ProcessingTransaction = ({
  item,
  visible,
  onClose,
  intentHash,
  isFromSwap,
  fees,
  onRefresh,
}: any) => {
  const dispatch = useDispatch();

  const txnFees = `${fees} ${(item?.coin_data?.coin_symbol || item?.coin_symbol)?.toUpperCase()}`


  consoleLogFunc('txnFees----ProcessingTransaction', txnFees, item?.coin_data?.coin_symbol || item?.coin_symbol);
  const timerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swapStatusData, setSwapStatusData] = useState<any>(null);
  const [successAbstractionVisible, setSuccessAbstractionVisible] = useState(false);


  useEffect(() => {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setSuccessAbstractionVisible(false);
    });
    return () => { };
  }, []);

  useEffect(() => {
    if (visible) {
      setSuccessAbstractionVisible(false);
      setTimeout(() => {
        getSwapStatus()
      }, 2000);
    } else {
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [visible, intentHash]);

  const getSwapStatus = async () => {
    consoleLogFunc("getSwapStatus>>11");
    if (visible) {
      consoleLogFunc("getSwapStatus>>222");

      if (!intentHash) {
        setIsLoading(false);
        return
      }

      getIntentDetails(intentHash).then((intentDetails) => {
        if (intentDetails?.intent_status?.toLowerCase() == "pending" || intentDetails?.intent_status?.toLowerCase() == "batched" || intentDetails?.intent_status?.toLowerCase() == "solved") {
          consoleLogFunc("intentDetails>>", intentDetails);
          setSwapStatusData(intentDetails);
          setIsLoading(false);
          setSuccessAbstractionVisible(true);
          if (intentDetails?.intent_status?.toLowerCase() == "solved") {
            updateIntentFunction("completed");
          } else {
            timerRef.current = setTimeout(() => {
              getSwapStatus();
            }, 10000);
          }
        } else {
          timerRef.current = setTimeout(() => {
            getSwapStatus();
          }, 5000);
        }
      }).catch((err) => {
        consoleLogFunc("getIntentDetails error:", err);
        setSuccessAbstractionVisible(false);
        setIsLoading(false);
        timerRef.current = setTimeout(() => {
          getSwapStatus();
        }, 5000);
      });
    }
  };

  const updateIntentFunction = (status: any) => {
    const coinFamily = item?.coin_family
    const url = coinFamily == 3 ? "bitcoin/btc" : "qubetics/tics"
    ;(dispatch as any)(updateIntentStatus(url, { tx_hash: intentHash, tx_status: status })).then((res: any) => {
      consoleLogFunc("res>>", res);
      if (status == "completed") {
        onRefresh && onRefresh();
      }
    }).catch((err: any) => {
      consoleLogFunc("err>>", err);
    });
  };

  return (
    <Modal
      onRequestClose={() => {
        if (intentHash) {
          onClose();
        }
      }}
      visible={visible}
      transparent
      animationType="fade"
    >
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: ThemeManager.colors.mnemonicsBg },
          ]}
        >
          {
            intentHash &&
            <TouchableOpacity onPress={onClose}
              style={{ position: 'absolute', top: dimen(10), right: dimen(10), padding: 20, zIndex: 2 }}
            >
              <Image source={images.closeIcon} style={{ width: dimen(25), height: dimen(25) }} />
            </TouchableOpacity>
          }
          {isLoading ? (
            <ActivityIndicator size="large" color="#00bfff" />
          ) : successAbstractionVisible && swapStatusData?.status == 'success' ? (
            <SuccessAbstraction
              visible={successAbstractionVisible}
              onClose={() => {
                onClose();
              }}
              txnFees={txnFees}
              swapStatusData={swapStatusData}
            />
          ) : (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Lottie
                style={{ height: heightDimen(150), width: widthDimen(150) }}
                source={Images.blueLoader}
                autoPlay
                loop={true}
              />
              <Text
                onPress={onClose}
                style={[
                  styles.title,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                Processing Transaction
              </Text>
              <Text style={[styles.subtitle, { color: Colors.grayIcon }]}>
                Transaction under confirmation...
              </Text>

              <View style={styles.stepContainer}>
                <StepItem
                  label="Validating transaction"
                  checked={"validating"}
                  inProgress={"validating"}
                />
                <StepItem
                  label="Broadcasting to network"
                  checked={""}
                  inProgress={"broadcasting"}
                />
              </View>
              {
                intentHash && (
                  <View style={{
                    marginTop: dimen(10),
                    marginHorizontal: dimen(25),
                    backgroundColor: ThemeManager.colors.inputBgNew,
                    padding: dimen(10),
                    borderRadius: dimen(10),
                    flexDirection: "row"
                  }}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={[styles.transactionHash, { color: ThemeManager.colors.blackWhiteText }]}>
                      {intentHash}
                    </Text>

                  </View>
                )
              }

              <Text style={[styles.note, { color: Colors.grayIcon }]}>
                This may take a few minutes depending on network congestion
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ProcessingTransaction;

const StepItem = ({ label, checked, inProgress }: any) => (
  <View style={styles.stepItem}>
    <Text
      style={[styles.stepLabel, { color: ThemeManager.colors.blackWhiteText }]}
    >
      {label}
    </Text>
    {checked ? (
      <Image
        source={images.tickIcon}
        style={{ tintColor: Colors.profitColor }}
      />
    ) : inProgress ? (
      <Lottie
        style={{
          height: heightDimen(50),
          width: widthDimen(50),
          marginBottom: dimen(10),

        }}
        source={Images.blueLoader}
        autoPlay
        loop={true}
      />
    ) : (
      <Image
        source={images.tickIcon}
        style={{ tintColor: Colors.profitColor }}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: screenWidth - dimen(60),
    minHeight: screenWidth - dimen(60),
    borderRadius: dimen(30),
    padding: dimen(20),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: dimen(12),
    fontSize: dimen(20),
    fontFamily: Fonts.dmBold,
  },
  subtitle: {
    fontSize: dimen(14),
    color: "#444",
    marginVertical: dimen(10),
    textAlign: "center",
    fontFamily: Fonts.dmRegular,
  },
  stepContainer: {
    width: "100%",
    marginTop: dimen(10),
    paddingHorizontal: dimen(10),
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: dimen(10),
    justifyContent: "space-between",
  },
  stepLabel: {
    marginLeft: dimen(10),
    fontSize: dimen(16),
    color: "#333",
  },
  note: {
    fontSize: dimen(12),
    color: Colors.textColor,
    textAlign: "center",
    marginVertical: dimen(30),
    maxWidth: "80%",
  },

  transactionHash: {
    fontSize: dimen(12),
    color: ThemeManager.colors.blackWhiteText,
    fontFamily: Fonts.dmRegular,
  },
});
