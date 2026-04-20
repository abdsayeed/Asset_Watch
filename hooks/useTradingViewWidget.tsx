'use client';
import { useEffect, useRef, useState } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Observe when container enters viewport
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
            { rootMargin: '100px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Inject script once visible — no overlay, no polling, no delays
    useEffect(() => {
        if (!isVisible) return;
        const el = containerRef.current;
        if (!el || el.dataset.loaded) return;

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.cssText = `width:100%;height:${height}px;`;
        el.appendChild(widgetDiv);

        const script = document.createElement('script');
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
