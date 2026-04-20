'use client';
import { useEffect, useRef, useState } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Observe when container enters viewport
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Dark background immediately — no white flash
        el.style.backgroundColor = '#141414';
        el.style.borderRadius = '8px';
        el.style.overflow = 'hidden';
        el.style.position = 'relative';

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Inject script once visible
    useEffect(() => {
        if (!isVisible) return;
        const el = containerRef.current;
        if (!el || el.dataset.loaded) return;

        el.style.backgroundColor = '#141414';

        // Dark overlay that sits on top until iframe loads
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            background: #141414;
            z-index: 1;
            pointer-events: none;
            transition: opacity 0.5s ease;
        `;
        overlay.dataset.tvOverlay = 'true';
        el.appendChild(overlay);

        // Widget div
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.cssText = `width:100%;height:${height}px;background:#141414;`;
        el.appendChild(widgetDiv);

        // Script
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);

        // Fade out overlay once iframe appears
        const fadeOutOverlay = () => {
            const iframe = el.querySelector('iframe');
            if (iframe) {
                // Wait a bit for TradingView to set its own dark bg
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 500);
                }, 800);
            }
        };

        // Poll for iframe appearance
        const poll = setInterval(() => {
            if (el.querySelector('iframe')) {
                clearInterval(poll);
                fadeOutOverlay();
            }
        }, 100);

        el.appendChild(script);
        el.dataset.loaded = 'true';

        return () => {
            clearInterval(poll);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                delete containerRef.current.dataset.loaded;
            }
        };
    }, [isVisible, scriptUrl, config, height]);

    return containerRef;
};

export default useTradingViewWidget;
