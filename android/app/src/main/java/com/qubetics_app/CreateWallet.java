package com.qubetics_app;


import androidx.annotation.NonNull;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.json.JSONObject;

public class CreateWallet extends ReactContextBaseJavaModule {

    CreateWallet(ReactApplicationContext context) {
        super(context);
        System.loadLibrary("TrustWalletCore");
    }

    @NonNull
    @Override
    public String getName() {
        return "CreateWallet";
    }

    @ReactMethod
    public void generateMnemonics(Callback callback) {
        wallet.core.jni.HDWallet wallet = new wallet.core.jni.HDWallet(128, "");
        String mnemonics = wallet.mnemonic();
        JSONObject addresses = WalletHandler.generateAddresses(mnemonics);
        callback.invoke(addresses.toString());
    }

    @ReactMethod
    public void generateAddressFromMnemonics(String mnemonics, Callback callback) {
        JSONObject addresses = WalletHandler.generateAddresses(mnemonics);
        callback.invoke(addresses.toString());
    }

    @ReactMethod
    public void clearGarbageCollection() {
        System.runFinalization();
        Runtime.getRuntime().gc();
        System.gc();
    }

}
