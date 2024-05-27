#!/usr/bin/env ts-node
/**
 * Trace an EVM tx. Requires an RPC with tracing enabled (debug_traceTransaction).
 * Fallbacks to tx + receipt dump if trace is unavailable.
 *
 * Usage:
 *   RPC_URL=https://your-node ts-node trace.ts 0xTX_HASH
 */
import { argv, env, exit } from 'process';

const RPC = env.RPC_URL || '';
if (!RPC) { console.error('Set RPC_URL to your JSON-RPC endpoint'); exit(1); }

const hash = argv[2];
if (!hash) { console.error('Usage: ts-node trace.ts <txHash>'); exit(1); }

async function rpc(method: string, params: any[]) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

(async () => {
  try {
    try {
      const trace = await rpc('debug_traceTransaction', [hash, { tracer: 'callTracer' }]);
      console.log(JSON.stringify(trace, null, 2));
    } catch (e: any) {
      console.warn('debug_traceTransaction unavailable, falling back to tx+receipt');
      const tx = await rpc('eth_getTransactionByHash', [hash]);
      const receipt = await rpc('eth_getTransactionReceipt', [hash]);
      console.log(JSON.stringify({ tx, receipt }, null, 2));
    }
  } catch (e: any) {
    console.error('Error:', e.message || e);
    exit(2);
  }
})();
