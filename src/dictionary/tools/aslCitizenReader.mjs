// A yauzl RandomAccessReader backed by HTTP range requests, so we can read
// the ASL Citizen dataset's central directory and pull out a handful of
// specific entries without downloading the full 42.8 GB zip.
//
// yauzl's lazy per-entry central-directory parsing issues one small (tens of
// bytes) range request per entry — fine for a local file, catastrophic for
// 83k+ entries over the network (166k+ round trips, hours). This reader
// fixes that by read-ahead caching: any range miss fetches a large window
// (CHUNK_SIZE) starting at the requested offset in ONE request, and
// subsequent nearby reads (the normal case — central directory entries are
// parsed sequentially) are served from that in-memory window for free.
import https from 'node:https';
import { PassThrough } from 'node:stream';
import yauzl from 'yauzl';

export const ASL_CITIZEN_ZIP_URL =
  'https://download.microsoft.com/download/b/8/8/b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip';

const CHUNK_SIZE = 16 * 1024 * 1024;

export function headContentLength(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HEAD ${url} failed: HTTP ${res.statusCode}`)); return; }
      resolve(Number(res.headers['content-length']));
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchRange(url, start, end) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const req = https.get(url, { headers: { Range: `bytes=${start}-${end - 1}` } }, (res) => {
      if (res.statusCode !== 206 && res.statusCode !== 200) {
        reject(new Error(`Range request failed: HTTP ${res.statusCode} for bytes=${start}-${end - 1}`));
        res.resume();
        return;
      }
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(30000, () => req.destroy(new Error(`Range request timed out for bytes=${start}-${end - 1}`)));
    req.on('error', reject);
  });
}

export class HttpRandomAccessReader extends yauzl.RandomAccessReader {
  constructor(url, totalSize) {
    super();
    this.url = url;
    this.totalSize = totalSize;
    this.cache = null; // { start, end, buffer }
    this.requestCount = 0;
  }

  async _fetchIntoCache(start, minEnd) {
    const windowEnd = Math.min(Math.max(minEnd, start + CHUNK_SIZE), this.totalSize);
    this.requestCount++;
    if (process.env.ASL_DEBUG) console.error(`[reader] fetch #${this.requestCount}: bytes ${start}-${windowEnd - 1} (${((windowEnd - start) / 1e6).toFixed(1)} MB)`);
    const buffer = await fetchRange(this.url, start, windowEnd);
    this.cache = { start, end: windowEnd, buffer };
  }

  _readStreamForRange(start, end) {
    const through = new PassThrough();
    (async () => {
      if (!this.cache || start < this.cache.start || end > this.cache.end) {
        await this._fetchIntoCache(start, end);
      }
      const slice = this.cache.buffer.subarray(start - this.cache.start, end - this.cache.start);
      through.end(slice);
    })().catch((err) => through.destroy(err));
    return through;
  }
}

export async function openAslCitizenZip() {
  const totalSize = await headContentLength(ASL_CITIZEN_ZIP_URL);
  const reader = new HttpRandomAccessReader(ASL_CITIZEN_ZIP_URL, totalSize);
  const zipfile = await yauzl.fromRandomAccessReaderPromise(reader, totalSize);
  return { zipfile, totalSize, reader };
}
