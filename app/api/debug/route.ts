import { NextResponse } from 'next/server';

export async function GET() {
    const key = process.env.FINNHUB_API_KEY;

    if (!key) {
        return NextResponse.json({ error: 'FINNHUB_API_KEY not set' }, { status: 500 });
    }

    try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
        const data = await res.json();
        return NextResponse.json({
            keyPresent: true,
            keyPrefix: key.slice(0, 6) + '...',
            status: res.status,
            data,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
