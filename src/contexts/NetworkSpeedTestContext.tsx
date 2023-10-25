import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { NetworkSpeedTestRealtimeContext } from './NetworkSpeedTestRealtimeContext';
import {
  DownloadTestProps,
  PingTestProps,
  SpeedTestServer,
  UploadTestProps,
  testDownloadSpeed,
  testPing,
  testUploadSpeed,
} from './NetworkSpeedTester';

export type SpeedTestStatus = 'ready' | 'testing';

export type SpeedTestProps = {
  maxDuration?: number;
  downloadTestProps?: DownloadTestProps;
  uploadTestProps?: UploadTestProps
  pingTestProps?: PingTestProps
};

export type NetworkSpeedTestContextType = {
  status: SpeedTestStatus;
  latestResult: SpeedTestHistoryEntry | null;
  history: SpeedTestHistoryEntry[];
  startTest: (options?: SpeedTestProps) => Promise<void>;
  clearHistory: () => void;
};

export const NetworkSpeedTestContext =
  createContext<NetworkSpeedTestContextType>({} as any);

const FallbackServers: SpeedTestServer[] = [
  {
    id: 'fallback',
    url: 'http://speedtest2.waldperlachfabi.de:8080/speedtest/upload.php',
    host: 'speedtest2.waldperlachfabi.de.prod.hosts.ooklaserver.net:8080',
  },
];

export type SpeedTestHistoryEntry = {
  date: string;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
};

export function NetworkSpeedTestProvider({ children }: PropsWithChildren<{}>) {
  const storageKey = '___speed_test_hisoty___';
  const { setCurrentResult } = useContext(NetworkSpeedTestRealtimeContext);
  const [status, setStatus] = useState<SpeedTestStatus>('ready');
  const [history, setHistory] = useState<SpeedTestHistoryEntry[]>([]);

  const latestResult = useMemo(() => {
    if (!history.length) {
      return null;
    }

    return history[0];
  }, [history]);

  const getSpeedTestServers = useCallback(async () => {
    try {
      const response = await fetch(
        'https://www.speedtest.net/api/js/servers?engine=js&limit=10&https_functional=true',
        {
          method: 'GET',
        },
      );

      return (await response.json()) as SpeedTestServer[];
    } catch {
      return FallbackServers;
    }
  }, []);

  const startTest = useCallback(
    async (options?: SpeedTestProps) => {
      if (status !== 'ready') {
        console.warn('Test is already started');
        return;
      }

      try {
        setStatus('testing');

        const servers = await getSpeedTestServers();

        setCurrentResult({ status: 'download', speed: 0, ping: 0 });
        const downloadSpeed = await testDownloadSpeed({
          servers: options?.downloadTestProps?.servers ?? servers,
          onProgress(info) {
            setCurrentResult({ ...info, status: 'download', ping: 0 });
            options?.downloadTestProps?.onProgress?.(info)
          },
          maxDuration: options?.maxDuration,
        });

        setCurrentResult({ status: 'upload', speed: 0, ping: 0 });
        const uploadSpeed = await testUploadSpeed({
          servers: options?.uploadTestProps?.servers ?? servers,
          onProgress(info) {
            setCurrentResult({ ...info, status: 'upload', ping: 0 });
            options?.uploadTestProps?.onProgress?.(info)
          },
          maxDuration: options?.maxDuration,
        });

        setCurrentResult({ status: 'ping', speed: 0, ping: 0 });
        const ping = await testPing({
          ...options?.pingTestProps,
          onProgress(info) {
            setCurrentResult({
              ...info,
              status: 'ping',
              speed: 0,
              ping: info.ping,
            });
            options?.pingTestProps?.onProgress?.(info)
          },
        });

        setHistory((prev) => [
          {
            date: new Date().toISOString(),
            downloadSpeed,
            uploadSpeed,
            ping,
          },
          ...prev,
        ]);
      } finally {
        setStatus('ready');
        setCurrentResult(null);
      }
    },
    [status],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  useEffect(() => {
    (async () => {
      const items = JSON.parse(
        (await AsyncStorage.getItem(storageKey)) ?? '[]',
      );

      setHistory(items);
    })();
  }, []);

  const contextData = useMemo<NetworkSpeedTestContextType>(
    () => ({
      status,
      latestResult,
      history,
      startTest,
      clearHistory,
    }),
    [status, latestResult, history, startTest],
  );

  return (
    <NetworkSpeedTestContext.Provider value={contextData}>
      {children}
    </NetworkSpeedTestContext.Provider>
  );
}
