const MAX_RESPONSE = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;

function feeCeiling(maxFeeQuon) {
  if (typeof maxFeeQuon === 'number') {
    throw new Error('pass the maximum fee as a decimal string or a BigInt, never a JavaScript number, because a number silently rounds above 2^53 and could set the ceiling higher than you intended');
  }
  let ceiling;
  try {
    ceiling = BigInt(maxFeeQuon);
  } catch {
    throw new Error('the maximum fee must be an integer number of Quon');
  }
  if (ceiling < 0n) throw new Error('the maximum fee cannot be negative');
  return ceiling;
}

function checkAmount(amount) {
  if (typeof amount === 'number') {
    throw new Error('pass the amount as a decimal string or a BigInt, never a JavaScript number, because a number silently rounds above 2^53 and would sign a wrong amount');
  }
  if (typeof amount !== 'string' && typeof amount !== 'bigint') {
    throw new Error('the amount must be a decimal string or a BigInt');
  }
}

async function readBounded(res) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const header = res.headers.get('content-length');
    const len = header == null ? NaN : Number(header);
    if (!Number.isFinite(len) || len <= 0) {
      throw new Error('the response has no content-length to bound it and cannot be read safely');
    }
    if (len > MAX_RESPONSE) throw new Error('the response is too large');
    return await res.text();
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE) {
      try { await reader.cancel(); } catch { /* already closing */ }
      throw new Error('the response is too large');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    merged.set(chunk, at);
    at += chunk.byteLength;
  }
