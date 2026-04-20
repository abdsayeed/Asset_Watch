'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { createAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

interface Props {
    symbol: string;
    company: string;
    onClose: () => void;
}

export default function AddAlertModal({ symbol, company, onClose }: Props) {
    const [alertType, setAlertType] = useState<'upper' | 'lower'>('upper');
    const [threshold, setThreshold] = useState('');
    const [, startTransition] = useTransition();

    const handleCreate = () => {
        if (!threshold) { toast.error('Enter a price threshold'); return; }
        startTransition(async () => {
            const result = await createAlert({
                symbol,
                company,
                alertName: `${symbol} ${alertType === 'upper' ? 'above' : 'below'} $${threshold}`,
                alertType,
                threshold: parseFloat(threshold),
            });
            if (result.success) {
                toast.success(result.message);
                onClose();
                window.location.reload();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-100">Create Alert — {symbol}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">{company}</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Condition</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAlertType('upper')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    alertType === 'upper'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                                }`}
                            >
                                Price above
                            </button>
                            <button
                                onClick={() => setAlertType('lower')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    alertType === 'lower'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                                }`}
                            >
                                Price below
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Target Price ($)</label>
                        <input
                            type="number"
                            placeholder="e.g. 240.00"
                            value={threshold}
                            onChange={e => setThreshold(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500 placeholder:text-gray-500"
                        />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                        >
                            Create Alert
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
