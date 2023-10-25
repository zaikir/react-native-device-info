import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useMemo,
  useState,
} from 'react';

export type SpeedTestRealtimeInfo = {
  status: 'download' | 'upload' | 'ping';
  speed: number;
  ping: number;
  progress: number
};

export type NetworkSpeedTestRealtimeContextType = {
  currentResult: SpeedTestRealtimeInfo | null;
  setCurrentResult: Dispatch<SetStateAction<SpeedTestRealtimeInfo | null>>;
  startedAt: string | null;
  setStartedAt: Dispatch<SetStateAction<string | null>>;
};

export const NetworkSpeedTestRealtimeContext =
  createContext<NetworkSpeedTestRealtimeContextType>({} as any);

export function NetworkSpeedTestRealtimeContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [currentResult, setCurrentResult] =
    useState<SpeedTestRealtimeInfo | null>(null);

  const contextData = useMemo<NetworkSpeedTestRealtimeContextType>(
    () => ({
      startedAt,
      setStartedAt,
      currentResult,
      setCurrentResult,
    }),
    [currentResult],
  );

  return (
    <NetworkSpeedTestRealtimeContext.Provider value={contextData}>
      {children}
    </NetworkSpeedTestRealtimeContext.Provider>
  );
}
