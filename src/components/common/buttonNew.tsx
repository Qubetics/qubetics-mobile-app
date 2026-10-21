import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import * as Constants from '../../Constants';
import { consoleLogFunc } from '../../Utils/MethodsUtils';
import { AppAlert } from './AppAlert';

const ButtonNew = (props: any) => {
  const [AlertDialog, showAlertDialog] = useState(false);
  const [alertTxt] = useState('');

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      showAlertDialog(false);
    });
  }, []);

  /******************************************************************************************/
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={props.disabled}
        style={[styles.buttonStyle, props.style]}
        onPress={() => {
          consoleLogFunc('global.isConnected::::', (global as any).isConnected);
            props.onPress();
        }}>
        {props.children}
      </TouchableOpacity>

      <AppAlert
        visible={AlertDialog}
        alertTxt={alertTxt}
        hideAlertDialog={() => { showAlertDialog(false) }}
      />
    </>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  buttonStyle: {
  },
});

export { ButtonNew };
