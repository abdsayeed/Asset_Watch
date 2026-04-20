'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

// Get all watchlist symbols for a user by email (used by inngest — no request context)
export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
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

// Get full watchlist for the current logged-in user
export async function getWatchlist(): Promise<WatchlistItem[]> {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    const items = await Watchlist.find({ userId: session.user.id }).sort({ addedAt: -1 }).lean();
    return items.map((item) => ({
        userId: item.userId,
        symbol: item.symbol,
        company: item.company,
        addedAt: item.addedAt,
    }));
}

// Add a stock to the current user's watchlist
export async function addToWatchlist(symbol: string, company: string): Promise<{ success: boolean; message: string }> {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, message: 'Not authenticated' };

    try {
        await Watchlist.create({
            userId: session.user.id,
            symbol: symbol.toUpperCase(),
            company,
        });
        return { success: true, message: `${symbol} added to watchlist` };
    } catch (err: unknown) {
        // Duplicate key — already in watchlist
        if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
            return { success: false, message: `${symbol} is already in your watchlist` };
        }
        console.error('addToWatchlist error:', err);
        return { success: false, message: 'Failed to add to watchlist' };
    }
}

// Remove a stock from the current user's watchlist
export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, message: 'Not authenticated' };

    const result = await Watchlist.deleteOne({ userId: session.user.id, symbol: symbol.toUpperCase() });
    if (result.deletedCount === 0) {
        return { success: false, message: `${symbol} not found in watchlist` };
    }
    return { success: true, message: `${symbol} removed from watchlist` };
}

// Check if a specific symbol is in the current user's watchlist
export async function isInWatchlist(symbol: string): Promise<boolean> {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const item = await Watchlist.findOne({ userId: session.user.id, symbol: symbol.toUpperCase() });
    return !!item;
}

type WatchlistItem = {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
};
