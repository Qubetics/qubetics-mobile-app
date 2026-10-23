import { BlurView } from '@react-native-community/blur';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-gesture-handler';
import { LanguageManager } from '../../../LanguageManager';
import { ThemeManager } from '../../../ThemeManager';
import * as Constants from '../../Constants';
import { useKeyboard } from '../../hooks/useKeyboard';
import { Fonts, Images } from '../../theme';
import images from '../../theme/Images';
import { getData } from '../../Utils/MethodsUtils';
import { InputtextSearch } from './InputTextSearch';

export const FilterList = (props: any) => {
  const { commonText } = LanguageManager;
  const [, setThemeSelected] = useState();
  const [searchQuery, setSearchQuery] = useState('');
  const [list, setList] = useState(props.list?.list);
  const { isKeyboardOpen, keyboardHeight } = useKeyboard()
  const { bottom: bottomInset } = useSafeAreaInsets();

  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      setThemeSelected(theme);
    })
  }, []);

  useEffect(() => {
    setList(props.list?.list)
  }, [props.list?.list]);

  const onSearchQueryChange = (query: any) => {
    setSearchQuery(query);
    setList(props.list?.list?.filter((item: any) => item.toLowerCase().includes(query.toLowerCase())));
  }

  //******************************************************************************************/

  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={props.openModel}
      onRequestClose={props.onPressIn}>
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <View style={[styles.centeredView]}>
        <TouchableOpacity onPress={props.onPressIn} style={[styles.centeredView1]} />

        <View style={[styles.modalView, { backgroundColor: ThemeManager.colors.mainBgNew, paddingBottom: 20 + bottomInset }]}>

          <Pressable style={{ paddingVertical: 10 }} onPressIn={props.onPressIn}>
            <Image style={{ alignSelf: 'center', marginTop: 20, tintColor: ThemeManager.colors.primaryColor }} source={Images.modal_top_line} />
          </Pressable>

          <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{commonText.Select}</Text>

          {props?.isCoinListSelected && <InputtextSearch
            placeholder={LanguageManager.commonText.Search}
            value={searchQuery}
            onChangeNumber={onSearchQueryChange}
            style={{ marginTop: 10 }}
            search={!searchQuery}
            pressClear={() => setSearchQuery("")}
          />}
          {props.fromCustom ? props.list?.map((item: any, index: any) => {
            return (
              <TouchableOpacity
                disabled={props.disabled}
                key={index + ''}
                onPress={() => props.onPress(item, index, props.list?.type)}
                style={[styles.touchableStyle, { borderColor: ThemeManager.colors.searchBorderColor }]}
              >
                <Text allowFontScaling={false} style={[styles.textStyle1, { color: ThemeManager.colors.primaryColor }]}>{item}</Text>
              </TouchableOpacity>
            );
          })
            : <View style={{ height: 300 }}>
              <ScrollView>
                {list?.map((item: any, index: any) => {
                  return (
                    <TouchableOpacity
                      disabled={props.disabled}
                      key={index + ''}
                      onPress={() => props.onPress(item, index, props.list?.type)}
                      style={[styles.touchableStyle, { borderColor: ThemeManager.colors.searchBorderColor }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {props?.isCoinListSelected && <Image style={{ height: 20, width: 20, borderRadius: 10, marginRight: 10 }} source={{ uri: (Constants.COIN_IMAGE_BY_SYMBOL as any)[item?.toLowerCase()] }} />}
                        <Text allowFontScaling={false} style={[styles.textStyle1, { color: ThemeManager.colors.blackWhiteText }]}>{item}</Text>
                      </View>
                      {index == props.selectedIndex && <Image style={{ tintColor: ThemeManager.colors.primaryColor }} source={images.tickIcon} />}
                    </TouchableOpacity>
                  );
                })}
                <Text style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText, marginTop: 60 }]}>{list.length > 0 ? '' : commonText.NoListFound}</Text>
              </ScrollView>
            </View>}

          {isKeyboardOpen && <View style={{ height: keyboardHeight - 50 }} />}

        </View>
      </View>
    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  textStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  textStyle1: {
    fontSize: 16,
    fontFamily: Fonts.dmMedium,
  },
  modalView: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: '100%',
    paddingBottom: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#00000077',
  },
  centeredView1: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  touchableStyle: {
    flexDirection: 'row',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
});
