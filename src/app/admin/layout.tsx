import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { isAdmin } from "@/lib/admin";
import { logout } from "./actions";

export const metadata: Metadata = { title: "7on admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const signedIn = await isAdmin();
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-medium">
            <span className="block h-6 w-6 bg-[#E0233F] [mask:url(/logo.png)_center/contain_no-repeat]" />
            Admin
          </Link>
          {signedIn && (
            <form action={logout}>
              <button className="text-sm text-zinc-500 hover:text-[#111]">Sign out</button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
