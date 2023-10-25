import { useContext } from 'react';
import { NetworkSpeedTestRealtimeContext } from '../contexts/NetworkSpeedTestRealtimeContext';

export function useNetworkSpeedResult() {
  return useContext(NetworkSpeedTestRealtimeContext);
}
