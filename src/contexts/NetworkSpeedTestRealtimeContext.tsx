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
};

export type NetworkSpeedTestRealtimeContextType = {
  currentResult: SpeedTestRealtimeInfo | null;
  setCurrentResult: Dispatch<SetStateAction<SpeedTestRealtimeInfo | null>>;
};

export const NetworkSpeedTestRealtimeContext =
  createContext<NetworkSpeedTestRealtimeContextType>({} as any);

export function NetworkSpeedTestRealtimeContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const [currentResult, setCurrentResult] =
    useState<SpeedTestRealtimeInfo | null>(null);

  const contextData = useMemo<NetworkSpeedTestRealtimeContextType>(
    () => ({
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
