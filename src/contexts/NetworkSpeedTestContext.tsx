import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  downloadTestProps?: Partial<DownloadTestProps>;
  uploadTestProps?: Partial<UploadTestProps>;
  pingTestProps?: Partial<PingTestProps>;
  tests?: ('download' | 'upload' | 'ping')[]
};

export type NetworkSpeedTestContextType = {
  status: SpeedTestStatus;
  latestResult: SpeedTestHistoryEntry | null;
  history: SpeedTestHistoryEntry[];
  startTest: (options?: SpeedTestProps) => Promise<{
    downloadSpeed: number;
    uploadSpeed: number;
    ping: number;
  }>;
  resetTestResults: () => void;
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
  const { setCurrentResult, setStartedAt } = useContext(NetworkSpeedTestRealtimeContext);
  const [status, setStatus] = useState<SpeedTestStatus>('ready');
  const [history, setHistory] = useState<SpeedTestHistoryEntry[]>([]);

  const isMounted = useRef(false)

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
        throw new Error('Test is already started')
      }

      try {
        setStatus('testing');
        setStartedAt(new Date().toISOString())

        const tests = options?.tests ?? ['download', 'upload', 'ping']
        const servers = await getSpeedTestServers();

        let downloadSpeed = 0
        if (tests.includes('download')) {
          setCurrentResult({ status: 'download', value: 0, progress:0 });
          downloadSpeed = await testDownloadSpeed({
            ...options?.downloadTestProps,
            servers: options?.downloadTestProps?.servers ?? servers,
            onProgress(info) {
              setCurrentResult({ progress: info.progress, status: 'download', value: info.speed});
              options?.downloadTestProps?.onProgress?.(info)
            },
            maxDuration: options?.maxDuration,
          });

        }
        
        let uploadSpeed = 0
        if (tests.includes('download')) {
          setCurrentResult({ status: 'upload', value: 0, progress:0 });
          uploadSpeed = await testUploadSpeed({
            ...options?.uploadTestProps,
            servers: options?.uploadTestProps?.servers ?? servers,
            onProgress(info) {
              setCurrentResult({ progress: info.progress, status: 'upload', value: info.speed });
              options?.uploadTestProps?.onProgress?.(info)
            },
            maxDuration: options?.maxDuration,
          });
        }

        let ping = 0
        if (tests.includes('ping')) {
          setCurrentResult({ status: 'ping', value: 0, progress:0 });
          ping = await testPing({
            ...options?.pingTestProps,
            onProgress(info) {
              setCurrentResult({
                ...info,
                status: 'ping',
                value: info.ping,
              });
              options?.pingTestProps?.onProgress?.(info)
            },
          });
        }

        const result = {
          downloadSpeed,
          uploadSpeed,
          ping,
        }

        setHistory((prev) => [
          {
            date: new Date().toISOString(),
            ...result
          },
          ...prev,
        ]);

        return result
      } finally {
        setStatus('ready');
        setCurrentResult(null);
      }
    },
    [status],
  );

  const resetTestResults = useCallback(() => {
    setCurrentResult(null)
    setStartedAt(null)
  }, [])

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

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return
    }

    (async () => {
      await AsyncStorage.setItem(storageKey, JSON.stringify(history))
    })()
    
  }, [history])

  const contextData = useMemo<NetworkSpeedTestContextType>(
    () => ({
      status,
      latestResult,
      history,
      startTest,
      resetTestResults,
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
