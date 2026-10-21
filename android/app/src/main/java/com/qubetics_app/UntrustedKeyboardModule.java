package com.qubetics_app;



import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class UntrustedKeyboardModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;
    private boolean toastShown = false;

    public UntrustedKeyboardModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "UntrustedKeyboard";
    }

    @ReactMethod
    public void checkForUntrustedKeyboards(final Promise promise) {
        String currentInputMethod = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.DEFAULT_INPUT_METHOD
        );

        if (currentInputMethod == null) {
            promise.resolve(true); // No input method found
            return;
        }

        String packageName = currentInputMethod.split("/")[0];
        Log.e("TAG", "isTrustedKeyboard: " + packageName);

        if (!isTrustedKeyboard(packageName)) {
            if (!toastShown) {
                promise.resolve(false);
                toastShown = true;
                new Handler(Looper.getMainLooper()).postDelayed(() -> toastShown = false, 100);
                return;
            }
        }

        promise.resolve(true); // All keyboards are trusted
    }

    private boolean isTrustedKeyboard(String packageName) {
        String[] trustedKeyboards = new String[]{
                "com.google.android.inputmethod.latin",   // Gboard
                "com.samsung.android.honeyboard",         // Samsung Keyboard
                "com.syntellia.fleksy.keyboard",          // Fleksy Keyboard
                "com.grammarly.android.keyboard",         // Grammarly Keyboard
                "com.menny.android.anysoftkeyboard",      // AnySoftKeyboard
                "com.gamelounge.chroomakeyboard",         // Chrooma Keyboard
                "com.jb.emoji.gokeyboard",                // GO Keyboard
                "com.swiftkey.language",                  // Microsoft SwiftKey Keyboard
                "com.android.inputmethod.latin",          // AOSP LatinIME
                "com.miui.inputmethod",                   // Xiaomi Keyboard
                "com.huawei.inputmethod",                 // Huawei Keyboard
                "com.sonymobile.textinput",               // Sony Xperia Keyboard
                "com.lge.ime",                            // LG Keyboard
                "com.oppo.inputmethod",                   // Oppo Keyboard
                "com.vivo.ime",                           // Vivo Keyboard
                "com.preff.kb.xm"
        };

        for (String trusted : trustedKeyboards) {
            if (trusted.equals(packageName)) {
                return true;
            }
        }
        return false;
    }

}