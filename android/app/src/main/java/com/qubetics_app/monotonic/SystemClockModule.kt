package com.qubetics_app.monotonic

import android.os.SystemClock
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemClockModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SystemClockModule"

  @ReactMethod
  fun getSystemClocks(promise: Promise) {
      try {
          val monotonicNs = SystemClock.elapsedRealtimeNanos()
          promise.resolve(monotonicNs.toDouble())
      } catch (e: Exception) {
          promise.reject("ERR_CLOCK", e)
      }
  }
}
