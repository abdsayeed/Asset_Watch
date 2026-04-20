'use client';

import { useState, useTransition } from 'react';
import { Bell, Trash2, Plus, X } from 'lucide-react';
import { createAlert, deleteAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

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

export default function AlertsPanel({ alerts: initial, watchlist }: Props) {
    const [alerts, setAlerts] = useState(initial);
    const [showForm, setShowForm] = useState(false);
    const [, startTransition] = useTransition();

    const [form, setForm] = useState({
        symbol: watchlist[0]?.symbol || '',
        alertName: '',
        alertType: 'upper' as 'upper' | 'lower',
        threshold: '',
    });

    const handleCreate = () => {
        if (!form.symbol || !form.alertName || !form.threshold) {
            toast.error('Please fill in all fields');
            return;
        }
        startTransition(async () => {
            const company = watchlist.find(w => w.symbol === form.symbol)?.company || form.symbol;
            const result = await createAlert({
                symbol: form.symbol,
                company,
                alertName: form.alertName,
                alertType: form.alertType,
                threshold: parseFloat(form.threshold),
            });
            if (result.success) {
                toast.success(result.message);
                setShowForm(false);
                setForm({ symbol: watchlist[0]?.symbol || '', alertName: '', alertType: 'upper', threshold: '' });
                // Optimistic update — reload will sync
                window.location.reload();
            } else {
                toast.error(result.message);
            }
        });
    };

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
        <div className="bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-600">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-gray-100">Alerts</h2>
                    <span className="text-sm text-gray-500">({alerts.length})</span>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Create Alert
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="px-5 py-4 border-b border-gray-600 bg-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">New Alert</span>
                        <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <select
                            value={form.symbol}
                            onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                        >
                            {watchlist.length === 0 && <option value="">Add stocks to watchlist first</option>}
                            {watchlist.map(w => (
                                <option key={w.symbol} value={w.symbol}>{w.symbol} — {w.company}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Alert name (e.g. AAPL breakout)"
                            value={form.alertName}
                            onChange={e => setForm(f => ({ ...f, alertName: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500 placeholder:text-gray-500"
                        />
                        <div className="flex gap-2">
                            <select
                                value={form.alertType}
                                onChange={e => setForm(f => ({ ...f, alertType: e.target.value as 'upper' | 'lower' }))}
                                className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                            >
                                <option value="upper">Price above</option>
                                <option value="lower">Price below</option>
                            </select>
                            <input
                                type="number"
                                placeholder="$0.00"
                                value={form.threshold}
                                onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                                className="flex-1 bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500 placeholder:text-gray-500"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={watchlist.length === 0}
                            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                        >
                            Create Alert
                        </button>
                    </div>
                </div>
            )}

            {/* Alerts list */}
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                        <Bell className="h-10 w-10 text-gray-600 mb-3" />
                        <p className="text-gray-400 font-medium mb-1">No alerts yet</p>
                        <p className="text-gray-500 text-sm">Create an alert to get notified when a stock hits your target price</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className="px-5 py-4 hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0">
                                        {alert.symbol.slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-100 font-medium text-sm">{alert.symbol}</span>
                                            {alert.triggered && (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Triggered</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{alert.alertName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(alert.id)}
                                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="mt-2 ml-11">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                    alert.alertType === 'upper'
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-red-500/15 text-red-400'
                                }`}>
                                    Price {alert.alertType === 'upper' ? '>' : '<'} ${alert.threshold.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
