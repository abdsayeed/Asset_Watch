import { getAuth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await getAuth();
    return toNextJsHandler(auth).GET(request);
}

export async function POST(request: Request) {
    const auth = await getAuth();
    return toNextJsHandler(auth).POST(request);
}
