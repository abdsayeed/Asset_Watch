'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import SearchCommand from '@/components/SearchCommand';
import AddAlertModal from '@/components/watchlist/AddAlertModal';

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
    const [alertTarget, setAlertTarget] = useState<{ symbol: string; company: string } | null>(null);
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
        <>
            <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden h-full">
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
                                    <th className="text-left px-4 py-3 font-medium w-8"></th>
                                    <th className="text-left px-2 py-3 font-medium">Company</th>
                                    <th className="text-left px-4 py-3 font-medium">Symbol</th>
                                    <th className="text-right px-4 py-3 font-medium">Price</th>
                                    <th className="text-right px-4 py-3 font-medium">Change</th>
                                    <th className="text-right px-4 py-3 font-medium">Market Cap</th>
                                    <th className="text-right px-4 py-3 font-medium">P/E Ratio</th>
                                    <th className="text-center px-4 py-3 font-medium">Alert</th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlist.map((item) => (
                                    <WatchlistRow
                                        key={item.symbol}
                                        item={item}
                                        onRemove={handleRemove}
                                        onAddAlert={() => setAlertTarget({ symbol: item.symbol, company: item.company })}
                                    />
                                ))}
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

function WatchlistRow({
    item,
    onRemove,
    onAddAlert,
}: {
    item: { symbol: string; company: string };
    onRemove: (s: string) => void;
    onAddAlert: () => void;
}) {
    return (
        <tr className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors group">
            {/* Star */}
            <td className="px-4 py-3">
                <button
                    onClick={() => onRemove(item.symbol)}
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
            {/* Price — live via TradingView mini widget placeholder */}
            <td className="px-4 py-3 text-right text-gray-200 font-medium">—</td>
            {/* Change */}
            <td className="px-4 py-3 text-right text-gray-500">—</td>
            {/* Market Cap */}
            <td className="px-4 py-3 text-right text-gray-400">—</td>
            {/* P/E */}
            <td className="px-4 py-3 text-right text-gray-400">—</td>
            {/* Alert button */}
            <td className="px-4 py-3 text-center">
                <button
                    onClick={onAddAlert}
                    className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium rounded transition-colors border border-orange-500/30"
                >
                    Add Alert
                </button>
            </td>
        </tr>
    );
}
