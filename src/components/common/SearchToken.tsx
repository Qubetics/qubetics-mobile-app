import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { horizontalScale, moderateScale, verticalScale } from '../../layouts/responsive';
import { Actions } from '../../navigation/RootNavigation';
import Singleton from '../../Singleton';
import { Fonts, Images } from '../../theme';
import { useKeyboard } from '../../hooks/useKeyboard';
import { checkKeyboards } from '../../Utils/MethodsUtils';

const SearchToken = (props: any) => {
  const [istouch, setistouch] = useState(false);
  const { isKeyboardOpen } = useKeyboard();

  useEffect(() => {
    if (isKeyboardOpen && Platform.OS === "android") {
      checkKeyboards();
    }
  }, [isKeyboardOpen]);
  //******************************************************************************************/
  return (
    <View
      style={{
        flexDirection: "row",

        marginTop: verticalScale(20),
      }}
    >
      <View
        style={[{
          flexDirection: "row",
          borderWidth: 0.5,
          borderColor: "rgba(115, 115, 115, 0.5)",
          alignItems: "center",
          flex: 1,
          borderRadius: moderateScale(10),
          paddingHorizontal: 10,
          marginRight: 10
        }, props.viewStyle]}
      >
        <View>
          <Image
            style={[
              {
                height: 22,
                width: 22,
                resizeMode: "contain",
              },
            ]}
            source={ThemeManager.ImageIcons.searchIcon}
          />
        </View>
        <TextInput
          placeholderTextColor={"#737373"}
          placeholder="Search Assets"
          style={{
            paddingLeft: horizontalScale(5),
            color: ThemeManager.colors.blackWhiteText,
            height: moderateScale(40),

            width: '90%'
          }}
          value={props.value}
          onChangeText={(text) => {
            props.onChangeText(text)
          }}
          onSubmitEditing={(e) => props.onSubmitEditing(e.nativeEvent?.text)
          }
          {...props?.inputProps}

        />
      </View>
      {props.isIconsShow && <TouchableOpacity
        disabled={istouch}
        style={{ marginRight: 10 }}
        onPress={() => {
          setistouch(true)
          props.manage()
          setTimeout(() => {
            setistouch(false)
          }, 2000);

        }
        }>

        <Image
          source={ThemeManager.ImageIcons.manageIcon}
          resizeMode={"contain"}
          style={{ width: moderateScale(40), height: moderateScale(40) }}
        />
      </TouchableOpacity>}
      {props.isIconsShow && <TouchableOpacity
        disabled={istouch || Singleton.getInstance().isMakerWallet}

        style={{}}
        onPress={() => {
          setistouch(true)
          Actions.currentScene != "AddressBook" &&
            (Actions as any).AddressBook({ symbol: "all" });
          setTimeout(() => {
            setistouch(false)
          }, 2000);

        }}

      >
        <Image
          source={ThemeManager.ImageIcons.addPeopleicon}
          resizeMode={"contain"}
          style={{ width: moderateScale(40), height: moderateScale(40) }}
        />
      </TouchableOpacity>}

    </View>
  );
};
const PortfolioManageButton = (props: any) => {

  //******************************************************************************************/
  return (
    <View
      style={[{
        flexDirection: "row",
        marginTop: props.marginTop ?props.marginTop: verticalScale(20),
      }]}
    >
      <View
        style={[{
          flex: 1,
          borderRadius: moderateScale(10),
          paddingHorizontal: 10,

        }, props.viewStyle]}
      >
        <Text style={{
          color: ThemeManager.colors.blackWhiteText,
          fontSize: moderateScale(18),
          lineHeight: moderateScale(24.84),
          fontFamily: Fonts.dmMedium
        }}>Crypto</Text>
      </View>

      <TouchableOpacity
        style={{ marginRight: 10 }}
        onPress={() => {
          props.nft()
        }}
      >
        <Image
          source={Images.nftButtonIcon}
          resizeMode={"contain"}
          style={{ width: moderateScale(40), height: moderateScale(40) }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginRight: 10 }}
        onPress={() => {
          props.manage()
        }
        }>
        <Image
          source={ThemeManager.ImageIcons.manageIcon}
          resizeMode={"contain"}
          style={{ width: moderateScale(40), height: moderateScale(40) }}
        />
      </TouchableOpacity>



    </View>
  );
};



export { SearchToken, PortfolioManageButton };



