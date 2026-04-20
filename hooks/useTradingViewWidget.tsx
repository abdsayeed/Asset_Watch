'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Serialize config once so we can use it as a stable dep
    const configStr = JSON.stringify(config);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Already loaded — don't reload
        if (el.dataset.loaded) return;

        el.dataset.loaded = 'true';

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.width = '100%';
        widgetDiv.style.height = `${height}px`;
        el.appendChild(widgetDiv);

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = configStr;
        el.appendChild(script);

        // No cleanup — TradingView manages its own iframe lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps — load once on mount, never reload

    return containerRef;
};

export default useTradingViewWidget;
