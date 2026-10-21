package com.qubetics_app.wireguard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.system.OsConstants
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.qubetics_app.MainActivity
import com.qubetics_app.R
import com.wireguard.config.Config
import okhttp3.OkHttpClient
import java.io.ByteArrayInputStream
import java.io.FileInputStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit



class WireguardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val CHANNEL_ID = "WireGuardVpnChannel"
    private val TAG = "WireguardVpnService"

    // ✅ OkHttpClient uses system DNS - when WireGuard VPN (wg0) is active,
    // all DNS queries automatically route through WireGuard's DNS servers (1.1.1.1, 8.8.8.8, 9.9.9.9)
    // configured in setupTunnel(). No custom DNS resolver needed!
    val client = OkHttpClient.Builder()
        .eventListener(NetworkTimingListener())
        .connectTimeout(30, TimeUnit.SECONDS)  // ✅ Reduced from 240s
        .readTimeout(240, TimeUnit.SECONDS)
        .writeTimeout(240, TimeUnit.SECONDS)
        .callTimeout(240, TimeUnit.SECONDS)
        // ✅ Use system DNS - automatically uses WireGuard DNS (wg0) when VPN is active
        .dns(okhttp3.Dns.SYSTEM)
        .build()
    @RequiresApi(Build.VERSION_CODES.Q)
    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {

        // MUST be called immediately
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    1,
                    createNotification(),
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST
                )
            } else {
                startForeground(
                    1,
                    createNotification()
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground service", e)
            stopSelf()
            return START_NOT_STICKY
        }

        Thread {
            try {
                val configStr =
                    intent?.getStringExtra("WIREGUARD_CONFIG")

                if (configStr.isNullOrEmpty()) {
                    Log.e(TAG, "WIREGUARD_CONFIG is null")
                    stopSelf()
                    return@Thread
                }

                Log.d(TAG, "Parsing WireGuard config")

                val config = Config.parse(
                    ByteArrayInputStream(
                        configStr.toByteArray(StandardCharsets.UTF_8)
                    )
                )

                Log.d(TAG, "Setting up tunnel")

                if (!setupTunnel(config)) {
                    Log.e(TAG, "Failed to setup VPN tunnel")
                    stopSelf()
                    return@Thread
                }

                Log.i(TAG, "VPN tunnel established successfully")

                startPacketLogging()

            } catch (e: Exception) {
                Log.e(TAG, "VPN startup failed", e)
                stopSelf()
            }
        }.start()

        return START_STICKY
    }

    @RequiresApi(Build.VERSION_CODES.M)
    private fun bindAppToVpnNetwork() {
        val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_VPN)
            .build()

        cm.requestNetwork(request, object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.i(TAG, "✅ VPN Network available, binding process")
                ConnectivityManager.setProcessDefaultNetwork(network)
                cm.bindProcessToNetwork(network)
            }
        })
    }
    private fun createNotification(): Notification {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "WireGuard VPN",
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("WireGuard VPN")
            .setContentText("VPN is running")
            .setSmallIcon(R.drawable.ic_stat_name)
            .setContentIntent(pendingIntent)
            .setOngoing(true)

            .build()
    }

    fun setupTunnel(config: Config): Boolean {
        return try {
            val iface = config.`interface`
            val address = iface.addresses.firstOrNull()?.address
                ?: throw IllegalStateException("No addresses configured")
            val cidrMask = iface.addresses.first().mask

            val builder = Builder()
                .addAddress(address, cidrMask)
                .addRoute("0.0.0.0", 0)
                .setMtu(1420
                )
                .setSession("wg0")

            // ✅ Use DNS from config if present; otherwise fallback to public
            if (iface.dnsServers.isNotEmpty()) {
                iface.dnsServers.forEach { dns ->
                    try {
                        builder.addDnsServer(dns.hostAddress ?: "1.1.1.1")
                    } catch (e: Exception) {
                        Log.w(TAG, "Invalid DNS: ${e.message}")
                    }
                }
            } else {
                builder.addDnsServer("1.1.1.1")
                builder.addDnsServer("8.8.8.8")
                builder.addDnsServer("9.9.9.9")
            }

            // ✅ Restrict to IPv4 to avoid Android IPv6 routing issues
            try {
                builder.allowFamily(OsConstants.AF_INET)
            } catch (e: Exception) {
                Log.w(TAG, "allowFamily(AF_INET) not supported: ${e.message}")
            }

            // ✅ Ensure your app traffic is included in VPN tunnel
            try {
                builder.addAllowedApplication("com.qubetics.wallet")
            } catch (e: Exception) {
                Log.w(TAG, "addAllowedApplication failed: ${e.message}")
            }

            // ✅ Optional: Block non-VPN traffic (force all through VPN)
            try {
                builder.setBlocking(true)
            } catch (e: Exception) {
                Log.w(TAG, "setBlocking not supported: ${e.message}")
            }

            vpnInterface = builder.establish()

            val isEstablished = vpnInterface != null
            Log.d(TAG, "VPN established = $isEstablished")
            isEstablished
        } catch (e: Exception) {
            Log.e(TAG, "Failed to setup tunnel: ${e.message}", e)
            false
        }
    }

    /** Logs incoming packets for debugging (VPN → device) */
    private fun startPacketLogging() {
        vpnInterface?.fileDescriptor?.let { fd ->
            val input = FileInputStream(fd)
            Thread {
                val buffer = ByteArray(32767)
                while (true) {
                    try {
                        val readLen = input.read(buffer)
                        if (readLen > 0) {
                            val recvPacket = buffer.copyOf(readLen)
                            Log.d(TAG, "📥 Received Packet (${readLen} bytes): ${recvPacket.toHexStringPrefix()}")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Packet logging error: ${e.message}", e)
                        break
                    }
                }
            }.start()
        }
    }

    private fun ByteArray.toHexStringPrefix(maxBytes: Int = 64): String {
        val len = minOf(size, maxBytes)
        return take(len).joinToString(" ") { String.format("%02X", it) }
    }

    override fun onDestroy() {
        try {
            vpnInterface?.close()
            vpnInterface = null
            Log.i(TAG, "VPN tunnel closed")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to close tunnel: ${e.message}", e)
        }
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)

        val workRequest = OneTimeWorkRequestBuilder<VpnRestartWorker>()
            .setInitialDelay(5, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }
}
