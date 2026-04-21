import { DEFAULT_INPUTS } from '../config/presets.js';

// ── Pure utility functions ───────────────────────────────────────────────────
// All functions here are pure (no React state dependency) and stable references.
// Import them wherever needed — they never cause re-renders.

// Format a number as a Singapore dollar string: $1,234
export const formatCurrency = val =>
  "$" + Math.round(Number(val) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// XIRR computation (Newton-Raphson)
// cashFlows: array of {t: year_index, v: amount} — negative = outflow, positive = inflow
export const computeXIRR = (cashFlows, guess = 0.05) => {
  if (!cashFlows || cashFlows.length < 2) return null;
  if (cashFlows.every(cf => cf.v >= 0) || cashFlows.every(cf => cf.v <= 0)) return null;
  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    let f = 0, df = 0;
    for (const { t, v } of cashFlows) {
      const denom = Math.pow(1 + rate, t);
      f += v / denom;
      df += -t * v / (denom * (1 + rate));
    }
    if (Math.abs(df) < 1e-12) break;
    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < 1e-8) { rate = newRate; break; }
    rate = newRate;
    if (rate < -0.999) rate = -0.999;
  }
  return isFinite(rate) ? rate : null;
};

// ── Share-link encode / decode helpers ──────────────────────────────────────
// Three formats are recognised on decode, identified by the first character:
//   '~'  New format: delta-encoded inputs + plain base64url.
//        Only fields that differ from DEFAULT_INPUTS are stored, so a typical
//        1,500-char JSON shrinks to ~200–400 chars before base64 → final URL
//        length of ~270–540 chars instead of the previous 3,000+ chars.
//   '.'  Old LZ77 format (retired — produced URLs LARGER than plain base64url).
//        Kept in the decoder for backward compatibility with existing share links.
//   no prefix  Legacy: plain base64url of raw UTF-8 bytes. Pre-LZ77 era links.

export const lzCompress = (str) => {
  try {
    const state = JSON.parse(str);
    // Delta-encode main inputs: only store fields that differ from DEFAULT_INPUTS
    if (state.inputs && typeof state.inputs === 'object') {
      const delta = {};
      for (const k of Object.keys(DEFAULT_INPUTS)) {
        if (state.inputs[k] !== undefined &&
            JSON.stringify(state.inputs[k]) !== JSON.stringify(DEFAULT_INPUTS[k])) {
          delta[k] = state.inputs[k];
        }
      }
      state.inputs = delta;
    }
    // Delta-encode scenario inputs too
    for (const slot of ['scenarioAInputs', 'scenarioBInputs']) {
      if (state[slot] && typeof state[slot] === 'object') {
        const delta = {};
        for (const k of Object.keys(DEFAULT_INPUTS)) {
          if (state[slot][k] !== undefined &&
              JSON.stringify(state[slot][k]) !== JSON.stringify(DEFAULT_INPUTS[k])) {
            delta[k] = state[slot][k];
          }
        }
        state[slot] = delta;
      }
    }
    const compact = JSON.stringify(state);
    // Plain base64url — no LZ overhead, delta alone gives 60–75% URL reduction
    return '~' + btoa(unescape(encodeURIComponent(compact)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) { return encodeURIComponent(str); }
};

export const lzDecompress = (encoded) => {
  try {
    if (encoded.startsWith('~')) {
      // New delta format: base64url of compact delta-encoded JSON
      const b64 = encoded.slice(1).replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? '='.repeat(4 - b64.length % 4) : '';
      return decodeURIComponent(escape(atob(b64 + pad)));
    }
    if (encoded.startsWith('.')) {
      // Old LZ77 format: strip '.' prefix, decode compressed byte stream
      const b64  = encoded.slice(1).replace(/-/g, '+').replace(/_/g, '/');
      const pad  = b64.length % 4 ? '='.repeat(4 - b64.length % 4) : '';
      const binary = atob(b64 + pad);
      const src  = Array.from(binary, c => c.charCodeAt(0));
      const out  = [];
      let i = 0;
      while (i < src.length) {
        const flag = src[i++];
        if (flag === 0) {
          const off = src[i++], len = src[i++];
          const base = out.length - off;
          for (let k = 0; k < len; k++) out.push(out[base + k]);
        } else {
          out.push(src[i++]);
        }
      }
      return new TextDecoder().decode(new Uint8Array(out));
    }
    // Legacy format: plain base64url of raw UTF-8 bytes (pre-LZ77 era)
    const b64    = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad    = b64.length % 4 ? '='.repeat(4 - b64.length % 4) : '';
    const binary = atob(b64 + pad);
    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
  } catch (e) { return decodeURIComponent(encoded); }
};
