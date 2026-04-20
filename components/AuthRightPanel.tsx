"use client";

import Image from "next/image";

const STOCKS = [
    { symbol: "AAPL",  name: "Apple",    change: "+1.54%", positive: true,  color: "#6b7280" },
    { symbol: "MSFT",  name: "Microsoft",change: "-0.24%", positive: false, color: "#3b82f6" },
    { symbol: "GOOGL", name: "Alphabet", change: "+2.65%", positive: true,  color: "#10b981" },
    { symbol: "AMZN",  name: "Amazon",   change: "-1.53%", positive: false, color: "#f59e0b" },
    { symbol: "TSLA",  name: "Tesla",    change: "+1.72%", positive: true,  color: "#ef4444" },
    { symbol: "NVDA",  name: "NVIDIA",   change: "+2.21%", positive: true,  color: "#8b5cf6" },
    { symbol: "META",  name: "Meta",     change: "-2.54%", positive: false, color: "#3b82f6" },
    { symbol: "NFLX",  name: "Netflix",  change: "-2.62%", positive: false, color: "#ef4444" },
];

// Duplicate for seamless infinite scroll
const TICKER_ITEMS = [...STOCKS, ...STOCKS];

export default function AuthRightPanel() {
    return (
        <div className="w-full flex flex-col items-center gap-6 px-4">

            {/* Floating image with transparent edges */}
            <div className="relative w-full max-w-[520px]"
                style={{
                    animation: "float 6s ease-in-out infinite",
                }}
            >
                {/* Gradient mask — fades left, right, and bottom edges */}
                <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                    style={{
                        background: `
                            linear-gradient(to right,  #141414 0%, transparent 18%, transparent 82%, #141414 100%),
                            linear-gradient(to bottom, transparent 0%, transparent 70%, #141414 100%)
                        `,
                    }}
                />
                <Image
                    src="/assets/images/Gemini_Generated_Image_8fx0ju8fx0ju8fx0.jpg"
                    alt="AssetWatch Dashboard"
                    width={2526}
                    height={949}
                    className="w-full h-auto rounded-xl object-cover"
                    priority
                />
            </div>

            {/* Animated scrolling stock ticker */}
            <div className="w-full overflow-hidden relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #141414, transparent)" }} />
                <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to left, #141414, transparent)" }} />

                <div
                    className="flex gap-3"
                    style={{ animation: "ticker 30s linear infinite" }}
                >
                    {TICKER_ITEMS.map((stock, i) => (
                        <div
                            key={`${stock.symbol}-${i}`}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800/80 backdrop-blur-sm shrink-0"
                            style={{
                                animation: `floatCard ${3 + (i % 4) * 0.5}s ease-in-out infinite`,
                                animationDelay: `${(i % 8) * 0.3}s`,
                            }}
                        >
                            {/* Stock icon circle */}
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: stock.color + '33', border: `1px solid ${stock.color}55` }}
                            >
                                <span style={{ color: stock.color }}>{stock.symbol.slice(0, 2)}</span>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-gray-200 text-xs font-semibold">{stock.symbol}</span>
                                <span className={`text-xs font-medium ${stock.positive ? 'text-teal-400' : 'text-red-400'}`}>
                                    {stock.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-12px); }
                }
                @keyframes floatCard {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-5px); }
                }
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
