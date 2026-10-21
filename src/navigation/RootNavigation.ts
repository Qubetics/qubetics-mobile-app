
import { createNavigationContainerRef, CommonActions, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

class ActionsClass {
  get currentScene() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute()?.name;
    }
    return null;
  }

  push(scene: string, params?: any) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(scene, params);
    }
  }

  pop() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }

  reset(scene: string) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: scene }],
        })
      );
    }
  }

  jump(scene: string, params?: any) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(scene, params);
    }
  }

  replace(scene: string, params?: any) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(scene, params));
    }
  }
}

const actionsInstance = new ActionsClass();

// Any property not on the class is treated as a screen name, so
// Actions.<AnyScreen>(params) works for every route. That is expressed by the
// Record intersection; enumerating the real route names from Router would give
// typed navigation but is a separate change.
export const Actions = new Proxy(actionsInstance, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    // If a property like Actions.WalletMain({ type: 'reset' }) is called:
    return (params: any = {}) => {
      if (navigationRef.isReady()) {
        const type = params.type;
        if (type === 'reset' || type === ActionConst.RESET) {
          actionsInstance.reset(prop as string);
        } else if (type === 'replace' || type === ActionConst.REPLACE) {
          navigationRef.dispatch(StackActions.replace(prop as string, params));
        } else {
          navigationRef.navigate(prop as string, params);
        }
      }
    };
  }
}) as ActionsClass & Record<string, (params?: any) => void>;

// Polyfill for ActionConst
export const ActionConst = {
  RESET: 'reset',
  REPLACE: 'replace',
};
