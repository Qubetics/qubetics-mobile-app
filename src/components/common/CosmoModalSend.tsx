import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { moderateScale } from '../../layouts/responsive';
import Singleton from '../../Singleton';
import { Fonts } from '../../theme';
import images from '../../theme/Images';
import CommonModal from './CommonModal';

export const CosmoModalSend = (props: any) => {
  const AddressList = [
    { title: 'Qubetics Address', address: Singleton.getInstance().defaultTicsAddress, key: 'evm' },
    { title: 'Cosmos Address', address: Singleton.getInstance().defaultCosmosAddress, key: 'cosmo' },
  ];

  return (
    <CommonModal
      visible={props.openModel}
      onClose={props.onPressIn}
    >
      <TouchableOpacity
        onPress={props.onPressIn}
        style={styles.closeButton}
      >
        <Image resizeMode="contain" source={ThemeManager.ImageIcons.crossIconNew} />
      </TouchableOpacity>

      <Text
        allowFontScaling={false}
        style={[styles.title, { color: ThemeManager.colors.blackWhiteText }]}
      >
        {'Select Address'}
      </Text>

      <View style={styles.listContainer}>
        {AddressList.map((item, index) => (
          <TouchableOpacity
            activeOpacity={1}
            key={index + ''}
            onPress={() => props.onPressItem(item, index)}
            style={styles.itemRow}
          >
            <View style={[styles.itemInner, { borderColor: ThemeManager.colors.borderColor }]}>
              <View style={styles.itemText}>
                <Text
                  allowFontScaling={false}
                  style={[styles.itemTitle, { color: ThemeManager.colors.blackWhiteText }]}
                >
                  {item.title}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.itemAddress, { color: ThemeManager.colors.legalGreyColor }]}
                >
                  {item?.address?.substring(0, 23) + '...'}
                </Text>
              </View>

              {props.showShare && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => props.copy(item)}>
                    <Image
                      source={images.copy1}
                      resizeMode="contain"
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={() => props.Share(item)}>
                    <Image
                      source={images.share}
                      resizeMode="contain"
                      style={[styles.icon, { width: moderateScale(26) }]}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </CommonModal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
    marginTop: 10,
  },
  title: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    borderRadius: 20,
  },
  itemRow: {
    width: '100%',
  },
  itemInner: {
    padding: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Fonts.dmRegular,
  },
  itemAddress: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 10,
  },
  iconButton: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    height: moderateScale(20),
    width: moderateScale(20),
    resizeMode: 'contain',
  },
});
