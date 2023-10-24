export type DeviceType = 'Handset' | 'Tablet' | 'Tv' | 'Desktop' | 'GamingConsole' | 'unknown';

export type BatteryState = 'unknown' | 'unplugged' | 'charging' | 'full';

export interface PowerState {
  batteryLevel: number;
  batteryState: BatteryState;
  lowPowerMode: boolean;
  [key: string]: any;
}

export interface LocationProviderInfo {
  [key: string]: boolean;
}

export interface AsyncHookResult<T> {
  loading: boolean;
  result: T;
}

export interface MemoryUsageInfo {
  free: number,
  active: number,
  inactive: number,
  wired: number,
  available: number,
  total: number,
  used: number,
}

export interface NetworkInfo {
  carrierName: string
  carrierCountry: string,
  carrierMobileCountryCode: string,
  carrierISOCountryCode: string,
  carrierMobileNetworkCode: string,
  currentIPAddress: string,
  externalIPAddress: string,
  cellIPAddress: string,
  cellNetmaskAddress: string,
  cellBroadcastAddress: string,
  connectedToWiFi: string,
  wiFiIPAddress: string,
  wiFiNetmaskAddress: string,
  wiFiBroadcastAddress: string,
  wiFiRouterAddress: string,
}
