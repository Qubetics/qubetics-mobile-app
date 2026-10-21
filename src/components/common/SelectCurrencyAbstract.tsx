/* eslint-disable react-native/no-inline-styles */
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { dimen, widthDimen } from "../../Utils";
import { Fonts, Images } from "../../theme";
import { bigNumberSafeMath, toFixedExp } from "../../Utils/MethodsUtils";
import Singleton from "../../Singleton";

const SelectCurrencyAbstract = (props: any) => {
  // BUG PRESERVED: `x > 7 ?? false` - right operand of ?? is unreachable (comparison is never nullish)
  // @ts-ignore
  let lenCoinNameGt = props?.item?.coin_name?.length > 7 ?? false; // manage high amount input

  /******************************************************************************************/

  /******************************************************************************************/
  return (
    <View
      style={[
        styles.container,
        { borderColor: ThemeManager.colors.borderColor },
      ]}
    >
      {/* Available Balance & Max */}
      <View style={styles.balanceRow}>
        <Text
          style={[styles.label, { color: ThemeManager.colors.blackWhiteText }]}
        >
          {props?.isfrom ? "From" : "TO"}
        </Text>
       {props?.isMax ? <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              styles.label,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            Available:
          </Text>
          <Text
            style={[
              styles.balanceText,
              { color: ThemeManager.colors.legalGreyColor },
            ]}
          >

            {props?.item?.balance > 0 ? toFixedExp(props?.item?.balance ?? "0.00000000", 8) : '0.00000000'} {props?.item?.coin_symbol?.toUpperCase()}
          </Text>
          {props?.isMax && (
            <TouchableOpacity onPress={props.onPressMax} style={styles.maxButton}>
              <Text
                style={[
                  styles.maxText,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                MAX
              </Text>
            </TouchableOpacity>
          )}
        </View> : <View/>}
      </View>

      {/* Token Box */}
      <View
        style={[
          styles.tokenBoxOuter,
          { backgroundColor: ThemeManager.colors.mnemonicsBg },
        ]}
      >
        <View style={[styles.tokenBox]}>
          <TouchableOpacity
            onPress={props.onPressCoin}
            style={[
              styles.tokenRow,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            {/* Token Icon */}
            <Image
              source={{ uri: props?.item?.coin_image }} // Replace with actual token icon
              style={styles.tokenIcon}
            />
            <View style={{ marginLeft: 8 }}>
              <Text
                style={[
                  styles.tokenSymbol,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {props?.item?.coin_symbol?.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.tokenName,
                  { color: ThemeManager.colors.legalGreyColor },
                ]}
              >
                {props?.item?.coin_name}
              </Text>
            </View>
            <Image source={Images.dropDown} style={styles.imageStyle} />
          </TouchableOpacity>

          {/* Amount Input */}
          <View style={[styles.inputContainer, lenCoinNameGt && {paddingLeft: widthDimen(8)}]}>
            <TextInput
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                {
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}
              placeholderTextColor={ThemeManager.colors.legalGreyColor}
              onChangeText={props.onChangeNumber}
              placeholder={props.placeholder || "0.0"}
              editable={props.editable}
              maxLength={props.maxLength}
              value={(props.value ?? "").replace(/\n/g, "")}
              onBlur={props.onBlur}
              multiline={false}
              numberOfLines={1}
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              scrollEnabled={true}
              textAlign="right"
               
            />
          </View>
          {props?.onPressUSD && <TouchableOpacity
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} style={{ alignSelf: 'center', marginLeft: 3 }} onPress={props.onPressUSD}>
            <Text style={[styles.usdText]}>{props?.isUSD ? "USD" : props?.item?.coin_symbol?.toUpperCase()}</Text>

          </TouchableOpacity>}
        </View>
        {/* USD Equivalent */}

        <Text
          style={[
            styles.usdText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}
        >
          ≈ {(props?.onPressUSD && props?.isUSD) ? "" : Singleton.getInstance().CurrencySymbol}
          {props?.onPressUSD ? (props?.valueInFiat || "0.00") : props?.value ? toFixedExp(bigNumberSafeMath(props?.item?.fiat_price_data?.value, "*", props?.value), 2) : "0.00"}
          {" "}{(props?.onPressUSD && props?.isUSD) ? props?.item?.coin_symbol?.toUpperCase() : ""}
        </Text>
      </View>
      {/* From Address */}
      <Text
        style={{
          ...styles.textStyle,
          color: ThemeManager.colors.blackWhiteText,
        }}
      >
        {props?.isfrom ? "From" : "To"} Address
      </Text>
      {props?.isfrom ? (
        <>
          <View
            style={[
              styles.addressBox,
              { backgroundColor: ThemeManager.colors.mnemonicsBg },
            ]}
          >
            <View style={styles.greenDot} />
            <Text style={styles.addressText}>{props?.fromAddress}</Text>
          </View>
        </>
      ) : (
        <View style={[
          styles.input,
          { backgroundColor: ThemeManager.colors.inputBgNew, },
        ]}>
          <TextInput
            style={{ fontFamily: Fonts.dmRegular, fontSize: dimen(14),
              color: ThemeManager.colors.blackWhiteText, flex: 1 }}
            placeholderTextColor={ThemeManager.colors.legalGreyColor}
            placeholder={props.placeholder || "Enter recipient address"}
            editable={props.editable1}
            maxLength={props.maxLength}
            value={props.toAddress}
            numberOfLines={1}
            onChangeText={props.onChangeAddress}
          />
          <TouchableOpacity style={{ marginLeft: widthDimen(10), backgroundColor: ThemeManager.colors.statusBarColor, padding: dimen(5), borderRadius: dimen(5) }} onPress={props.onPressPaste}>
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  container: {
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  balanceText: {
    marginLeft: widthDimen(4),
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  maxButton: {
    backgroundColor: "#2a3b6b",
    paddingHorizontal: widthDimen(10),
    paddingVertical: dimen(4),
    borderRadius: dimen(6),
    marginLeft: widthDimen(10),
  },
  maxText: {
    color: "#56a8ff",
    fontSize: dimen(14),
    fontWeight: "600",
  },
  tokenBoxOuter: {
    backgroundColor: "#131a2a",
    padding: dimen(16),
    borderRadius: dimen(12),
    marginBottom: dimen(12),
    marginTop: dimen(10),
  },
  tokenBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: dimen(10),
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: dimen(10),
    borderRadius: dimen(10),
  },
  tokenIcon: {
    width: dimen(32),
    height: dimen(32),
    borderRadius: dimen(16),
    backgroundColor: "#222",
  },
  tokenSymbol: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
  },
  tokenName: {
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  amountInput: {
    fontSize: dimen(21),
    fontFamily: Fonts.dmSemiBold,
    padding: 0,
    paddingVertical: 0,
    width: '100%',
    lineHeight: dimen(25),
    textAlign: "right",
  },
  usdText: {
    fontSize: dimen(12),
    color: ThemeManager.colors.legalGreyColor,
    textAlign: "right",
    fontFamily: Fonts.dmRegular,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: dimen(12),
    borderRadius: 8,
  },
  greenDot: {
    width: dimen(10),
    height: dimen(10),
    borderRadius: dimen(5),
    backgroundColor: "#38d05f",
    marginRight: widthDimen(8),
  },
  addressText: {
    color: "#ccc",
    fontSize: dimen(14),
    marginRight: widthDimen(12),
    fontFamily: Fonts.dmRegular
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: widthDimen(10),
    justifyContent: "center",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  imageStyle: {
    width: 10,
    height: 10,
    resizeMode: "contain",
    marginLeft: 10,
  },
  textStyle: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
    marginBottom: dimen(10),
  },
  input: {
    borderRadius: dimen(10),
    paddingVertical: dimen(1),
    paddingHorizontal: dimen(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  pasteText: {
    color: ThemeManager.colors.primaryColor,
    fontSize: dimen(14),
    fontFamily: Fonts.dmBold,
  },
});

export { SelectCurrencyAbstract };
