import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, Platform } from '../../types';
import { getAdapter } from '../lib/adapters/registry';
import {
  computeMessageRootSignature,
  getMessageRootForNode,
  getMessageRootSelector,
  getMessageRoots,
  parseMessageRoot,
} from '../lib/parsers';
import { perfInc, perfRun, perfSetMax, perfTiming } from '../lib/perf';
import { useUrlChange } from './useUrlChange';

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

interface PersistentEntry {
  id: string;
  message: Message;
  signature: string;
  // Position within the virtual list (claude.ai/code sets `data-index` on
  // each entry's wrapper). Used as the sort key when commit-emitting the
  // full message list. Infinity for entries with no index attribute — they
  // sort to the end.
  index: number;
}

// Read the virtual-list index off a mounted root. claude.ai/code wraps
// every entry in <div data-index="N"> where N is monotonic across the
// whole conversation, so we can preserve order even after the element is
// unmounted from DOM.
function readVirtualIndex(root: Element): number {
  const wrapper = root.closest('[data-index]');
  if (!wrapper) return Number.POSITIVE_INFINITY;
  const raw = wrapper.getAttribute('data-index');
  if (raw === null) return Number.POSITIVE_INFINITY;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function isMeaningfulTextMutation(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !!node.textContent?.trim();
  }
  return false;
}

function mutationIsLikelyControlOnly(target: Node): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    'button, [role="button"], [role="menu"], [role="tooltip"], svg',
  );
}

