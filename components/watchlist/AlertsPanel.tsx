'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { deleteAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import AddAlertModal from '@/components/watchlist/AddAlertModal';

type AlertItem = {
    id: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
    triggered: boolean;
};

type WatchlistItem = {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
};

interface Props {
    alerts: AlertItem[];
    watchlist: WatchlistItem[];
}

// Group alerts by symbol so each stock card shows its alert below
function groupBySymbol(alerts: AlertItem[], watchlist: WatchlistItem[]) {
    const map = new Map<string, { company: string; alerts: AlertItem[] }>();
    // Add all watchlist items first (even without alerts)
    watchlist.forEach(w => map.set(w.symbol, { company: w.company, alerts: [] }));
    // Attach alerts
    alerts.forEach(a => {
        if (!map.has(a.symbol)) map.set(a.symbol, { company: a.company, alerts: [] });
        map.get(a.symbol)!.alerts.push(a);
    });
    return Array.from(map.entries()).filter(([, v]) => v.alerts.length > 0);
}

export default function AlertsPanel({ alerts: initial, watchlist }: Props) {
    const [alerts, setAlerts] = useState(initial);
    const [addTarget, setAddTarget] = useState<{ symbol: string; company: string } | null>(null);
    const [, startTransition] = useTransition();

    const grouped = groupBySymbol(alerts, watchlist);

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteAlert(id);
            if (result.success) {
                setAlerts(prev => prev.filter(a => a.id !== id));
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold text-gray-100">Alerts</h2>
                    <button
                        onClick={() => {
                            const first = watchlist[0];
                            if (first) setAddTarget({ symbol: first.symbol, company: first.company });
                            else toast.error('Add stocks to your watchlist first');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
                    >
                        Create Alert
                    </button>
                </div>

                {/* Alert cards */}
                <div className="overflow-y-auto max-h-[calc(100vh-200px)] divide-y divide-gray-700">
                    {grouped.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-5">
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                                <Plus className="h-6 w-6 text-gray-500" />
                            </div>
                            <p className="text-gray-400 font-medium mb-1">No alerts yet</p>
                            <p className="text-gray-500 text-sm">Click "Add Alert" next to any stock to get notified</p>
                        </div>
                    ) : (
                        grouped.map(([symbol, { company, alerts: stockAlerts }]) => (
                            <AlertCard
                                key={symbol}
                                symbol={symbol}
                                company={company}
                                alerts={stockAlerts}
                                onDelete={handleDelete}
                                onEdit={(s, c) => setAddTarget({ symbol: s, company: c })}
                            />
                        ))
                    )}
                </div>
            </div>

            {addTarget && (
                <AddAlertModal
                    symbol={addTarget.symbol}
                    company={addTarget.company}
                    onClose={() => setAddTarget(null)}
                />
            )}
        </>
    );
}

function AlertCard({
    symbol,
    company,
    alerts,
    onDelete,
    onEdit,
}: {
    symbol: string;
    company: string;
    alerts: AlertItem[];
    onDelete: (id: string) => void;
    onEdit: (symbol: string, company: string) => void;
}) {
    return (
        <div className="px-5 py-4">
            {/* Stock header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Logo placeholder */}
                    <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-sm font-bold text-yellow-400 shrink-0">
                        {symbol.slice(0, 2)}
                    </div>
                    <div>
                        <div className="text-gray-100 font-semibold text-sm leading-tight">{company}</div>
                        <div className="text-gray-500 text-xs">{symbol}</div>
                    </div>
                </div>
                {/* Price placeholder — would need live data */}
                <div className="text-right">
                    <div className="text-gray-200 font-semibold text-sm">—</div>
                    <div className="text-gray-500 text-xs">—</div>
                </div>
            </div>

            {/* Alert rows */}
            {alerts.map((alert) => (
                <div key={alert.id} className="mt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Alert:</span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onEdit(symbol, company)}
                                className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => onDelete(alert.id)}
                                className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-200 font-semibold text-sm">
                            Price {alert.alertType === 'upper' ? '>' : '<'} ${alert.threshold.toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            alert.triggered
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/15 text-yellow-500'
                        }`}>
                            {alert.triggered ? 'Triggered' : 'Active'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
