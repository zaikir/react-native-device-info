import { useContext } from 'react';
import { NetworkSpeedTestContext } from '../contexts/NetworkSpeedTestContext';

export function useNetworkSpeedTest() {
  return useContext(NetworkSpeedTestContext);
}
