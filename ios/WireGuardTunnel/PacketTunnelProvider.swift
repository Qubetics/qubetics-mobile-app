//
//  PacketTunnelProvider.swift
//  WireGuardTunnel
//
//

import Foundation
import NetworkExtension
import WireGuardKit


final class PacketTunnelProvider: NEPacketTunnelProvider {

    private lazy var adapter: WireGuardAdapter = {
        WireGuardAdapter(with: self) { logLevel, message in
            NSLog("[WireGuard] \(message)")
        }
    }()

    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        NSLog("[PacketTunnelProvider] Starting tunnel...")

        guard let tunnelProviderProtocol = self.protocolConfiguration as? NETunnelProviderProtocol,
              let configStringRaw = tunnelProviderProtocol.providerConfiguration?["wgConfig"] as? String else {
            NSLog("[PacketTunnelProvider] Missing or invalid wgConfig")
            completionHandler(PacketTunnelProviderError.savedProtocolConfigurationIsInvalid)
            return
        }

        if let providerConfig = tunnelProviderProtocol.providerConfiguration {
            NSLog("[PacketTunnelProvider] providerConfiguration: \(providerConfig)")
        } else {
            NSLog("[PacketTunnelProvider] providerConfiguration is nil")
        }

        // Clean up the string
        let cleanedConfigString = configStringRaw
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .joined(separator: "\n")

        do {
            let tunnelConfiguration = try TunnelConfiguration(wireGuardConfig: cleanedConfigString)
            adapter.start(tunnelConfiguration: tunnelConfiguration) { error in
                if let error = error {
                    NSLog("[PacketTunnelProvider] Failed to start adapter: \(error)")
                    completionHandler(error)
                    return
                }
                let interfaceName = self.adapter.interfaceName ?? "unknown"
                NSLog("[PacketTunnelProvider] Tunnel interface: \(interfaceName)")
                completionHandler(nil)
            }
        } catch {
            NSLog("[PacketTunnelProvider] Failed to parse config: \(error)")
            completionHandler(error)
        }
    }

    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        NSLog("[PacketTunnelProvider] Stopping tunnel")
        adapter.stop { error in
            if let error = error {
                NSLog("[PacketTunnelProvider] Error stopping adapter: \(error.localizedDescription)")
            }
            completionHandler()
        }
    }

  override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)? = nil) {
      guard let completionHandler = completionHandler else { return }

      if messageData.count == 1 && messageData[0] == 0 {
          adapter.getRuntimeConfiguration { configString in
              let interfaceName = self.adapter.interfaceName ?? "unknown"
              let jsonDict: [String: String] = [
                  "interface": interfaceName,
                  "config": configString ?? ""
              ]
              if let jsonData = try? JSONSerialization.data(withJSONObject: jsonDict, options: []) {
                  completionHandler(jsonData)
              } else {
                  completionHandler(nil)
              }
          }
          return
      }

      completionHandler(nil)
  }

}
