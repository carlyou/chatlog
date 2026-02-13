type CounterKey =
  | 'observerCallbacks'
  | 'mutationRecordsTotal'
  | 'mutationRecordsMaxBurst'
  | 'refreshScheduled'
  | 'refreshExecuted'
  | 'refreshSkipped'
  | 'urlChangeRefreshes'
  | 'fullReconciles'
  | 'incrementalReconciles'
  | 'parseMessagesCalls'
  | 'messagesParsedTotal'
  | 'messagesParsedLast'
  | 'slowParsesOver50ms'
  | 'slowParsesOver100ms'
  | 'dirtyRootsProcessed';

type TimingKey = 'parseMessagesMs' | 'refreshMs' | 'reconcileMs';

export interface PerfSnapshot {
  counters: Record<CounterKey, number>;
  timings: Record<TimingKey, number[]>;
}

const PERF_FLAG = 'chatlog:perf';
const REPORT_INTERVAL_MS = 10000;
const MAX_TIMING_SAMPLES = 200;

const counters: Record<CounterKey, number> = {
  observerCallbacks: 0,
  mutationRecordsTotal: 0,
  mutationRecordsMaxBurst: 0,
  refreshScheduled: 0,
  refreshExecuted: 0,
  refreshSkipped: 0,
  urlChangeRefreshes: 0,
  fullReconciles: 0,
  incrementalReconciles: 0,
  parseMessagesCalls: 0,
  messagesParsedTotal: 0,
  messagesParsedLast: 0,
  slowParsesOver50ms: 0,
  slowParsesOver100ms: 0,
  dirtyRootsProcessed: 0,
};

const timings: Record<TimingKey, number[]> = {
  parseMessagesMs: [],
  refreshMs: [],
  reconcileMs: [],
};

let reportTimer = 0;

function isEnabled(): boolean {
  try {
    return window.localStorage.getItem(PERF_FLAG) === '1';
  } catch {
    return false;
  }
}

export function perfIsEnabled(): boolean {
  return isEnabled();
}

export function perfSetEnabled(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(PERF_FLAG, '1');
    else window.localStorage.removeItem(PERF_FLAG);
  } catch {
    // ignore storage errors
  }
  perfRefreshReportingState();
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx];
}

function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function pushTiming(key: TimingKey, ms: number): void {
  const arr = timings[key];
  arr.push(ms);
  if (arr.length > MAX_TIMING_SAMPLES) arr.shift();
}

function maybeReport() {
  if (!isEnabled() || reportTimer) return;
  reportTimer = window.setInterval(() => {
    const parse = timings.parseMessagesMs;
    const refresh = timings.refreshMs;
    const reconcile = timings.reconcileMs;

    // eslint-disable-next-line no-console
    console.log(
      `[chatlog:perf] obs=${counters.observerCallbacks} records=${counters.mutationRecordsTotal} maxBurst=${counters.mutationRecordsMaxBurst} ` +
      `refresh(s/e/sk)=${counters.refreshScheduled}/${counters.refreshExecuted}/${counters.refreshSkipped} ` +
      `reconcile(full/inc)=${counters.fullReconciles}/${counters.incrementalReconciles} dirtyRoots=${counters.dirtyRootsProcessed} ` +
      `parse(avg/p95/max)=${mean(parse).toFixed(1)}/${p95(parse).toFixed(1)}/${max(parse).toFixed(1)}ms ` +
      `refresh(avg/p95)=${mean(refresh).toFixed(1)}/${p95(refresh).toFixed(1)}ms ` +
      `reconcile(avg/p95)=${mean(reconcile).toFixed(1)}/${p95(reconcile).toFixed(1)}ms`
    );
  }, REPORT_INTERVAL_MS);
}

function stopReport() {
  if (!reportTimer) return;
  window.clearInterval(reportTimer);
  reportTimer = 0;
}

export function perfGetSnapshot(): PerfSnapshot {
  return {
    counters: { ...counters },
    timings: {
      parseMessagesMs: [...timings.parseMessagesMs],
      refreshMs: [...timings.refreshMs],
      reconcileMs: [...timings.reconcileMs],
    },
  };
}

export function perfReset(): void {
  (Object.keys(counters) as CounterKey[]).forEach((key) => {
    counters[key] = 0;
  });
  (Object.keys(timings) as TimingKey[]).forEach((key) => {
    timings[key] = [];
  });
}

function exposeDebugHandle() {
  if (typeof window === 'undefined') return;
  const target = window as Window & {
    __chatlogPerf?: {
      getSnapshot: () => { counters: Record<CounterKey, number>; timings: Record<TimingKey, number[]> };
      reset: () => void;
    };
  };

  if (target.__chatlogPerf) return;
  target.__chatlogPerf = {
    getSnapshot: perfGetSnapshot,
    reset: perfReset,
  };
}

export function perfInc(key: CounterKey, by = 1): void {
  if (!isEnabled()) return;
  counters[key] += by;
  maybeReport();
  exposeDebugHandle();
}

export function perfSetMax(key: Extract<CounterKey, 'mutationRecordsMaxBurst'>, value: number): void {
  if (!isEnabled()) return;
  counters[key] = Math.max(counters[key], value);
  maybeReport();
  exposeDebugHandle();
}

export function perfSet(key: Extract<CounterKey, 'messagesParsedLast'>, value: number): void {
  if (!isEnabled()) return;
  counters[key] = value;
  maybeReport();
  exposeDebugHandle();
}

export function perfTiming(key: TimingKey, ms: number): void {
  if (!isEnabled()) return;
  pushTiming(key, ms);

  if (key === 'parseMessagesMs') {
    if (ms > 100) {
      counters.slowParsesOver100ms += 1;
      // eslint-disable-next-line no-console
      console.warn(`[chatlog:perf] slow parse: ${ms.toFixed(1)}ms`);
    } else if (ms > 50) {
      counters.slowParsesOver50ms += 1;
      // eslint-disable-next-line no-console
      console.warn(`[chatlog:perf] parse over 50ms: ${ms.toFixed(1)}ms`);
    }
  }

  maybeReport();
  exposeDebugHandle();
}

export function perfRun<T>(timing: TimingKey, fn: () => T): T {
  if (!isEnabled()) return fn();
  const start = performance.now();
  try {
    return fn();
  } finally {
    perfTiming(timing, performance.now() - start);
  }
}

export function perfRefreshReportingState(): void {
  if (isEnabled()) maybeReport();
  else stopReport();
}
