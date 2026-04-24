'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, RefreshCw } from 'lucide-react';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import SearchCommand from '@/components/SearchCommand';
import AddAlertModal from '@/components/watchlist/AddAlertModal';
import type { StockQuote } from '@/lib/actions/quotes.actions';

type WatchlistItem = { userId: string; symbol: string; company: string; addedAt: Date };
type LiveQuote = { symbol: string; price: number | null; change: number | null; changePercent: number | null };

interface Props {
    watchlist: WatchlistItem[];
    quotes: StockQuote[];
    initialStocks: StockWithWatchlistStatus[];
}

function fmt(v: number | null) {
    if (v === null) return '—';
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatMarketCap(v: number | null) {
    if (v === null) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}T`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}B`;
    return `$${v.toFixed(0)}M`;
}

const POLL_INTERVAL = 15_000;

export default function WatchlistTable({ watchlist: initial, quotes: initialQuotes, initialStocks }: Props) {
    const [watchlist, setWatchlist] = useState(initial);
    const [alertTarget, setAlertTarget] = useState<{ symbol: string; company: string } | null>(null);
    const [liveQuotes, setLiveQuotes] = useState<Map<string, LiveQuote>>(
        new Map(initialQuotes.map(q => [q.symbol, q]))
    );
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [, startTransition] = useTransition();

    const staticMap = new Map(initialQuotes.map(q => [q.symbol, q]));

    const fetchLiveQuotes = useCallback(async (symbols: string[]) => {
        if (!symbols.length) return;
        try {
            setRefreshing(true);
            const res = await fetch(`/api/quotes?symbols=${symbols.join(',')}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data: LiveQuote[] = await res.json();
            setLiveQuotes(new Map(data.map(q => [q.symbol, q])));
            setLastUpdated(new Date());
        } catch { /* keep last data */ } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const symbols = watchlist.map(w => w.symbol);
        if (!symbols.length) return;
        fetchLiveQuotes(symbols);
        const id = setInterval(() => fetchLiveQuotes(symbols), POLL_INTERVAL);
        return () => clearInterval(id);
    }, [watchlist, fetchLiveQuotes]);

    const handleRemove = (symbol: string) => {
        startTransition(async () => {
            const result = await removeFromWatchlist(symbol);
            if (result.success) { setWatchlist(p => p.filter(w => w.symbol !== symbol)); toast.success(result.message); }
            else toast.error(result.message);
        });
    };

    return (
        <>
            <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-600">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <h2 className="text-lg md:text-xl font-bold text-gray-100 shrink-0">Watchlist</h2>
                        {watchlist.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-yellow-400' : ''}`} />
                                <span>{refreshing ? 'Updating...' : `${lastUpdated.toLocaleTimeString()}`}</span>
                            </div>
                        )}
                    </div>
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={initialStocks} />
                </div>

                {watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        <Star className="h-10 w-10 text-gray-600 mb-3" />
                        <p className="text-gray-400 font-medium mb-1">Your watchlist is empty</p>
                        <p className="text-gray-500 text-sm mb-4">Search for stocks and click ★ to add them</p>
                        <SearchCommand renderAs="button" label="Search Stocks" initialStocks={initialStocks} />
                    </div>
                ) : (
                    <>
                        {/* ── Mobile: card rows ── */}
                        <div className="md:hidden divide-y divide-gray-700">
                            {watchlist.map(item => {
                                const live = liveQuotes.get(item.symbol);
                                const isPos = (live?.changePercent ?? 0) >= 0;
                                return (
                                    <div key={item.symbol} className="flex items-center justify-between gap-2 px-4 py-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <button onClick={() => handleRemove(item.symbol)} className="text-yellow-400 shrink-0">
                                                <Star className="h-4 w-4 fill-yellow-400" />
                                            </button>
                                            <div className="min-w-0">
                                                <Link href={`/stocks/${item.symbol}`} className="text-gray-200 hover:text-yellow-400 font-medium text-sm truncate block">
                                                    {item.company}
                                                </Link>
                                                <span className="text-gray-500 text-xs font-mono">{item.symbol}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <div className="text-gray-100 font-medium text-sm tabular-nums">
                                                    {live?.price != null ? `$${fmt(live.price)}` : '—'}
                                                </div>
                                                <div className={`text-xs tabular-nums ${live?.changePercent != null ? (isPos ? 'text-teal-400' : 'text-red-500') : 'text-gray-500'}`}>
                                                    {live?.changePercent != null ? `${isPos ? '+' : ''}${live.changePercent.toFixed(2)}%` : '—'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setAlertTarget({ symbol: item.symbol, company: item.company })}
                                                className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded border border-orange-500/30 shrink-0"
                                            >
                                                Alert
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Desktop: full table ── */}
                        <div className="hidden md:block overflow-x-auto">
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
                                    {watchlist.map(item => {
                                        const live = liveQuotes.get(item.symbol);
                                        const stat = staticMap.get(item.symbol);
                                        const isPos = (live?.changePercent ?? 0) >= 0;
                                        return (
                                            <tr key={item.symbol} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleRemove(item.symbol)} className="text-yellow-400 hover:text-gray-500 transition-colors">
                                                        <Star className="h-4 w-4 fill-yellow-400" />
                                                    </button>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Link href={`/stocks/${item.symbol}`} className="text-gray-200 hover:text-yellow-400 font-medium">
                                                        {item.company}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 font-mono">{item.symbol}</td>
                                                <td className="px-4 py-3 text-right text-gray-100 font-medium tabular-nums">
                                                    {live?.price != null ? `$${fmt(live.price)}` : '—'}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium tabular-nums ${live?.changePercent != null ? (isPos ? 'text-teal-400' : 'text-red-500') : 'text-gray-500'}`}>
                                                    {live?.changePercent != null ? `${isPos ? '+' : ''}${live.changePercent.toFixed(2)}%` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-400">{formatMarketCap(stat?.marketCap ?? null)}</td>
                                                <td className="px-4 py-3 text-right text-gray-400">{stat?.peRatio != null ? stat.peRatio.toFixed(1) : '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setAlertTarget({ symbol: item.symbol, company: item.company })}
                                                        className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium rounded border border-orange-500/30"
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
                    </>
                )}
            </div>

            {alertTarget && (
                <AddAlertModal symbol={alertTarget.symbol} company={alertTarget.company} onClose={() => setAlertTarget(null)} />
            )}
        </>
    );
}
