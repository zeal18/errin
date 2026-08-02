import * as Network from 'expo-network';
import { devLog } from './devLog';

// Any non-WIFI or unknown network state counts as "not on Wi-Fi".
export async function isOnWifi(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.type === Network.NetworkStateType.WIFI;
  } catch (error) {
    devLog('Network state check failed');
    return false;
  }
}
