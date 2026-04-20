import { getWatchlist } from '@/lib/actions/watchlist.actions';
import { getAlerts } from '@/lib/actions/alert.actions';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getStockQuotes } from '@/lib/actions/quotes.actions';
import WatchlistTable from '@/components/watchlist/WatchlistTable';
import AlertsPanel from '@/components/watchlist/AlertsPanel';

export default async function WatchlistPage() {
    const [watchlist, alerts, initialStocks] = await Promise.all([
        getWatchlist(),
        getAlerts(),
        searchStocks(),
    ]);

    // Fetch live quotes for all watchlist symbols
    const quotes = watchlist.length > 0
        ? await getStockQuotes(watchlist.map(w => w.symbol))
        : [];

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
                <WatchlistTable watchlist={watchlist} quotes={quotes} initialStocks={initialStocks} />
            </div>
            <div className="w-full lg:w-[340px] shrink-0">
                <AlertsPanel alerts={alerts} watchlist={watchlist} />
            </div>
        </div>
    );
}
