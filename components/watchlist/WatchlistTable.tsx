'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import SearchCommand from '@/components/SearchCommand';
import AddAlertModal from '@/components/watchlist/AddAlertModal';
import type { StockQuote } from '@/lib/actions/finnhub.actions';

type WatchlistItem = {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
};

interface Props {
    watchlist: WatchlistItem[];
    quotes: StockQuote[];
    initialStocks: StockWithWatchlistStatus[];
}

function formatPrice(v: number | null) {
    if (v === null) return '—';
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMarketCap(v: number | null) {
    if (v === null) return '—';
    // Finnhub returns market cap in millions
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}T`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}B`;
    return `$${v.toFixed(0)}M`;
}

function formatPE(v: number | null) {
    if (v === null) return '—';
    return v.toFixed(1);
}

export default function WatchlistTable({ watchlist: initial, quotes, initialStocks }: Props) {
    const [watchlist, setWatchlist] = useState(initial);
    const [alertTarget, setAlertTarget] = useState<{ symbol: string; company: string } | null>(null);
    const [, startTransition] = useTransition();

    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    const handleRemove = (symbol: string) => {
        startTransition(async () => {
            const result = await removeFromWatchlist(symbol);
            if (result.success) {
                setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <>
            <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-gray-100">Watchlist</h2>
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={initialStocks} />
                </div>

                {watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <Star className="h-12 w-12 text-gray-600 mb-4" />
                        <p className="text-gray-400 font-medium mb-1">Your watchlist is empty</p>
                        <p className="text-gray-500 text-sm mb-5">Search for stocks and click ★ to add them</p>
                        <SearchCommand renderAs="button" label="Search Stocks" initialStocks={initialStocks} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-3 w-8"></th>
                                    <th className="text-left px-2 py-3">Company</th>
                                    <th className="text-left px-4 py-3">Symbol</th>
                                    <th className="text-right px-4 py-3">Price</th>
                                    <th className="text-right px-4 py-3">Change</th>
                                    <th className="text-right px-4 py-3">Market Cap</th>
                                    <th className="text-right px-4 py-3">P/E Ratio</th>
                                    <th className="text-center px-4 py-3">Alert</th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlist.map((item) => {
                                    const q = quoteMap.get(item.symbol);
                                    const isPositive = (q?.changePercent ?? 0) >= 0;
                                    return (
                                        <tr key={item.symbol} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                                            {/* Star */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleRemove(item.symbol)}
                                                    title="Remove from watchlist"
                                                    className="text-yellow-400 hover:text-gray-500 transition-colors"
                                                >
                                                    <Star className="h-4 w-4 fill-yellow-400" />
                                                </button>
                                            </td>
                                            {/* Company */}
                                            <td className="px-2 py-3">
                                                <Link href={`/stocks/${item.symbol}`} className="text-gray-200 hover:text-yellow-400 transition-colors font-medium">
                                                    {item.company}
                                                </Link>
                                            </td>
                                            {/* Symbol */}
                                            <td className="px-4 py-3 text-gray-400 font-mono">{item.symbol}</td>
                                            {/* Price */}
                                            <td className="px-4 py-3 text-right text-gray-100 font-medium">
                                                {formatPrice(q?.price ?? null)}
                                            </td>
                                            {/* Change */}
                                            <td className={`px-4 py-3 text-right font-medium ${q?.changePercent != null ? (isPositive ? 'text-teal-400' : 'text-red-500') : 'text-gray-500'}`}>
                                                {q?.changePercent != null
                                                    ? `${isPositive ? '+' : ''}${q.changePercent.toFixed(2)}%`
                                                    : '—'}
                                            </td>
                                            {/* Market Cap */}
                                            <td className="px-4 py-3 text-right text-gray-400">
                                                {formatMarketCap(q?.marketCap ?? null)}
                                            </td>
                                            {/* P/E */}
                                            <td className="px-4 py-3 text-right text-gray-400">
                                                {formatPE(q?.peRatio ?? null)}
                                            </td>
                                            {/* Alert */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setAlertTarget({ symbol: item.symbol, company: item.company })}
                                                    className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium rounded transition-colors border border-orange-500/30"
                                                >
                                                    Add Alert
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {alertTarget && (
                <AddAlertModal
                    symbol={alertTarget.symbol}
                    company={alertTarget.company}
                    onClose={() => setAlertTarget(null)}
                />
            )}
        </>
    );
}
