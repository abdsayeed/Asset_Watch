import { getWatchlist } from '@/lib/actions/watchlist.actions';
import { getAlerts } from '@/lib/actions/alert.actions';
import WatchlistTable from '@/components/watchlist/WatchlistTable';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import { searchStocks } from '@/lib/actions/finnhub.actions';

export default async function WatchlistPage() {
    const [watchlist, alerts, initialStocks] = await Promise.all([
        getWatchlist(),
        getAlerts(),
        searchStocks(),
    ]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left: Watchlist table — takes most of the width */}
            <div className="flex-1 min-w-0">
                <WatchlistTable watchlist={watchlist} initialStocks={initialStocks} />
            </div>
            {/* Right: Alerts panel — fixed width like the screenshot */}
            <div className="w-full lg:w-[340px] shrink-0">
                <AlertsPanel alerts={alerts} watchlist={watchlist} />
            </div>
        </div>
    );
}
