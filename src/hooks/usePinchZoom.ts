import { useEffect, useRef } from 'react';

interface UsePinchZoomProps {
    ref: React.RefObject<HTMLDivElement | null>;
    zoom: number;
    setZoom: (zoom: number | ((prev: number) => number)) => void;
    pan: { x: number; y: number };
    setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
    isLocked?: boolean;
    isDrawingWithStylusRef: React.RefObject<boolean>;
    isPinchingRef: React.MutableRefObject<boolean>;
}

export function usePinchZoom({
    ref,
    zoom,
    setZoom,
    pan,
    setPan,
    isLocked = false,
    isDrawingWithStylusRef,
    isPinchingRef,
}: UsePinchZoomProps) {
    const activePointersRef = useRef<Map<number, PointerEvent>>(new Map());
    const prevDistanceRef = useRef<number | null>(null);
    const prevMidpointRef = useRef<{ x: number; y: number } | null>(null);

    // Maintain stable refs for state values to prevent stale closures and event re-binding issues
    const stateRef = useRef({ zoom, pan, isLocked });
    useEffect(() => {
        stateRef.current = { zoom, pan, isLocked };
    }, [zoom, pan, isLocked]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const onPointerDown = (e: PointerEvent) => {
            if (stateRef.current.isLocked) return;
            // Only handle touch pointers for multi-finger pinch-to-zoom gestures
            if (e.pointerType !== 'touch') return;
            if (isDrawingWithStylusRef.current) return;

            activePointersRef.current.set(e.pointerId, e);

            if (activePointersRef.current.size === 2) {
                isPinchingRef.current = true;
                const pointers = Array.from(activePointersRef.current.values());
                const p1 = pointers[0];
                const p2 = pointers[1];

                const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
                prevDistanceRef.current = dist;
                prevMidpointRef.current = {
                    x: (p1.clientX + p2.clientX) / 2,
                    y: (p1.clientY + p2.clientY) / 2,
                };
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            if (stateRef.current.isLocked) return;
            if (!activePointersRef.current.has(e.pointerId)) return;

            // Update stored position for this pointer ID
            activePointersRef.current.set(e.pointerId, e);

            if (activePointersRef.current.size === 2) {
                isPinchingRef.current = true;
                if (e.cancelable !== false) {
                    e.preventDefault();
                }

                const pointers = Array.from(activePointersRef.current.values());
                const p1 = pointers[0];
                const p2 = pointers[1];

                const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
                const midX = (p1.clientX + p2.clientX) / 2;
                const midY = (p1.clientY + p2.clientY) / 2;

                const prevDistance = prevDistanceRef.current;
                const prevMidpoint = prevMidpointRef.current;

                if (prevDistance !== null && prevDistance > 0 && prevMidpoint) {
                    const factor = dist / prevDistance;
                    
                    const currentZoom = stateRef.current.zoom;
                    // Keep scale bounds between 0.15 and 5.0
                    let nextZoom = currentZoom * factor;
                    nextZoom = Math.max(0.15, Math.min(5.0, nextZoom));

                    const rect = element.getBoundingClientRect();
                    const relativeMidX = midX - rect.left;
                    const relativeMidY = midY - rect.top;

                    const currentPan = stateRef.current.pan;

                    // Midpoint-focused Zoom Adjustment
                    const scaleChange = nextZoom / currentZoom;
                    const nextPanX = relativeMidX - (relativeMidX - currentPan.x) * scaleChange;
                    const nextPanY = relativeMidY - (relativeMidY - currentPan.y) * scaleChange;

                    // Midpoint Shifting / Panning
                    const dx = midX - prevMidpoint.x;
                    const dy = midY - prevMidpoint.y;

                    setZoom(nextZoom);
                    setPan({
                        x: nextPanX + dx,
                        y: nextPanY + dy,
                    });
                }

                prevDistanceRef.current = dist;
                prevMidpointRef.current = { x: midX, y: midY };
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            activePointersRef.current.delete(e.pointerId);
            if (activePointersRef.current.size < 2) {
                isPinchingRef.current = false;
                prevDistanceRef.current = null;
                prevMidpointRef.current = null;
            }
        };

        const onPointerCancel = (e: PointerEvent) => {
            activePointersRef.current.delete(e.pointerId);
            if (activePointersRef.current.size < 2) {
                isPinchingRef.current = false;
                prevDistanceRef.current = null;
                prevMidpointRef.current = null;
            }
        };

        element.addEventListener('pointerdown', onPointerDown);
        // Track pointer movements globally to allow fingers to drift off element seamlessly
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);

        return () => {
            element.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerCancel);
        };
    }, [ref, setZoom, setPan, isDrawingWithStylusRef, isPinchingRef]);
}
