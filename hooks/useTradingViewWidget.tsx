'use client';
import { useEffect, useRef, useState } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Step 1: observe when the container enters the viewport
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // start loading 200px before it's visible
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Step 2: only inject the script once the widget is visible
    useEffect(() => {
        if (!isVisible) return;
        const el = containerRef.current;
        if (!el || el.dataset.loaded) return;

        el.innerHTML = `<div class="tradingview-widget-container__widget" style="width:100%;height:${height}px;"></div>`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        el.appendChild(script);
        el.dataset.loaded = 'true';

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                delete containerRef.current.dataset.loaded;
            }
        };
    }, [isVisible, scriptUrl, config, height]);

    return containerRef;
};

export default useTradingViewWidget;
