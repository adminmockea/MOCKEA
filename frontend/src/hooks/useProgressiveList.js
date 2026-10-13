import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/**
 * Progressively renders a large array of items in batches as the user scrolls,
 * keeping initial DOM mount size small so dropdowns and filters open instantaneously.
 */
export default function useProgressiveList(items = [], batchSize = 24) {
    const [visibleCount, setVisibleCount] = useState(batchSize);
    const prevItemsRef = useRef(items);
    const sentinelRef = useRef(null);

    // Reset visibleCount back to batchSize only when items actually change
    useEffect(() => {
        const prev = prevItemsRef.current;
        if (prev !== items) {
            prevItemsRef.current = items;
            const isDifferent =
                !prev ||
                prev.length !== items.length ||
                prev.some((it, i) => it !== items[i]);
            if (isDifferent) {
                setVisibleCount(batchSize);
            }
        }
    }, [items, batchSize]);

    const hasMore = visibleCount < items.length;

    const loadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
    }, [batchSize, items.length]);

    useEffect(() => {
        if (!hasMore) return;
        const el = sentinelRef.current;
        if (!el || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
                }
            },
            { rootMargin: "400px 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, batchSize, items.length]);

    const visibleItems = useMemo(
        () => items.slice(0, visibleCount),
        [items, visibleCount]
    );

    return {
        visibleItems,
        visibleCount,
        hasMore,
        loadMore,
        sentinelRef,
    };
}
