import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Platform } from '../../types';
import {
  computeMessageRootSignature,
  getMessageRootForNode,
  getMessageRootSelector,
  getMessageRoots,
  parseMessageRoot,
} from '../lib/parsers';
import { getSelectors } from '../lib/selectors';
import { useUrlChange } from './useUrlChange';
import { perfInc, perfRun, perfSetMax, perfTiming } from '../lib/perf';

const PROCESS_DEBOUNCE_MS = 150;
const PROCESS_BUDGET_MS = 10;
const PROCESS_MAX_ROOTS_PER_TICK = 25;
const FULL_RECONCILE_INTERVAL_MS = 60000;
const IDLE_RECONCILE_TIMEOUT_MS = 2000;
const DIRTY_ROOT_RECONCILE_THRESHOLD = 150;

interface CacheEntry {
  signature: string;
  message: Message | null;
}

function isMeaningfulTextMutation(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !!node.textContent?.trim();
  }
  return false;
}

function mutationIsLikelyControlOnly(target: Node): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest('button, [role="button"], [role="menu"], [role="tooltip"], svg');
}

export function useMessages(platform: Platform) {
  const [messages, setMessages] = useState<Message[]>([]);

  const containerRef = useRef<Element | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const processTimerRef = useRef<number>(0);
  const reconcileTimerRef = useRef<number>(0);
  const idleReconcileRef = useRef<number>(0);
  const delayedReconcileRef = useRef<number>(0);
  const rootOrderRef = useRef<Element[]>([]);
  const dirtyRootsRef = useRef<Set<Element>>(new Set());
  const cacheRef = useRef<WeakMap<Element, CacheEntry>>(new WeakMap());
  const knownRootSetRef = useRef<Set<Element>>(new Set());
  const rebindRef = useRef<() => void>(() => undefined);
  const rootSelector = getMessageRootSelector(platform);

  const resolveContainer = useCallback((): Element | null => {
    const selectors = getSelectors(platform);
    if (!selectors) return null;
    return document.querySelector(selectors.messageContainer);
  }, [platform]);

  const reindexRoots = useCallback((container: Element): Element[] => {
    const roots = getMessageRoots(platform, container);
    rootOrderRef.current = roots;
    knownRootSetRef.current = new Set(roots);
    return roots;
  }, [platform]);

  const parseRootIfChanged = useCallback((root: Element): boolean => {
    const nextSig = computeMessageRootSignature(platform, root);
    const prev = cacheRef.current.get(root);
    if (prev && prev.signature === nextSig) return false;
    const parsed = parseMessageRoot(platform, root);
    cacheRef.current.set(root, { signature: nextSig, message: parsed });
    return true;
  }, [platform]);

  const commitFromCache = useCallback(() => {
    const next: Message[] = [];
    for (const root of rootOrderRef.current) {
      const entry = cacheRef.current.get(root);
      if (entry?.message) next.push(entry.message);
    }
    setMessages(next);
  }, []);

  const fullReconcile = useCallback((reason: 'init' | 'interval' | 'url-change' | 'rebind') => {
    perfInc('fullReconciles');
    perfRun('reconcileMs', () => {
      const container = resolveContainer();
      containerRef.current = container;
      if (!container) {
        rootOrderRef.current = [];
        knownRootSetRef.current = new Set();
        dirtyRootsRef.current.clear();
        setMessages([]);
        return;
      }

      const roots = reindexRoots(container);
      for (const root of roots) {
        parseRootIfChanged(root);
      }
      dirtyRootsRef.current.clear();
      commitFromCache();
      if (reason === 'url-change') perfInc('urlChangeRefreshes');
    });
  }, [commitFromCache, parseRootIfChanged, reindexRoots, resolveContainer]);

  const clearScheduledReconcile = useCallback(() => {
    if (idleReconcileRef.current && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleReconcileRef.current);
    }
    if (delayedReconcileRef.current) {
      window.clearTimeout(delayedReconcileRef.current);
    }
    idleReconcileRef.current = 0;
    delayedReconcileRef.current = 0;
  }, []);

  const scheduleIntervalReconcile = useCallback(() => {
    if (idleReconcileRef.current || delayedReconcileRef.current) return;
    const run = () => {
      idleReconcileRef.current = 0;
      delayedReconcileRef.current = 0;
      fullReconcile('interval');
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleReconcileRef.current = window.requestIdleCallback(run, { timeout: IDLE_RECONCILE_TIMEOUT_MS });
      return;
    }

    delayedReconcileRef.current = window.setTimeout(run, PROCESS_DEBOUNCE_MS);
  }, [fullReconcile]);

  const processDirtyRoots = useCallback(() => {
    processTimerRef.current = 0;
    if (!containerRef.current) {
      perfInc('refreshSkipped');
      return;
    }

    perfInc('refreshExecuted');
    const start = performance.now();
    let parsedCount = 0;
    let changed = false;

    const roots = dirtyRootsRef.current;
    while (roots.size > 0 && parsedCount < PROCESS_MAX_ROOTS_PER_TICK && (performance.now() - start) < PROCESS_BUDGET_MS) {
      const first = roots.values().next();
      if (first.done) break;
      const root = first.value;
      roots.delete(root);

      if (!root.isConnected || !knownRootSetRef.current.has(root)) continue;
      if (parseRootIfChanged(root)) changed = true;
      parsedCount += 1;
    }

    if (parsedCount > 0) perfInc('dirtyRootsProcessed', parsedCount);
    perfTiming('refreshMs', performance.now() - start);

    if (changed) {
      perfInc('incrementalReconciles');
      commitFromCache();
    }

    if (roots.size > 0) {
      perfInc('refreshScheduled');
      processTimerRef.current = window.setTimeout(processDirtyRoots, PROCESS_DEBOUNCE_MS);
    }
  }, [commitFromCache, parseRootIfChanged]);

  const scheduleDirtyProcessing = useCallback(() => {
    if (processTimerRef.current) {
      perfInc('refreshSkipped');
      return;
    }
    perfInc('refreshScheduled');
    processTimerRef.current = window.setTimeout(processDirtyRoots, PROCESS_DEBOUNCE_MS);
  }, [processDirtyRoots]);

  const markRootDirty = useCallback((root: Element | null) => {
    if (!root || !knownRootSetRef.current.has(root)) return;
    dirtyRootsRef.current.add(root);
  }, []);

  const handleMutations = useCallback((records: MutationRecord[]) => {
    perfInc('observerCallbacks');
    perfInc('mutationRecordsTotal', records.length);
    perfSetMax('mutationRecordsMaxBurst', records.length);

    let needsReindex = false;

    for (const record of records) {
      if (record.type === 'characterData') {
        if (!isMeaningfulTextMutation(record.target)) continue;
        const root = getMessageRootForNode(platform, record.target);
        markRootDirty(root);
        continue;
      }

      if (record.type !== 'childList') continue;
      if (mutationIsLikelyControlOnly(record.target)) continue;

      const targetRoot = getMessageRootForNode(platform, record.target);
      if (targetRoot) markRootDirty(targetRoot);

      for (const node of record.addedNodes) {
        const directRoot = getMessageRootForNode(platform, node);
        if (directRoot && directRoot.isConnected) {
          markRootDirty(directRoot);
        }
        if (rootSelector && node instanceof Element && (node.matches(rootSelector) || !!node.querySelector(rootSelector))) {
          needsReindex = true;
        }
      }
      for (const node of record.removedNodes) {
        const removedRoot = getMessageRootForNode(platform, node);
        if (removedRoot) {
          dirtyRootsRef.current.delete(removedRoot);
        }
        if (rootSelector && node instanceof Element && (node.matches(rootSelector) || !!node.querySelector(rootSelector))) {
          needsReindex = true;
        }
      }
    }

    if (needsReindex && containerRef.current) {
      reindexRoots(containerRef.current);
      // Ensure newly discovered roots are parsed on next tick.
      for (const root of rootOrderRef.current) {
        if (!cacheRef.current.has(root)) dirtyRootsRef.current.add(root);
      }
    }

    if (dirtyRootsRef.current.size > DIRTY_ROOT_RECONCILE_THRESHOLD) {
      fullReconcile('rebind');
      return;
    }

    if (dirtyRootsRef.current.size > 0) {
      scheduleDirtyProcessing();
    }
  }, [fullReconcile, markRootDirty, platform, reindexRoots, rootSelector, scheduleDirtyProcessing]);

  const rebindObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    const container = resolveContainer();
    containerRef.current = container;
    if (!container) return;

    reindexRoots(container);
    const observer = new MutationObserver(handleMutations);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    observerRef.current = observer;
  }, [handleMutations, reindexRoots, resolveContainer]);

  useEffect(() => {
    rebindRef.current = rebindObserver;
  }, [rebindObserver]);

  useEffect(() => {
    fullReconcile('init');
    rebindObserver();

    reconcileTimerRef.current = window.setInterval(() => {
      if (document.hidden) return;
      scheduleIntervalReconcile();
    }, FULL_RECONCILE_INTERVAL_MS);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (processTimerRef.current) window.clearTimeout(processTimerRef.current);
      if (reconcileTimerRef.current) window.clearInterval(reconcileTimerRef.current);
      clearScheduledReconcile();
      processTimerRef.current = 0;
      reconcileTimerRef.current = 0;
      dirtyRootsRef.current.clear();
      rootOrderRef.current = [];
      knownRootSetRef.current.clear();
    };
  }, [clearScheduledReconcile, fullReconcile, rebindObserver, scheduleIntervalReconcile]);

  useUrlChange(() => {
    clearScheduledReconcile();
    rebindRef.current();
    fullReconcile('url-change');
  });

  return messages;
}
