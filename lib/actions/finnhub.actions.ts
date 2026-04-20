'use server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// Static popular stocks — shown instantly with no API call needed
const POPULAR_STOCKS: StockWithWatchlistStatus[] = [
    { symbol: 'AAPL',  name: 'Apple Inc.',             exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'MSFT',  name: 'Microsoft Corporation',  exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',           exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.',         exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'TSLA',  name: 'Tesla Inc.',              exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'META',  name: 'Meta Platforms Inc.',     exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'NVDA',  name: 'NVIDIA Corporation',      exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'NFLX',  name: 'Netflix Inc.',            exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
    { symbol: 'ORCL',  name: 'Oracle Corporation',      exchange: 'NYSE',   type: 'Common Stock', isInWatchlist: false },
    { symbol: 'CRM',   name: 'Salesforce Inc.',         exchange: 'NYSE',   type: 'Common Stock', isInWatchlist: false },
];

export async function searchStocks(query?: string): Promise<StockWithWatchlistStatus[]> {
    // No query — return static list instantly, no API call needed
    if (!query || !query.trim()) {
        return POPULAR_STOCKS;
    }

    // With a query — hit Finnhub search if key is available
    if (!FINNHUB_API_KEY) {
        // Filter static list as a fallback
        const q = query.trim().toLowerCase();
        return POPULAR_STOCKS.filter(
            (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
    }

    try {
        const res = await fetch(
            `${BASE_URL}/search?q=${encodeURIComponent(query.trim())}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) throw new Error(`Finnhub search failed: ${res.status}`);
        const data: FinnhubSearchResponse = await res.json();
        return (data.result || []).slice(0, 20).map((item) => ({
            symbol: item.symbol,
            name: item.description,
            exchange: item.displaySymbol || item.symbol,
            type: item.type,
            isInWatchlist: false,
        }));
    } catch (error) {
        console.error('searchStocks error:', error);
        const q = query.trim().toLowerCase();
        return POPULAR_STOCKS.filter(
            (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
    }
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    if (!FINNHUB_API_KEY) {
        console.warn('FINNHUB_API_KEY not set — skipping news fetch');
        return [];
    }

    try {
        if (symbols && symbols.length > 0) {
            const today = new Date();
            const from = new Date(today);
            from.setDate(from.getDate() - 7);
            const fromStr = from.toISOString().split('T')[0];
            const toStr = today.toISOString().split('T')[0];

            const results = await Promise.all(
                symbols.slice(0, 5).map(async (symbol) => {
                    const res = await fetch(
                        `${BASE_URL}/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${FINNHUB_API_KEY}`,
                        { next: { revalidate: 3600 } }
                    );
                    if (!res.ok) return [];
                    return res.json() as Promise<MarketNewsArticle[]>;
                })
            );

            const articles = results.flat();
            if (articles.length > 0) return articles;
        }

        const res = await fetch(
            `${BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error(`Finnhub news request failed: ${res.status}`);
        return res.json() as Promise<MarketNewsArticle[]>;
    } catch (error) {
        console.error('getNews error:', error);
        return [];
    }
}
