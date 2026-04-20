'use client';
import { useEffect, useRef, useState } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

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

    useEffect(() => {
        if (!isVisible) return;
        const el = containerRef.current;
        if (!el || el.dataset.loaded) return;

        el.style.backgroundColor = '#141414';

        // Overlay covers the white iframe until TradingView renders dark
        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:absolute',
            'inset:0',
            'background:#141414',
            'z-index:10',
            'border-radius:8px',
            'transition:opacity 0.4s ease',
        ].join(';');
        el.appendChild(overlay);

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.cssText = `width:100%;height:${height}px;background:#141414;`;
        el.appendChild(widgetDiv);

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        el.appendChild(script);
        el.dataset.loaded = 'true';

        // Wait for iframe to appear, then wait for it to fully load
        let removed = false;
        const removeOverlay = () => {
            if (removed) return;
            removed = true;
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 450);
        };

        const poll = setInterval(() => {
            const iframe = el.querySelector('iframe');
            if (!iframe) return;
            clearInterval(poll);

            // iframe found — wait for its load event
            if (iframe.getAttribute('src')) {
                // already has src, wait for load
                iframe.addEventListener('load', () => {
                    // Extra delay so TradingView's dark theme paints
                    setTimeout(removeOverlay, 1500);
                }, { once: true });
            } else {
                // src not set yet, observe attribute
                const srcObserver = new MutationObserver(() => {
                    if (iframe.getAttribute('src')) {
                        srcObserver.disconnect();
                        iframe.addEventListener('load', () => {
                            setTimeout(removeOverlay, 1500);
                        }, { once: true });
                    }
                });
                srcObserver.observe(iframe, { attributes: true, attributeFilter: ['src'] });
            }

            // Hard fallback — remove after 5s no matter what
            setTimeout(removeOverlay, 5000);
        }, 100);

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