export function useMessages(
  platform: Platform,
  pausedRef?: React.RefObject<boolean>,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<Element | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const processTimerRef = useRef<number>(0);
  const reconcileTimerRef = useRef<number>(0);
  const idleReconcileRef = useRef<number>(0);
  const delayedReconcileRef = useRef<number>(0);
  const rootOrderRef = useRef<Element[]>([]);
  const dirtyRootsRef = useRef<Set<Element>>(new Set());
  const cacheRef = useRef<WeakMap<Element, CacheEntry>>(new WeakMap());
  // Persistent cache for platforms whose adapters expose getStableEntryId
  // (i.e. claude.ai/code, where the virtual scroller unmounts entries the
  // user has scrolled past). Survives mount/unmount cycles so the sidebar
  // can show the full conversation, not just what's on screen.
  const persistentCacheRef = useRef<Map<string, PersistentEntry>>(new Map());
  const knownRootSetRef = useRef<Set<Element>>(new Set());
  const rebindRef = useRef<() => void>(() => undefined);
  const rootSelector = getMessageRootSelector(platform);
  const adapter = platform ? getAdapter(platform) : null;
  const usePersistentCache = !!adapter?.getStableEntryId;

  const resolveContainer = useCallback((): Element | null => {
    if (!platform) return null;
    const adapter = getAdapter(platform);
    if (!adapter) return null;
    return document.querySelector(adapter.selectors.messageContainer);
  }, [platform]);

  const reindexRoots = useCallback(
    (container: Element): Element[] => {
      const roots = getMessageRoots(platform, container);
      rootOrderRef.current = roots;
      knownRootSetRef.current = new Set(roots);
      return roots;
    },
    [platform],
  );

  const parseRootIfChanged = useCallback(
    (root: Element): boolean => {
      const nextSig = computeMessageRootSignature(platform, root);
      const prev = cacheRef.current.get(root);
      if (prev && prev.signature === nextSig) return false;
      const parsed = parseMessageRoot(platform, root);
      cacheRef.current.set(root, { signature: nextSig, message: parsed });

      // Mirror into the persistent (id-keyed) cache when the adapter exposes
      // a stable per-entry id. The element cache above is still authoritative
      // for "does this currently-mounted element need re-parsing" — this is
      // additive, holding messages whose elements have since been unmounted.
      if (parsed && adapter?.getStableEntryId) {
        const id = adapter.getStableEntryId(root);
        if (id) {
          persistentCacheRef.current.set(id, {
            id,
            message: parsed,
            signature: nextSig,
            index: readVirtualIndex(root),
          });
        }
      }
      return true;
    },
    [adapter, platform],
  );

  const commitFromCache = useCallback(() => {
    if (usePersistentCache) {
      const all = [...persistentCacheRef.current.values()];
      all.sort((a, b) => a.index - b.index);
      setMessages(all.map((e) => e.message));
    } else {
      const next: Message[] = [];
      for (const root of rootOrderRef.current) {
        const entry = cacheRef.current.get(root);
        if (entry?.message) next.push(entry.message);
      }
      setMessages(next);
    }
    setLoading(false);
  }, [usePersistentCache]);

  const fullReconcile = useCallback(
    (reason: 'init' | 'interval' | 'url-change' | 'rebind') => {
      perfInc('fullReconciles');
      perfRun('reconcileMs', () => {
        const container = resolveContainer();
        containerRef.current = container;
        if (!container) {
          rootOrderRef.current = [];
          knownRootSetRef.current = new Set();
          dirtyRootsRef.current.clear();
          setMessages([]);
          setLoading(false);
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
    },
    [commitFromCache, parseRootIfChanged, reindexRoots, resolveContainer],
  );

  const clearScheduledReconcile = useCallback(() => {
    if (
      idleReconcileRef.current &&
      typeof window.cancelIdleCallback === 'function'
    ) {
      window.cancelIdleCallback(idleReconcileRef.current);
    }
    if (delayedReconcileRef.current) {
      window.clearTimeout(delayedReconcileRef.current);
    }
    idleReconcileRef.current = 0;
    delayedReconcileRef.current = 0;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pausedRef is a stable ref read at call time, not a reactive dependency
  const scheduleIntervalReconcile = useCallback(() => {
    if (idleReconcileRef.current || delayedReconcileRef.current) return;
    const run = () => {
      idleReconcileRef.current = 0;
      delayedReconcileRef.current = 0;
      if (pausedRef?.current) return;
      fullReconcile('interval');
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleReconcileRef.current = window.requestIdleCallback(run, {
        timeout: IDLE_RECONCILE_TIMEOUT_MS,
      });
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
    while (
      roots.size > 0 &&
      parsedCount < PROCESS_MAX_ROOTS_PER_TICK &&
      performance.now() - start < PROCESS_BUDGET_MS
    ) {
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
      processTimerRef.current = window.setTimeout(
        processDirtyRoots,
        PROCESS_DEBOUNCE_MS,
      );
    }
  }, [commitFromCache, parseRootIfChanged]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pausedRef is a stable ref read at call time, not a reactive dependency
  const scheduleDirtyProcessing = useCallback(() => {
    if (pausedRef?.current) return;
    if (processTimerRef.current) {
      perfInc('refreshSkipped');
      return;
    }
    perfInc('refreshScheduled');
    processTimerRef.current = window.setTimeout(
      processDirtyRoots,
      PROCESS_DEBOUNCE_MS,
    );
  }, [processDirtyRoots]);

  const markRootDirty = useCallback((root: Element | null) => {
    if (!root || !knownRootSetRef.current.has(root)) return;
    dirtyRootsRef.current.add(root);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pausedRef is a stable ref read at call time, not a reactive dependency
  const handleMutations = useCallback(
    (records: MutationRecord[]) => {
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
          if (directRoot?.isConnected) {
            markRootDirty(directRoot);
          }
          if (
            rootSelector &&
            node instanceof Element &&
            (node.matches(rootSelector) || !!node.querySelector(rootSelector))
          ) {
            needsReindex = true;
          }
        }
        for (const node of record.removedNodes) {
          const removedRoot = getMessageRootForNode(platform, node);
          if (removedRoot) {
            dirtyRootsRef.current.delete(removedRoot);
          }
          if (
            rootSelector &&
            node instanceof Element &&
            (node.matches(rootSelector) || !!node.querySelector(rootSelector))
          ) {
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
        if (!pausedRef?.current) fullReconcile('rebind');
        return;
      }

      if (dirtyRootsRef.current.size > 0) {
        scheduleDirtyProcessing();
      }
    },
    [
      fullReconcile,
      markRootDirty,
      platform,
      reindexRoots,
      rootSelector,
      scheduleDirtyProcessing,
    ],
  );

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
      if (reconcileTimerRef.current)
        window.clearInterval(reconcileTimerRef.current);
      clearScheduledReconcile();
      processTimerRef.current = 0;
      reconcileTimerRef.current = 0;
      dirtyRootsRef.current.clear();
      rootOrderRef.current = [];
      knownRootSetRef.current.clear();
      persistentCacheRef.current.clear();
    };
  }, [
    clearScheduledReconcile,
    fullReconcile,
    rebindObserver,
    scheduleIntervalReconcile,
  ]);

  useUrlChange(
    () => {
      clearScheduledReconcile();
      persistentCacheRef.current.clear();
      rebindRef.current();
      fullReconcile('url-change');
    },
    () => {
      setLoading(true);
      setMessages([]);
    },
  );

  const reconcile = useCallback(
    () => fullReconcile('interval'),
    [fullReconcile],
  );

  // Locate the live DOM element for a message id. The cached `message.element`
  // may be stale (the virtualizer mounts new element instances for the same
  // entry as you scroll), so we always re-query the live tree first.
  const findEntryElement = useCallback(
    (id: string): HTMLElement | null => {
      const container = containerRef.current ?? resolveContainer();
      if (!container) return null;
      if (adapter?.getStableEntryId) {
        return container.querySelector(
          `[data-epitaxy-entry="${CSS.escape(id)}"]`,
        ) as HTMLElement | null;
      }
      // Fall back to the cached element (claude /chat, chatgpt — no virtualization).
      for (const root of rootOrderRef.current) {
        const entry = cacheRef.current.get(root);
        if (entry?.message?.id === id) return root as HTMLElement;
      }
      return null;
    },
    [adapter, resolveContainer],
  );

  // Iteratively scroll the virtual container until the target entry mounts.
  // Each pass:
  //   1. If the target is already in DOM, hand off to the caller.
  //   2. Otherwise look at the currently-mounted index window and estimate
  //      the offset of the target index using the average height of the
  //      currently-mounted items.
  //   3. Jump the scroll there and wait one frame for the virtualizer to
  //      re-window.
  // Bounded by MAX_SCROLL_ATTEMPTS so a missing/garbage cache can't loop
  // forever.
  const ITERATIVE_SCROLL_ATTEMPTS = 8;
  const ITERATIVE_SCROLL_SETTLE_MS = 120;

  const scrollVirtualToIndex = useCallback(
    async (id: string, targetIndex: number): Promise<HTMLElement | null> => {
      const container = containerRef.current ?? resolveContainer();
      if (!container) return null;
      for (let attempt = 0; attempt < ITERATIVE_SCROLL_ATTEMPTS; attempt++) {
        const found = findEntryElement(id);
        if (found) return found;

        const wrappers =
          container.querySelectorAll<HTMLElement>('[data-index]');
        if (wrappers.length === 0) return null;
        let minIdx = Number.POSITIVE_INFINITY;
        let maxIdx = Number.NEGATIVE_INFINITY;
        for (const w of wrappers) {
          const i = Number(w.getAttribute('data-index'));
          if (Number.isNaN(i)) continue;
          if (i < minIdx) minIdx = i;
          if (i > maxIdx) maxIdx = i;
        }
        if (minIdx === Number.POSITIVE_INFINITY) return null;

        const firstW = container.querySelector<HTMLElement>(
          `[data-index="${minIdx}"]`,
        );
        const lastW = container.querySelector<HTMLElement>(
          `[data-index="${maxIdx}"]`,
        );
        if (!firstW || !lastW) return null;

        const containerRect = container.getBoundingClientRect();
        const scrollTop = (container as HTMLElement).scrollTop;
        const firstTopAbs =
          firstW.getBoundingClientRect().top - containerRect.top + scrollTop;
        const lastBottomAbs =
          lastW.getBoundingClientRect().bottom - containerRect.top + scrollTop;
        const itemCount = maxIdx - minIdx + 1;
        const avgItemHeight = Math.max(
          1,
          (lastBottomAbs - firstTopAbs) / itemCount,
        );

        let nextTop: number;
        if (targetIndex < minIdx) {
          nextTop = firstTopAbs - (minIdx - targetIndex) * avgItemHeight;
        } else if (targetIndex > maxIdx) {
          nextTop =
            lastBottomAbs + (targetIndex - maxIdx - 1) * avgItemHeight - 200;
        } else {
          // In range but not findable — let the virtualizer settle.
          await new Promise((r) => setTimeout(r, ITERATIVE_SCROLL_SETTLE_MS));
          continue;
        }
        const maxScroll = container.scrollHeight - container.clientHeight;
        nextTop = Math.max(0, Math.min(nextTop, maxScroll));
        (container as HTMLElement).scrollTop = nextTop;
        await new Promise((r) => setTimeout(r, ITERATIVE_SCROLL_SETTLE_MS));
      }
      return findEntryElement(id);
    },
    [findEntryElement, resolveContainer],
  );

  // Public: jump to a message by id. If the entry is currently in DOM we
  // resolve immediately; otherwise iteratively scroll the virtual container
  // until the entry mounts, then resolve with the mounted element. Returns
  // null if we still can't find it (e.g. id not in the persistent cache).
  const findMessageElement = useCallback(
    async (id: string): Promise<HTMLElement | null> => {
      const direct = findEntryElement(id);
      if (direct) return direct;
      const cached = persistentCacheRef.current.get(id);
      if (!cached || !Number.isFinite(cached.index)) return null;
      return scrollVirtualToIndex(id, cached.index);
    },
    [findEntryElement, scrollVirtualToIndex],
  );

  return [messages, reconcile, loading, findMessageElement] as const;
}
