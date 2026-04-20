import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG,
} from "@/lib/constants";
import { getWatchlist } from "@/lib/actions/watchlist.actions";

export default async function Home() {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const watchlist = await getWatchlist();

    // Build personalized market overview config using watchlist stocks
    const watchlistSymbols = watchlist.map(w => w.symbol);

    const personalizedOverviewConfig = {
        colorTheme: 'dark',
        dateRange: '1M',
        locale: 'en',
        largeChartUrl: '',
        isTransparent: true,
        backgroundColor: 'rgba(20, 20, 20, 1)',
        showFloatingTooltip: true,
        plotLineColorGrowing: '#0FEDBE',
        plotLineColorFalling: '#FF495B',
        gridLineColor: 'rgba(240, 243, 250, 0)',
        scaleFontColor: '#DBDBDB',
        belowLineFillColorGrowing: 'rgba(15, 237, 190, 0.08)',
        belowLineFillColorFalling: 'rgba(255, 73, 91, 0.08)',
        belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
        belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
        symbolActiveColor: 'rgba(15, 237, 190, 0.05)',
        support_host: 'https://www.tradingview.com',
        backgroundColor: '#141414',
        width: '100%',
        height: 600,
        showSymbolLogo: true,
        showChart: true,
        tabs: watchlistSymbols.length > 0
            ? [
                {
                    title: 'My Watchlist',
                    symbols: watchlistSymbols.slice(0, 10).map(s => ({ s: `NASDAQ:${s}`, d: s })),
                },
                {
                    title: 'Technology',
                    symbols: [
                        { s: 'NASDAQ:AAPL', d: 'Apple' },
                        { s: 'NASDAQ:MSFT', d: 'Microsoft' },
                        { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
                        { s: 'NASDAQ:NVDA', d: 'NVIDIA' },
                        { s: 'NASDAQ:META', d: 'Meta' },
                    ],
                },
            ]
            : [
                {
                    title: 'Technology',
                    symbols: [
                        { s: 'NASDAQ:AAPL', d: 'Apple' },
                        { s: 'NASDAQ:MSFT', d: 'Microsoft' },
                        { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
                        { s: 'NASDAQ:NVDA', d: 'NVIDIA' },
                        { s: 'NASDAQ:META', d: 'Meta' },
                        { s: 'NASDAQ:TSLA', d: 'Tesla' },
                    ],
                },
                {
                    title: 'Financial',
                    symbols: [
                        { s: 'NYSE:JPM', d: 'JPMorgan Chase' },
                        { s: 'NYSE:BAC', d: 'Bank of America' },
                        { s: 'NYSE:WFC', d: 'Wells Fargo' },
                        { s: 'NYSE:MA', d: 'Mastercard' },
                    ],
                },
            ],
    };

    return (
        <div className="flex min-h-screen home-wrapper">
            <section className="grid w-full gap-8 home-section">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title={watchlistSymbols.length > 0 ? "Your Watchlist" : "Market Overview"}
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={personalizedOverviewConfig}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md-col-span xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
        </div>
    );
}
