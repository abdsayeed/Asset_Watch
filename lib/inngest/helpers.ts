// Plain helper functions for use inside Inngest steps
// These do NOT use 'use server' — they run in Node.js context

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export async function getUsersForEmail(): Promise<UserForNewsEmail[]> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db!;

    const users = await db
        .collection('user')
        .find({}, { projection: { _id: 1, name: 1, email: 1 } })
        .toArray();

    return users.map((u) => ({
        id: u._id.toString(),
        name: u.name ?? '',
        email: u.email,
    }));
}

export async function getSymbolsForUser(email: string): Promise<string[]> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db!;

    const user = await db.collection('user').findOne({ email });
    if (!user) return [];

    const items = await Watchlist.find(
        { userId: user._id.toString() },
        { symbol: 1, _id: 0 }
    ).lean();

    return items.map((item) => item.symbol);
}

export async function fetchNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
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
                        `${BASE_URL}/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${FINNHUB_API_KEY}`
                    );
                    if (!res.ok) return [];
                    return res.json() as Promise<MarketNewsArticle[]>;
                })
            );

            const articles = results.flat();
            if (articles.length > 0) return articles.slice(0, 6);
        }

        const res = await fetch(
            `${BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) return [];
        const articles: MarketNewsArticle[] = await res.json();
        return articles.slice(0, 6);
    } catch (error) {
        console.error('fetchNews error:', error);
        return [];
    }
}
