import { NativeModules } from 'react-native';
import { consoleLogFunc } from '../../Utils/MethodsUtils';

const { WireGuardVPNModule } = NativeModules;

export const createOrUpdateVPN = async (wgConfig: any) => {
  try {
    await WireGuardVPNModule.createOrUpdateVPN(wgConfig);
  } catch (e) {
    console.error("Failed to create/update VPN config", e);
    throw e;
  }
};

export const startVPN = async () => {
  try {
    await WireGuardVPNModule.startVPN();
  } catch (e) {
    console.error("Failed to start VPN", e);
    throw e;
  }
};


export const stopVPN = async () => {
  await WireGuardVPNModule.stopVPN();
};

export const getRuntimeStats = async () => {
  const stats = await WireGuardVPNModule.getRuntimeStats();
  return stats; // parse into an object if needed
};

export const generateWGKeyPair = async () => {
  try {
    const keys = await WireGuardVPNModule.generateWGKeyPair();
    return keys; // { publicKey, privateKey }
  } catch (e) {
    console.error("Key generation failed", e);
    return null;
  }
};

// Handle VPN connection
export const connectVpn = async (wgConfig: any) => {
  try {
    consoleLogFunc('connectVpn wgConfig--->>>', wgConfig);
    const needsPermission = await WireGuardVPNModule.prepareVpn();
    if (needsPermission) {
      throw new Error('VPN_PERMISSION_REQUIRED');
    }
    await disconnectVpn();
    await WireGuardVPNModule.connectVpn(wgConfig);
  } catch (error) {
    console.error('VPN connection error:', error);
    throw error;
  }
};

// Handle VPN disconnection
export const disconnectVpn = async () => {
  try {
    
    let status = await WireGuardVPNModule.getVpnStatus();
    if(status?.toLowerCase() === 'connected'){
      await WireGuardVPNModule.disconnectVpn();
    }
  } catch (error) {
    console.error('VPN disconnection error:', error);
  }
};

export const checkAndGetVpnStatus = async () => {
  const status = await WireGuardVPNModule.getVpnStatus();
  return status; // parse into an object if needed
};

export const getRunningVpnConfig = async () => {
  const status = await WireGuardVPNModule.getVpnConfig();
  return status;
};

export const getEndpointFromConfig =  (configString: any) => {
  if (!configString) return null;
  const endpointLine = configString
    .split("\n")
    .find((line: any) => line.trim().toLowerCase().startsWith("endpoint"));

  if (!endpointLine) return null; // No endpoint found

  return endpointLine.split("=")[1]?.trim() || null;
}