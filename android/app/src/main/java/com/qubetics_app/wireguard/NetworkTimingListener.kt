package com.qubetics_app.wireguard
import okhttp3.*
import android.util.Log
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy

class NetworkTimingListener : EventListener() {

    private var dnsStart = 0L
    private var connectStart = 0L
    private var callStart = 0L

    override fun callStart(call: Call) {
        callStart = System.currentTimeMillis()
        Log.d("NET", "Call started")
    }

    override fun dnsStart(call: Call, domainName: String) {
        dnsStart = System.currentTimeMillis()
        Log.d("NET", "DNS start: $domainName")
    }

    override fun dnsEnd(
        call: Call,
        domainName: String,
        inetAddressList: List<InetAddress>
    ) {
        val dnsTime = System.currentTimeMillis() - dnsStart
        Log.d("NET", "DNS resolved in ${dnsTime}ms → $inetAddressList")
    }

    override fun connectStart(
        call: Call,
        inetSocketAddress: InetSocketAddress,
        proxy: Proxy
    ) {
        connectStart = System.currentTimeMillis()
        Log.d("NET", "TCP connect start")
    }

    override fun connectEnd(
        call: Call,
        inetSocketAddress: InetSocketAddress,
        proxy: Proxy,
        protocol: Protocol?
    ) {
        val tcpTime = System.currentTimeMillis() - connectStart
        Log.d("NET", "TCP connected in ${tcpTime}ms")
    }

    override fun secureConnectStart(call: Call) {
        Log.d("NET", "TLS handshake start")
    }

    override fun secureConnectEnd(call: Call, handshake: Handshake?) {
        Log.d("NET", "TLS handshake completed")
    }

    override fun callEnd(call: Call) {
        val total = System.currentTimeMillis() - callStart
        Log.d("NET", "Total request time: ${total}ms")
    }

    override fun callFailed(call: Call, ioe: java.io.IOException) {
        val total = System.currentTimeMillis() - callStart
        Log.e("NET", "Call failed after ${total}ms → ${ioe.message}")
    }
}
