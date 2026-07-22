/**
 * Lightweight metrics collector and reporter for simulation scripts.
 * Tracks success/failure/429 counts, latencies, and throughput.
 */
class SimulationReporter {
  constructor(label) {
    this.label = label;
    this.startTime = null;
    this.metrics = {
      total: 0,
      success: 0,
      rateLimited: 0,  // HTTP 429
      authFailed: 0,    // HTTP 401/403
      serverError: 0,   // HTTP 5xx
      connectionError: 0,
      latencies: []     // ms per request
    };
  }

  start() {
    this.startTime = Date.now();
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  🚀 ${this.label}`);
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log(`${'═'.repeat(70)}\n`);
  }

  recordSuccess(latencyMs) {
    this.metrics.total++;
    this.metrics.success++;
    this.metrics.latencies.push(latencyMs);
  }

  recordRateLimited(latencyMs) {
    this.metrics.total++;
    this.metrics.rateLimited++;
    this.metrics.latencies.push(latencyMs);
  }

  recordAuthFailed(latencyMs) {
    this.metrics.total++;
    this.metrics.authFailed++;
    this.metrics.latencies.push(latencyMs);
  }

  recordServerError(latencyMs) {
    this.metrics.total++;
    this.metrics.serverError++;
    this.metrics.latencies.push(latencyMs);
  }

  recordConnectionError() {
    this.metrics.total++;
    this.metrics.connectionError++;
  }

  // Log progress every N requests
  logProgress(interval = 500) {
    if (this.metrics.total % interval === 0 && this.metrics.total > 0) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      const rps = (this.metrics.total / (Date.now() - this.startTime) * 1000).toFixed(0);
      console.log(
        `  [${elapsed}s] Processed: ${this.metrics.total} | ` +
        `✅ ${this.metrics.success} | 🚫 429: ${this.metrics.rateLimited} | ` +
        `❌ Err: ${this.metrics.serverError + this.metrics.connectionError} | ` +
        `⚡ ${rps} req/s`
      );
    }
  }

  finish() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const sorted = this.metrics.latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const avg = sorted.length > 0 ? (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(0) : 0;
    const effectiveRps = (this.metrics.total / (Date.now() - this.startTime) * 1000).toFixed(1);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  🏁 ${this.label} — COMPLETE`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`  Duration:          ${duration}s`);
    console.log(`  Effective RPS:     ${effectiveRps} req/s`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`  ✅ Successful:      ${this.metrics.success}`);
    console.log(`  🚫 Rate Limited:    ${this.metrics.rateLimited}`);
    console.log(`  🔒 Auth Failed:     ${this.metrics.authFailed}`);
    console.log(`  💥 Server Errors:   ${this.metrics.serverError}`);
    console.log(`  🔌 Conn Errors:     ${this.metrics.connectionError}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`  Latency p50:       ${p50}ms`);
    console.log(`  Latency p95:       ${p95}ms`);
    console.log(`  Latency p99:       ${p99}ms`);
    console.log(`  Latency avg:       ${avg}ms`);
    console.log(`${'═'.repeat(70)}\n`);

    // Return structured results for programmatic use
    return {
      label: this.label,
      duration: parseFloat(duration),
      effectiveRps: parseFloat(effectiveRps),
      ...this.metrics,
      latency: { p50, p95, p99, avg: parseFloat(avg) }
    };
  }
}

module.exports = { SimulationReporter };
