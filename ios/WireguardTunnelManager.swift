//
//  WireguardTunnelManager.swift
//  QubeticsWallet
//
//

import NetworkExtension

class WireguardTunnelManager {
  public let manager: NETunnelProviderManager

    var tunnelState: NEVPNStatus {
        manager.connection.status
    }

    var connection: NEVPNConnection {
        manager.connection
    }

    init(manager: NETunnelProviderManager) {
        self.manager = manager
    }

  static func loadOrCreateManager(bundleIdentifier: String, configString: String, completion: @escaping (WireguardTunnelManager?, Error?) -> Void) {
      NETunnelProviderManager.loadAllFromPreferences { managers, error in
          if let error = error {
              completion(nil, error)
              return
          }

          if let found = managers?.first(where: {
              ($0.protocolConfiguration as? NETunnelProviderProtocol)?.providerBundleIdentifier == bundleIdentifier
          }) {
              found.loadFromPreferences { _ in
                  completion(WireguardTunnelManager(manager: found), nil)
              }
              return
          }

          let newManager = NETunnelProviderManager()
          let proto = NETunnelProviderProtocol()
          proto.providerBundleIdentifier = bundleIdentifier
          proto.serverAddress = "192.168.0.2"
          proto.providerConfiguration = ["wgConfig": configString]

          newManager.protocolConfiguration = proto
          newManager.localizedDescription = "DVPN"
          newManager.isEnabled = true

          newManager.saveToPreferences { saveError in
              if let saveError = saveError {
                  completion(nil, saveError)
              } else {
                  newManager.loadFromPreferences { loadError in
                      if let loadError = loadError {
                          completion(nil, loadError)
                      } else {
                          completion(WireguardTunnelManager(manager: newManager), nil)
                      }
                  }
              }
          }
      }
  }

    func startTunnel() throws {
        try manager.connection.startVPNTunnel()
        print("[TunnelManager] VPN started")
    }

    func stopTunnel() {
        manager.connection.stopVPNTunnel()
        print("[TunnelManager] VPN stopped")
    }
}
