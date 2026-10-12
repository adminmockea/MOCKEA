import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/**
 * Progressively renders a large array of items in batches as the user scrolls,
 * keeping initial DOM mount size small so dropdowns and filters open instantaneously.
 */
export default function useProgressiveList(items = [], batchSize = 24) {
    const [visibleCount, setVisibleCount] = useState(batchSize);
    const [prevItems, setPrevItems] = useState(items);
    const sentinelRef = useRef(null);

    if (items !== prevItems) {
        setPrevItems(items);
        setVisibleCount(batchSize);
    }

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
