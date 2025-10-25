export function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  let remaining = bytes;

  do {
    remaining /= thresh;
    ++u;
  } while (Math.round(Math.abs(remaining) * r) / r >= thresh && u < units.length - 1);

  return `${remaining.toFixed(dp)} ${units[u]}`;
}
