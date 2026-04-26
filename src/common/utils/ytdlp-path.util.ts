/**
 * Resolves the yt-dlp binary path.
 *
 * Strategy (tried in order):
 *  1. YTDLP_PATH env var — use as-is (local dev / custom server)
 *  2. /tmp/yt-dlp — already downloaded in this container's lifetime
 *  3. Download from GitHub Releases into /tmp/yt-dlp and make it executable
 *
 * This is designed for environments like Vercel where yt-dlp is not
 * pre-installed but /tmp is writable (~512 MB).
 *
 * Bot-bypass args
 * ---------------
 * Use getYtDlpBaseArgs() to get a set of flags that bypass YouTube's
 * "Sign in to confirm" bot detection. Optionally, set the YOUTUBE_COOKIES
 * environment variable (Netscape/cookies.txt format) to authenticate with
 * a real session.
 */

import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as https from 'https';
import { chmod, writeFile } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const logger = new Logger('YtdlpPath');

const TMP_BIN = '/tmp/yt-dlp';
const TMP_COOKIES = '/tmp/yt-cookies.txt';
// Pinned release — bump as needed, or use /latest/download/ for always-latest
const DOWNLOAD_URL =
  'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

let resolvedPath: string | null = null;
let cookiesWritten = false;

/** Download a URL to a local file path, following redirects. */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const get = (currentUrl: string) => {
      https
        .get(currentUrl, { timeout: 60_000 }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const location = res.headers.location;
            if (!location) {
              reject(new Error('Redirect with no Location header'));
              return;
            }
            const nextUrl = location.startsWith('http')
              ? location
              : new URL(location, currentUrl).toString();
            res.resume();
            get(nextUrl);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${res.statusCode} from ${currentUrl}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve()));
        })
        .on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    };

    get(url);
  });
}

/** Verify the binary responds to --version (sanity check after download). */
async function isExecutable(binPath: string): Promise<boolean> {
  try {
    await execFileAsync(binPath, ['--version'], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the path to a working yt-dlp binary.
 * Cached after first successful resolution.
 */
export async function getYtDlpPath(): Promise<string> {
  if (resolvedPath) return resolvedPath;

  // 1. Explicit override
  const envPath = process.env.YTDLP_PATH;
  if (envPath) {
    resolvedPath = envPath;
    return resolvedPath;
  }

  // 2. Already downloaded in this container lifetime
  if (fs.existsSync(TMP_BIN)) {
    if (await isExecutable(TMP_BIN)) {
      logger.log(`Using cached yt-dlp at ${TMP_BIN}`);
      resolvedPath = TMP_BIN;
      return resolvedPath;
    }
    // Corrupt / stale — re-download
    fs.unlinkSync(TMP_BIN);
  }

  // 3. Download from GitHub
  logger.log(`Downloading yt-dlp from ${DOWNLOAD_URL} → ${TMP_BIN}`);
  await downloadFile(DOWNLOAD_URL, TMP_BIN);
  await chmod(TMP_BIN, 0o755);
  logger.log('yt-dlp downloaded and marked executable');

  if (!(await isExecutable(TMP_BIN))) {
    throw new Error('Downloaded yt-dlp binary failed --version check');
  }

  resolvedPath = TMP_BIN;
  return resolvedPath;
}

/**
 * Returns additional yt-dlp flags that bypass YouTube bot detection and
 * optionally attach a cookie session.
 *
 * Env vars:
 *  - YOUTUBE_COOKIES  — raw Netscape cookies.txt content (optional).
 *                       When set the content is written once to /tmp/yt-cookies.txt
 *                       and passed via --cookies.
 */
export async function getYtDlpBaseArgs(): Promise<string[]> {
  const args: string[] = [
    // Use the iOS player client — avoids "Sign in to confirm" bot detection
    '--extractor-args', 'youtube:player_client=ios',
  ];

  const cookiesEnv = process.env.YOUTUBE_COOKIES;
  if (cookiesEnv) {
    if (!cookiesWritten) {
      await writeFile(TMP_COOKIES, cookiesEnv, { mode: 0o600 });
      cookiesWritten = true;
    }
    args.push('--cookies', TMP_COOKIES);
  }

  return args;
}

