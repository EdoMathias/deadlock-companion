/**
 * Service for scanning the Steam httpcache directory to extract match salts.
 *
 * Ported from deadlock-api/deadlock-api ingest-cache.tsx.
 * Scans binary files for Valve replay URLs and extracts metadata/replay salts.
 */

import type { ClickhouseSalts } from 'deadlock_api_client';

const VALVE_NET_PATTERN = new TextEncoder().encode('.valve.net');
const DEADLOCK_APP_ID = '1422450';

const REPLAY_URL_REGEX =
  /http:\/\/replay(\d+)\.valve\.net\/1422450\/(\d+)_(\d+)\.(meta|dem)\.bz2/;

function findSubarrayIndex(
  haystack: Uint8Array,
  needle: Uint8Array,
  startIndex = 0,
): number {
  if (needle.length === 0) return startIndex;
  if (needle.length > haystack.length - startIndex) return -1;
  if (startIndex < 0 || startIndex >= haystack.length) return -1;

  for (let i = startIndex; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function isValidHostChar(c: number): boolean {
  return (
    (c >= 48 && c <= 57) || // digits
    (c >= 65 && c <= 90) || // uppercase
    (c >= 97 && c <= 122) || // lowercase
    c === 46 // dot
  );
}

function extractReplayUrl(data: Uint8Array): string | null {
  let i = -1;
  while (true) {
    i = findSubarrayIndex(data, VALVE_NET_PATTERN, i + 1);
    if (i === -1) break;

    let hostStart = i;
    while (hostStart > 0 && isValidHostChar(data[hostStart - 1])) {
      hostStart--;
    }

    const hostEnd = i + VALVE_NET_PATTERN.length;
    const host = new TextDecoder().decode(data.subarray(hostStart, hostEnd));

    if (!(host.startsWith('replay') && host.includes('.valve.net'))) {
      continue;
    }

    let pathStart = -1;
    for (let j = hostEnd; j < hostEnd + 200 && j < data.length; j++) {
      if (data[j] === 47) {
        // '/'
        pathStart = j;
        break;
      }
    }
    if (pathStart === -1) continue;

    const searchSlice = data.subarray(
      pathStart,
      Math.min(pathStart + 300, data.length),
    );
    let minEnd = searchSlice.length;
    const endMarkers = [0, 10, 13, 32, 34, 39]; // null, LF, CR, space, ", '
    for (const marker of endMarkers) {
      const pos = searchSlice.indexOf(marker);
      if (pos !== -1) {
        minEnd = Math.min(minEnd, pos);
      }
    }

    const path = new TextDecoder().decode(searchSlice.subarray(0, minEnd));
    const url = `http://${host}${path}`;
    if (url.includes(DEADLOCK_APP_ID)) {
      return url;
    }
  }
  return null;
}

export function urlToSalts(url: string): ClickhouseSalts | null {
  const pipePos = url.indexOf('?');
  const cleanUrl = pipePos !== -1 ? url.substring(0, pipePos) : url;
  const match = cleanUrl.match(REPLAY_URL_REGEX);
  if (!match) return null;

  const [, clusterId, matchId, salt, type] = match;
  return {
    cluster_id: parseInt(clusterId, 10),
    match_id: parseInt(matchId, 10),
    metadata_salt: type === 'meta' ? parseInt(salt, 10) : null,
    replay_salt: type === 'dem' ? parseInt(salt, 10) : null,
  };
}

/**
 * Extract salts from a single binary file's contents.
 */
export function extractSaltsFromBuffer(
  data: Uint8Array,
): ClickhouseSalts | null {
  const replayUrl = extractReplayUrl(data);
  return replayUrl ? urlToSalts(replayUrl) : null;
}

/**
 * Process a File object and extract salts.
 */
export async function extractSaltsFromFile(
  file: File,
): Promise<ClickhouseSalts | null> {
  const arrayBuffer = await file.arrayBuffer();
  return extractSaltsFromBuffer(new Uint8Array(arrayBuffer));
}

/**
 * Scan a FileList (from an input[type=file]) and extract all salts.
 */
export async function scanFileList(
  files: FileList,
  onProgress?: (found: number) => void,
): Promise<ClickhouseSalts[]> {
  const salts: ClickhouseSalts[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < files.length; i++) {
    const salt = await extractSaltsFromFile(files[i]);
    if (salt && !seen.has(salt.match_id)) {
      seen.add(salt.match_id);
      salts.push(salt);
      onProgress?.(salts.length);
    }
  }
  return salts;
}

/**
 * Scan an array of File objects and extract all salts.
 * Useful for files collected via drag-and-drop directory traversal.
 */
export async function scanFiles(
  files: File[],
  onProgress?: (found: number) => void,
): Promise<ClickhouseSalts[]> {
  const salts: ClickhouseSalts[] = [];
  const seen = new Set<number>();

  for (const file of files) {
    const salt = await extractSaltsFromFile(file);
    if (salt && !seen.has(salt.match_id)) {
      seen.add(salt.match_id);
      salts.push(salt);
      onProgress?.(salts.length);
    }
  }
  return salts;
}
