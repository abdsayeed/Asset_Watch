import Link from "next/link";
import Image from "next/image";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user) redirect('/');

    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo">
                    <Image src="/assets/icons/logo.png" alt="AssetWatch logo" width={300} height={80} className='h-16 w-auto brightness-0 invert' />
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            <section className="auth-right-section flex items-center justify-center">
                <Image
                    src="/assets/icons/logo.png"
                    alt="AssetWatch"
                    width={500}
                    height={200}
                    className="w-[70%] max-w-[480px] h-auto object-contain"
                />
            </section>
        </main>
    )
}
export default Layout