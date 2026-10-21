package com.qubetics_app.wireguard
import okhttp3.Dns
import java.net.Inet4Address
import java.net.InetAddress
import java.net.UnknownHostException

class SmartDnsSelector : Dns {
    @Throws(UnknownHostException::class)
    override fun lookup(hostname: String): List<InetAddress> {
        val addresses = Dns.SYSTEM.lookup(hostname)

        // Reorder the list to put IPv4 addresses at the top.
        // This prevents Android from hanging on "broken" IPv6 routes
        // common in office/corporate Wi-Fi environments.
        return addresses.sortedBy { it !is Inet4Address }
    }
}