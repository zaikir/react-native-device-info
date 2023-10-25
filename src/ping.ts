import { NativeModules } from 'react-native';

const { RNReactNativePing, RNDnsLookup } = NativeModules;

export async function lookupIpAddress(domain: string) {
  const ipAddress = await RNDnsLookup.getIpAddresses(domain)
  return ipAddress
}

export async function ping(ipAddress: string, option?:{timeout: number}) {
  const result = await RNReactNativePing.start(ipAddress, option);
  return result;
}

export async function pingDomain(domain: string, option?:{timeout: number}) {
  const ipAddress = await lookupIpAddress(domain)

  const result = await RNReactNativePing.start(ipAddress, option);
  return result;
}
