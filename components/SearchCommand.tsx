"use client"

import { useEffect, useState, useTransition } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Star } from "lucide-react"
import Link from "next/link"
import { searchStocks } from "@/lib/actions/finnhub.actions"
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks)
    const [pending, startTransition] = useTransition()
    const [togglingSymbol, setTogglingSymbol] = useState<string | null>(null)

    const isSearchMode = !!searchTerm.trim()
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10)

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    const handleSearch = async () => {
        if (!isSearchMode) return setStocks(initialStocks)
        setLoading(true)
        try {
            const results = await searchStocks(searchTerm.trim())
            setStocks(results)
        } catch {
            setStocks([])
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearch = useDebounce(handleSearch, 300)
    useEffect(() => { debouncedSearch() }, [searchTerm])

    const handleSelectStock = () => {
        setOpen(false)
        setSearchTerm("")
        setStocks(initialStocks)
    }

    const handleToggleWatchlist = (e: React.MouseEvent, stock: StockWithWatchlistStatus) => {
        e.preventDefault()
        e.stopPropagation()
        setTogglingSymbol(stock.symbol)

        startTransition(async () => {
            if (stock.isInWatchlist) {
                const result = await removeFromWatchlist(stock.symbol)
                if (result.success) {
                    setStocks(prev => prev.map(s =>
                        s.symbol === stock.symbol ? { ...s, isInWatchlist: false } : s
                    ))
                    toast.success(result.message)
                } else {
                    toast.error(result.message)
                }
            } else {
                const result = await addToWatchlist(stock.symbol, stock.name)
                if (result.success) {
                    setStocks(prev => prev.map(s =>
                        s.symbol === stock.symbol ? { ...s, isInWatchlist: true } : s
                    ))
                    toast.success(result.message)
                } else {
                    toast.error(result.message)
                }
            }
            setTogglingSymbol(null)
        })
    }

    return (
        <>
            {renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">{label}</span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">{label}</Button>
            )}

            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Search by symbol or company name"
                        className="search-input"
                    />
                    {loading && <Loader2 className="search-loader" />}
                </div>

                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count">
                                {isSearchMode ? 'Search results' : 'Popular Stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock) => (
                                <li key={stock.symbol} className="search-item">
                                    <div className="search-item-link">
                                        <TrendingUp className="h-4 w-4 text-gray-500 shrink-0" />
                                        <Link
                                            href={`/stocks/${stock.symbol}`}
                                            onClick={handleSelectStock}
                                            className="flex-1 min-w-0"
                                        >
                                            <div className="search-item-name">{stock.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {stock.symbol} · {stock.exchange} · {stock.type}
                                            </div>
                                        </Link>
                                        {/* Star watchlist toggle */}
                                        <button
                                            onClick={(e) => handleToggleWatchlist(e, stock)}
                                            disabled={togglingSymbol === stock.symbol}
                                            className="shrink-0 p-1 rounded hover:bg-gray-700 transition-colors"
                                            title={stock.isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                                        >
                                            <Star
                                                className="h-4 w-4 transition-colors"
                                                fill={stock.isInWatchlist ? '#FDD458' : 'none'}
                                                stroke={stock.isInWatchlist ? '#FDD458' : '#9095A1'}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
