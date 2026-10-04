import { useState, useRef, useCallback } from 'react';

/**
 * Hook to manage ProductDetails logic:
 * - Image magnifier mouse tracking
 * - Product quantity management
 */
export function useProductDetails() {
    const [qty, setQty] = useState(1);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showMagnifier, setShowMagnifier] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Handles mouse movement to update magnifier position
     */
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    }, []);

    const incrementQty = () => setQty(prev => prev + 1);
    const decrementQty = () => setQty(prev => Math.max(1, prev - 1));
    const resetQty = () => setQty(1);

    return {
        qty,
        setQty,
        incrementQty,
        decrementQty,
        resetQty,
        mousePos,
        showMagnifier,
        setShowMagnifier,
        containerRef,
        handleMouseMove
    };
}
