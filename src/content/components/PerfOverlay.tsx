import { useEffect, useState } from 'react';
import { perfGetSnapshot, type PerfSnapshot } from '../lib/perf';

interface PerfOverlayProps {
  visible: boolean;
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx];
}

function initialSnapshot(): PerfSnapshot {
  return perfGetSnapshot();
}

export function PerfOverlay({ visible }: PerfOverlayProps) {
  const [snapshot, setSnapshot] = useState<PerfSnapshot>(initialSnapshot);

  useEffect(() => {
    if (!visible) return;
    setSnapshot(perfGetSnapshot());
    const timer = window.setInterval(() => {
      setSnapshot(perfGetSnapshot());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const parseTimes = snapshot.timings.parseMessagesMs;
  const refreshTimes = snapshot.timings.refreshMs;
  const reconcileTimes = snapshot.timings.reconcileMs;
  const counters = snapshot.counters;

  return (
    <div className="chatlog-perf-overlay">
      <div className="chatlog-perf-title">Perf</div>
      <div className="chatlog-perf-row">parse avg/p95: {avg(parseTimes).toFixed(1)}/{p95(parseTimes).toFixed(1)}ms</div>
      <div className="chatlog-perf-row">reconcile avg/p95: {avg(reconcileTimes).toFixed(1)}/{p95(reconcileTimes).toFixed(1)}ms</div>
      <div className="chatlog-perf-row">refresh avg/p95: {avg(refreshTimes).toFixed(1)}/{p95(refreshTimes).toFixed(1)}ms</div>
      <div className="chatlog-perf-row">obs/records: {counters.observerCallbacks}/{counters.mutationRecordsTotal}</div>
      <div className="chatlog-perf-row">refresh s/e: {counters.refreshScheduled}/{counters.refreshExecuted}</div>
      <div className="chatlog-perf-row">reconcile f/i: {counters.fullReconciles}/{counters.incrementalReconciles}</div>
      <div className="chatlog-perf-row">dirty roots: {counters.dirtyRootsProcessed}</div>
    </div>
  );
}
