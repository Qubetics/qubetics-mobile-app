import { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground
} from "react-native";
import { EventRegister } from "react-native-event-listeners";

import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { getData, saveData } from "../../../Utils/MethodsUtils";
import images from "../../../theme/Images";
import { CardView, HeaderMain } from "../../common";
import { styles } from "./styles";

const AUTO_LOCK_TIMES = [0, 60000, 300000, 900000, 1800000];

const AutoLock = () => {
  const { pins } = LanguageManager;
  const [selectedIndexAutoLock, setSelectedIndexAutoLock] = useState(0);

  const autoauthenticationsList = [
    { title: "Off" },
    { title: "Within 1 min" },
    { title: "Within 5 mins" },
    { title: "Within 15 mins" },
    { title: "Within 30 mins" },
  ];

  useEffect(() => {
    let isMounted = true;
  
    const fetchTimeout = async () => {
      const time = await getData(Constants.AUTO_LOCK_TIMEOUT);
      if (!isMounted) return;
      const index = AUTO_LOCK_TIMES.indexOf(Number(time));
      setSelectedIndexAutoLock(index !== -1 ? index : 0);
    };
  
    fetchTimeout();
  
    return () => {
      isMounted = false;
    };
  }, []);

  const itemPressedLockItem = async (item: any, index: any) => {
    const time = AUTO_LOCK_TIMES[index];

    await saveData(Constants.AUTO_LOCK_TIMEOUT, time);
    Singleton.getInstance().dappDisconnectTimeout = time;
    EventRegister.emit("turnOffDapp");
    setSelectedIndexAutoLock(index);
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain
        BackButtonText={pins.autoLock}
        customStyle={{ paddingHorizontal: widthDimen(24) }}
      />

      <FlatList
        showsVerticalScrollIndicator={false}
        data={autoauthenticationsList}
        style={{ marginTop: heightDimen(4) }}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const isSelected = selectedIndexAutoLock === index;
          return (
            <CardView
              viewStyle={{ justifyContent: "center" }}
              leftImg
              leftImgIcon={isSelected ? images.fillCheckBox : images.unCheckedIcon}
              imgStyleLeft={{
                tintColor: isSelected ? undefined : ThemeManager.colors.dropDownColor,
                ...styles.checkImg,
              }}
              leftText={item.title}
              fromTheme
              hideBottom={false}
              onPress={() => itemPressedLockItem(item, index)}
              mainStyle={{ marginTop: dimen(0) }}
            />
          );
        }}
      />
    </ImageBackground>
  );
};

export default AutoLock;
