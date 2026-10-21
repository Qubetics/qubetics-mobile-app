package com.qubetics_app;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

/**
 * Root detection per security audit:
 * - Check for su binaries at: /system/bin/su, /system/xbin/su, /sbin/su, /system/su, /system/bin/.ext/.su
 * - Attempt su directly; if exec succeeds, device is rooted
 * - Optional: integrate SafetyNet/Play Integrity API for device attestation (block if checks fail)
 */
public class EncryptionModule extends ReactContextBaseJavaModule {

    private static final String[] SU_BINARY_PATHS = {
        "/system/bin/su",
        "/system/xbin/su",
        "/sbin/su",
        "/system/su",
        "/system/bin/.ext/.su"
    };

    private static final String ROOTED = "It is rooted device";
    private static final String NOT_ROOTED = "It is not rooted device";

    EncryptionModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "EncryptionModule";
    }

    /**
     * Check if any known su binary exists (audit: check for existing su binaries).
     */
    private boolean hasSuBinary() {
        for (String path : SU_BINARY_PATHS) {
            try {
                File f = new File(path);
                if (f.exists()) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    /**
     * Try su directly (audit: attempt su and detect if root was granted).
     * Frida hook detection: "fakecommand" in error message indicates tampering.
     */
    @ReactMethod
    public void rootStatus(Promise promise) {
        try {
            if (hasSuBinary()) {
                promise.resolve(ROOTED);
                return;
            }
            Process process = null;
            try {
                process = Runtime.getRuntime().exec("su");
                promise.resolve(ROOTED);
                return;
            } catch (Exception e) {
                String msg = e.getMessage();
                boolean isFrida = msg != null && msg.contains("fakecommand");
                if (isFrida) {
                    promise.resolve(ROOTED);
                    return;
                }
            } finally {
                if (process != null) {
                    try {
                        process.destroy();
                    } catch (Exception ignored) {
                    }
                }
                promise.resolve(NOT_ROOTED);
            }
        }catch (Exception e) {
            promise.reject("ROOT_CHECK_ERROR", e);
        }
    }
    
      @ReactMethod
    public void clearApplicationData() {
        File cache = getCurrentActivity().getCacheDir();
        File appDir = new File(cache.getParent());
        if (appDir.exists()) {
            String[] children = appDir.list();
            Log.e("Listtttttt", appDir.list().toString());
            for (String s : children) {
                if (!s.equals("lib") && s.equals("shared_prefs")) {
                    deleteDir(new File(appDir, s));
                }
            }
        }
    }
    public static boolean deleteDir(File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            for (int i = 0; i < children.length; i++) {
                boolean success = deleteDir(new File(dir, children[i]));
                if (!success) {
                    return false;
                }
            }
        }

        return dir.delete();
    }
}
