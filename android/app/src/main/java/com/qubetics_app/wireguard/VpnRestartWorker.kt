package com.qubetics_app.wireguard

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.Worker
import androidx.work.WorkerParameters

class VpnRestartWorker(appContext: Context, params: WorkerParameters) :
    Worker(appContext, params) {
    override fun doWork(): Result {
        val vpnIntent = Intent(applicationContext, WireguardVpnService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            applicationContext.startForegroundService(vpnIntent)
        } else {
            applicationContext.startService(vpnIntent)
        }
        return Result.success()
    }
}
