'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut, LayoutDashboard, Star} from "lucide-react";
import Link from "next/link";
import {signOut} from "@/lib/actions/auth.actions";
import { getAvatarUrl } from "@/lib/gravatar";

const UserDropdown = ({ user, initialStocks }: {user: User, initialStocks: StockWithWatchlistStatus[]}) => {
    const router = useRouter();
    const avatarUrl = getAvatarUrl(user.name, user.email, 80);

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:text-yellow-500">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="text-gray-400 bg-gray-800 border-gray-600 min-w-[240px] mt-2">
                {/* User info */}
                <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-100'>{user.name}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-gray-600"/>

                {/* Navigation links */}
                <DropdownMenuItem asChild className="text-gray-300 hover:text-yellow-500 focus:bg-gray-700 focus:text-yellow-500 cursor-pointer">
                    <Link href="/" className="flex items-center gap-2 px-2 py-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="text-gray-300 hover:text-yellow-500 focus:bg-gray-700 focus:text-yellow-500 cursor-pointer">
                    <Link href="/watchlist" className="flex items-center gap-2 px-2 py-2">
                        <Star className="h-4 w-4" />
                        Watchlist
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-600"/>

                {/* Logout */}
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-red-400 focus:bg-gray-700 focus:text-red-400 cursor-pointer"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown