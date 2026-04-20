'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Star, Trash2, Plus } from 'lucide-react';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import SearchCommand from '@/components/SearchCommand';

type WatchlistItem = {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
};

interface Props {
    watchlist: WatchlistItem[];
    initialStocks: StockWithWatchlistStatus[];
}

export default function WatchlistTable({ watchlist: initial, initialStocks }: Props) {
    const [watchlist, setWatchlist] = useState(initial);
    const [, startTransition] = useTransition();

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
        <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-600">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <h2 className="text-xl font-bold text-gray-100">Watchlist</h2>
                    <span className="text-sm text-gray-500 ml-1">({watchlist.length})</span>
                </div>
                <SearchCommand
                    renderAs="button"
                    label="Add Stock"
                    initialStocks={initialStocks}
                />
            </div>

            {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <Star className="h-12 w-12 text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium mb-1">Your watchlist is empty</p>
                    <p className="text-gray-500 text-sm mb-4">Search for stocks and click the ★ to add them</p>
                    <SearchCommand renderAs="button" label="Search Stocks" initialStocks={initialStocks} />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
                                <th className="px-6 py-3">Company</th>
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3 text-right">Added</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((item) => (
                                <tr
                                    key={item.symbol}
                                    className="border-b border-gray-700 hover:bg-gray-700/40 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/stocks/${item.symbol}`}
                                            className="flex items-center gap-3 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0">
                                                {item.symbol.slice(0, 2)}
                                            </div>
                                            <span className="text-gray-200 font-medium group-hover:text-yellow-400 transition-colors">
                                                {item.company}
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-gray-400 font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                                            {item.symbol}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-gray-500">
                                        {new Date(item.addedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleRemove(item.symbol)}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                            title={`Remove ${item.symbol}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
