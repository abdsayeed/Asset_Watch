'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

const POPULAR_STOCKS: Omit<StockWithWatchlistStatus, 'isInWatchlist'>[] = [
    { symbol: 'AAPL',  name: 'Apple Inc.',             exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'MSFT',  name: 'Microsoft Corporation',  exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',           exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.',         exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'TSLA',  name: 'Tesla Inc.',              exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'META',  name: 'Meta Platforms Inc.',     exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'NVDA',  name: 'NVIDIA Corporation',      exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'NFLX',  name: 'Netflix Inc.',            exchange: 'NASDAQ', type: 'Common Stock' },
    { symbol: 'ORCL',  name: 'Oracle Corporation',      exchange: 'NYSE',   type: 'Common Stock' },
    { symbol: 'CRM',   name: 'Salesforce Inc.',         exchange: 'NYSE',   type: 'Common Stock' },
];

async function getUserWatchlistSymbols(): Promise<Set<string>> {
    try {
        await connectToDatabase();
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return new Set();
        const items = await Watchlist.find({ userId: session.user.id }, { symbol: 1, _id: 0 }).lean();
        return new Set(items.map(i => i.symbol.toUpperCase()));
    } catch {
        return new Set();
    }
}

export async function searchStocks(query?: string): Promise<StockWithWatchlistStatus[]> {
    const watchlistSymbols = await getUserWatchlistSymbols();

    if (!query || !query.trim()) {
        return POPULAR_STOCKS.map(s => ({ ...s, isInWatchlist: watchlistSymbols.has(s.symbol) }));
    }

    if (!FINNHUB_API_KEY) {
        const q = query.trim().toLowerCase();
        return POPULAR_STOCKS
            .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
            .map(s => ({ ...s, isInWatchlist: watchlistSymbols.has(s.symbol) }));
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
            isInWatchlist: watchlistSymbols.has(item.symbol.toUpperCase()),
        }));
    } catch (error) {
        console.error('searchStocks error:', error);
        const q = query.trim().toLowerCase();
        return POPULAR_STOCKS
            .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
            .map(s => ({ ...s, isInWatchlist: watchlistSymbols.has(s.symbol) }));
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
