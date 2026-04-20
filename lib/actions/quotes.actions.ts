'use server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export type StockQuote = {
    symbol: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    marketCap: number | null;
    peRatio: number | null;
};

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (!FINNHUB_API_KEY || symbols.length === 0) {
        return symbols.map(s => ({
            symbol: s, price: null, change: null,
            changePercent: null, marketCap: null, peRatio: null,
        }));
    }

    const results = await Promise.all(
        symbols.map(async (symbol): Promise<StockQuote> => {
            try {
                const [quoteRes, metricsRes] = await Promise.all([
                    fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
                        { next: { revalidate: 60 } }),
                    fetch(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`,
                        { next: { revalidate: 3600 } }),
                ]);

                const quote = quoteRes.ok ? await quoteRes.json() : {};
                const metrics = metricsRes.ok ? await metricsRes.json() : {};

                return {
                    symbol,
                    price: quote.c ?? null,
                    change: quote.d ?? null,
                    changePercent: quote.dp ?? null,
                    marketCap: metrics?.metric?.marketCapitalization ?? null,
                    peRatio: metrics?.metric?.peBasicExclExtraTTM ?? null,
                };
            } catch {
                return { symbol, price: null, change: null, changePercent: null, marketCap: null, peRatio: null };
            }
        })
    );

    return results;
}
