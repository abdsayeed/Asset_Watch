'use client';

import React, { memo, useMemo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    // Stable config reference — prevents hook from re-running on parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableConfig = useMemo(() => config, [JSON.stringify(config)]);
    const containerRef = useTradingViewWidget(scriptUrl, stableConfig, height);

    return (
        <div className="w-full">
            {title && <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>}
            <div
                ref={containerRef}
                className={cn('tradingview-widget-container', className)}
                style={{ minHeight: height, backgroundColor: '#141414', borderRadius: '8px', overflow: 'hidden' }}
            />
        </div>
    );
};

export default memo(TradingViewWidget);
