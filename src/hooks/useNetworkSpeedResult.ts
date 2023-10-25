import { useContext } from 'react';
import { NetworkSpeedTestRealtimeContext } from '../contexts/NetworkSpeedTestRealtimeContext';

export function useNetworkSpeedResult() {
  const { startedAt, currentResult } = useContext(NetworkSpeedTestRealtimeContext);
  return { startedAt, currentResult }
}
