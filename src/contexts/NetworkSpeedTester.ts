
import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';
import { lookupIpAddress, ping } from '../ping';


const FILE_SIZE_DOWNLOAD = 100000000; // 100MB
const FILE_SIZE_UPLOAD = 100000000; // 100MB
const UPLOAD_TIME_SKIP = 250;

export type SpeedTestServer = {
  host: string;
  url: string;
  id: string;
};

export type DownloadTestProps = {
  servers: SpeedTestServer[];
  onProgress?: (info: { speed: number; progress: number }) => void;
  maxDuration?: number;
  progressInterval?: number;
  progressDivider?: number;
};

export type UploadTestProps = {
  servers: SpeedTestServer[];
  onProgress?: (info: { speed: number; progress: number }) => void;
  maxDuration?: number;
};

export type PingTestProps = {
  ip?: string;
  domain?: string;
  timeout?: number;
  numberOfRetries?: number;
  onProgress?: (info: { ping: number }) => void;
};

export const testDownloadSpeed = async ({
  servers,
  onProgress,
  maxDuration = 4000,
  progressInterval = 100,
  progressDivider = 100
}: DownloadTestProps): Promise<number> => {
  const totalBytesPerSecond: number[] = [];
  let totalSpeed = 0;
  let globalStartTime = 0;
  const downloadedFiles: string[] = [];

  function onPartialDownloadProgress({
    workerId,
    speed,
  }: {
    workerId: number;
    speed: number;
  }) {
    totalBytesPerSecond[workerId] = speed;

    totalSpeed = totalBytesPerSecond.reduce((acc, item) => acc + item, 0);
    const curTime = new Date().valueOf();
    const passedTime = curTime - globalStartTime;

    const progress = passedTime / maxDuration;
    onProgress?.({
      speed: totalSpeed,
      progress: progress > 1 ? 1 : progress,
    });
  }

  await Promise.all(
    servers.map(async (server, workerId) => {
      let startTime = 0;
      let bytesPerSecond = 0;

      const filepath = `${RNFS.CachesDirectoryPath}/tmp-${Math.floor(
        Math.random() * 10000,
      )}.bin`;

      await new Promise<void>((resolve, reject) =>
        RNFS.downloadFile({
          fromUrl: `http://${server.host}/download?size=${FILE_SIZE_DOWNLOAD}`,
          toFile: filepath,
          cacheable: false,
          background: false,
          discretionary: false,
          progressInterval: progressInterval,
          progressDivider: progressDivider,
          begin: () => {
            startTime = new Date().valueOf();
            if (!globalStartTime) {
              globalStartTime = startTime;
            }

            onPartialDownloadProgress({ workerId, speed: 0 });
          },
          progress: ({ bytesWritten, contentLength, jobId }) => {
            const curTime = new Date().valueOf();
            const passedTime = curTime - startTime;

            if (
              bytesWritten / contentLength > 0.999 ||
              passedTime > maxDuration
            ) {
              resolve();
              RNFS.stopDownload(jobId);
              return;
            }

            bytesPerSecond = Math.floor(
              (bytesWritten / (passedTime / 1000)) * 8,
            );

            onPartialDownloadProgress({
              workerId,
              speed: Math.floor(bytesPerSecond),
            });
          },
        })
          .promise.then(async () => {
            resolve();
          })
          .catch(reject),
      );

      downloadedFiles.push(filepath);
    }),
  );

  await Promise.all(
    downloadedFiles.map((file) => RNFS.unlink(file).catch(() => {})),
  );

  return totalSpeed;
};

export const testUploadSpeed = async ({
  servers,
  onProgress,
  maxDuration = 4000,
}: UploadTestProps) => {
  const files = await RNFS.readDir(
    Platform.OS === 'android'
      ? RNFS.DocumentDirectoryPath
      : RNFS.MainBundlePath,
  );

  const [largestFile] = files.sort((a, b) => b.size - a.size);
  const numberOfFiles = Math.ceil(FILE_SIZE_UPLOAD / largestFile.size);

  let startTime = 0;
  let startTimeCorrected = 0;
  let bytesPerSecond = 0;

  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];

    try {
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, maxDuration * 2)),
        RNFS.uploadFiles({
          toUrl: server.url,
          //@ts-ignore
          files: [...new Array(numberOfFiles).keys()].map(
            () =>
              ({
                filepath: largestFile.path,
              } as any),
          ),
          method: 'POST',
          begin: () => {
            startTime = new Date().valueOf();
            onProgress?.({
              speed: 0,
              progress: 0,
            });
          },
          progress: ({ totalBytesSent, totalBytesExpectedToSend, jobId }) => {
            const curTime = new Date().valueOf();
            const passedTime = curTime - startTime;

            // Skip reporting of first few ms to avoid spikes
            if (passedTime < UPLOAD_TIME_SKIP) {
              return;
            }

            if (!startTimeCorrected) {
              startTimeCorrected = Date.now();
            }

            const passedTimeCorrected = curTime - startTimeCorrected;

            if (
              totalBytesSent / totalBytesExpectedToSend > 0.999 ||
              passedTimeCorrected > maxDuration
            ) {
              RNFS.stopUpload(jobId);
              return;
            }

            bytesPerSecond = Math.floor(
              (totalBytesSent / (passedTime / 1000)) * 8,
            );

            const progress = passedTime / maxDuration;
            onProgress?.({
              speed: bytesPerSecond,
              progress: progress > 1 ? 1 : progress,
            });
          },
        }).promise,
      ]);
      break;
    } catch {}
  }

  return bytesPerSecond;
};

export const testPing = async (options?: PingTestProps) => {
  const getIpByDomain = async (domain: string) => {
    if (!domain) {
      return null;
    }

    const ips = await lookupIpAddress(domain);
    return ips[0];
  };

  const ip =
    options?.ip ??
    (options?.domain && (await getIpByDomain(options.domain))) ??
    (await getIpByDomain('google.com'));

  const results: number[] = [];
  for (let index = 0; index < (options?.numberOfRetries ?? 5); index++) {
    try {
      const [result] = await Promise.all([
        ping(ip, { timeout: options?.timeout ?? 1000 }),
        new Promise((resolve) => {
          setTimeout(resolve, options?.timeout ?? 1000);
        }),
      ]);

      options?.onProgress?.({ ping: result });

      results.push(result);
    } catch (err) {
      console.error(err);
    }
  }

  if (!results.length) {
    return 0;
  }

  return results.reduce((acc, item) => acc + item, 0) / results.length;
};
