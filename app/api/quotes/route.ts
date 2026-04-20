import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(req: NextRequest) {
    const symbols = req.nextUrl.searchParams.get('symbols');
    if (!symbols) return NextResponse.json([]);
    if (!FINNHUB_API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const list = symbols.split(',').filter(Boolean).slice(0, 20);

    const results = await Promise.all(
        list.map(async (symbol) => {
            try {
                const res = await fetch(
                    `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
                    { cache: 'no-store' }
                );
                if (!res.ok) return { symbol, price: null, change: null, changePercent: null };
                const q = await res.json();
                return {
                    symbol,
                    price: q.c ?? null,
                    change: q.d ?? null,
                    changePercent: q.dp ?? null,
                };
            } catch {
                return { symbol, price: null, change: null, changePercent: null };
            }
        })
    );

    return NextResponse.json(results, {
        headers: { 'Cache-Control': 'no-store' },
    });
}
