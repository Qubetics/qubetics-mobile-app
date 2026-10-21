import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeManager } from '../../../ThemeManager';
import { dimen } from '../../Utils';
import fonts from '../../theme/Fonts';
import colors from '../../theme/Colors';
import Accordion from './Accordion';
const AccordionAny: any = Accordion;
import { bigNumberSafeMath, toFixedExp } from '../../Utils/MethodsUtils';

const cardWidth = dimen(382);
const cardHeight = dimen(75);


const CommonView = ({
  viewStyle,
  ImgSrc,
  leftText,
  bottomText,
  dropDownIcon,
  ImageIcons,
  colors,
  fonts,
  isSafeAppleReview,
  price,
  formattedDenom,
  fiatPrice,
  daysValue
}: any) => {
  return (
    <View style={viewStyle}>
       <View style={styles.iconWrapper}>
          <Image
            source={ImgSrc || ImageIcons.creditScore}
            style={styles.iconImage}
            resizeMode="cover"
          />
        </View>
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.creditsText,
            { color: colors.blackWhiteText, fontFamily: fonts.dmMedium },
          ]}>
          {leftText ? leftText : isSafeAppleReview ? `${price} ${formattedDenom?.toUpperCase()}` : `$${fiatPrice} (${price} ${formattedDenom?.toUpperCase()})`}
        </Text>
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[
            styles.priceText,
            {
              color: colors.blackWhiteText,
              fontFamily: fonts.dmMedium,
            },
          ]}>
          {bottomText || daysValue}
        </Text>
      </View>
      {dropDownIcon && (
        <Image
          source={ImageIcons.creditDropDown}
          style={styles.dropDownIcon}
        />
      )}
    </View>
  );
};

const CreditScoreCard = ({

  index,
  onPressBtn,
  item,
  disabled = false,
  expanded,
  isSafeAppleReview
}: any) => {
  const { colors, ImageIcons } = ThemeManager;

  const price = toFixedExp(bigNumberSafeMath(item?.prices?.[0]?.quote_value, "/", 10 ** 18), 2);
  const fiatPrice = toFixedExp(item?.prices_in_usd, 2);
  const denom = item?.prices?.[0]?.denom ?? '';
  const formattedDenom = denom.charAt(0).toUpperCase() + denom.slice(1);
  const hours = Number(item?.hours ?? 0);
  const daysValue =
    hours >= 24
      ? `${Math.floor(hours / 24)} Day${Math.floor(hours / 24) > 1 ? 's' : ''}`
      : `${hours} Hour${hours !== 1 ? 's' : ''}`;
  const isOpen = expanded[item?.plan_id] ?? false;

  const commonProps = {
    ImageIcons,
    colors,
    fonts,
    isSafeAppleReview,
    price,
    formattedDenom,
    fiatPrice,
    daysValue
  };

  const planSelected = (i: any) => {
    onPressBtn(i);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => planSelected(item)}
        disabled={disabled}
        style={{
          alignSelf: 'center',
          marginBottom: dimen(10),
        }}>
        {isOpen ? (
          <LinearGradient
            colors={['#85FFC4', '#5CC6FF', '#BC85FF']}
            style={[
              styles.gradientBorder,
              { width: cardWidth, borderRadius: dimen(14), height: cardHeight },
            ]}>
            <CommonView
              {...commonProps}
              viewStyle={[styles.card, styles.LinearGradient]}
              dropDownIcon={isOpen}
            />
          </LinearGradient>
        ) : (
          <CommonView
            {...commonProps}
            viewStyle={[styles.card, styles.subPlanCard]}
            dropDownIcon={isOpen}
          />
        )}
      </TouchableOpacity>
      <AccordionAny isExpanded={isOpen} viewKey={`plan_${item.plan_id}`}>
        {item?.countries?.map((country: any, index: any) => (
          <CommonView
            {...commonProps}
            key={index}
            viewStyle={[styles.card, styles.subPlanCard]}
            ImgSrc={{ uri: country?.flag_url }}
            leftText={country?.country}
            bottomText={country?.node_count}
            dropDownIcon={false}
          />
        ))}
      </AccordionAny>
    </>
  );
};


export default CreditScoreCard;

const styles = StyleSheet.create({
  gradientBorder: {

    borderRadius: dimen(14),
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: dimen(16),
    borderRadius: dimen(14),
  },
  iconWrapper: {
    width: dimen(46),
    height: dimen(46),
    borderRadius: dimen(23),
        overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
    iconImage: {
    width: '100%',
    height: '100%',
    transform: [{scale: 1.25}, {translateY: dimen(2)}],
  },
  subPlanCard: {
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    width: cardWidth,
    borderColor: (ThemeManager.colors as any).borderGrey,
    borderWidth: 1,
    height: cardHeight,
    alignItems: 'center',
    alignSelf: 'center',
  },
  LinearGradient: {
    width: cardWidth - 4,
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,

    borderRadius: dimen(14) - 2,
    margin: 2
  },
  dropDownIcon: {
    width: dimen(13),
    height: dimen(7.5),
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    marginLeft: dimen(10),
  },
  creditsText: {
    fontSize: dimen(16),
  },
  priceText: {
    fontSize: dimen(14), // default fallback; actual used font is set inline
    color: colors.placeHolderText,
  },
});
