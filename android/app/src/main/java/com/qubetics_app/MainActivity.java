package com.qubetics_app;

import android.os.Bundle;
import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.qubetics_app.wireguard.SmartDnsSelector;

import okhttp3.OkHttpClient;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(null); // Passing null to prevent state restoration issues after crash/background
    
    OkHttpClientProvider.setOkHttpClientFactory(new OkHttpClientFactory() {
      @Override
      public OkHttpClient createNewNetworkModuleClient() {
        return OkHttpClientProvider.createClientBuilder()
                .dns(new SmartDnsSelector()) // Use our IPv4-preferred logic
                .build();
      }
    });
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "qubetics_app";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(this, getMainComponentName(), true);
  }
}
