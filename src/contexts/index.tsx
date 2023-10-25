import { PropsWithChildren } from "react";
import {NetworkSpeedTestProvider as NetworkSpeedTestProviderBase} from './NetworkSpeedTestContext'
import {NetworkSpeedTestRealtimeContextProvider} from './NetworkSpeedTestRealtimeContext'

export function NetworkSpeedTestProvider({
  children,
}: PropsWithChildren<{}>) {
  return (
    // @ts-ignore
    <NetworkSpeedTestRealtimeContextProvider>
      {/* @ts-ignore */}
      <NetworkSpeedTestProviderBase>
        {children}
      </NetworkSpeedTestProviderBase>
    </NetworkSpeedTestRealtimeContextProvider>
  );
}
