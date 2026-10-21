import { View, Image, TouchableOpacity, Linking } from "react-native";
import { StyleSheet } from "react-native";
import Swiper from "react-native-swiper";
import { ThemeManager } from "../../../../ThemeManager";
import { BASE_IMAGE_URL } from "../../../EndPoint";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";

const OnboardingSwiper = (props: any) => {
    const { arr } = props;        
    return (
        <View
            style={{
                justifyContent: "center",
                height: 130,
            }}
        >
            <Swiper
                loop={true}
                activeDotColor={ThemeManager.colors.mnemonicsBg}
                dotColor={ThemeManager.colors.legalGreyColor}
                paginationStyle={{ marginHorizontal: 5 }}
                autoplay={true}
            >
                {arr?.length > 0 &&
                    arr.map((item: any, index: any) => {
                        let imageUrl = BASE_IMAGE_URL +"/" + item?.image_path;
                        consoleLogFunc("item---", item);
                        consoleLogFunc("imageUrl---", imageUrl);

                        return (
                                <TouchableOpacity style={styles.listView} onPress={() => Linking.openURL(item?.link)}>
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.logoStyle}
                                    />
                                </TouchableOpacity>

                        );
                    })}
            </Swiper>
            <View></View>
        </View>
    );
};

export default OnboardingSwiper;

const styles = StyleSheet.create({
    listView: {
        alignItems: "center",
        flex: 1,
        paddingHorizontal: 5,
    },
    logoStyle: {
        alignSelf: "center",
        marginVertical: 10,
        height: 100,
        width: "100%",
        resizeMode:'stretch',
        borderRadius: 10,
    },
});
