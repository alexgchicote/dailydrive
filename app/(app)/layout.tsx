// app/(app)/layout.tsx
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import "../globals.css";

export const metadata = {
  title: "dailydrive - App",
  description: "Your daily drive for habits and growth",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="w-full flex justify-center border-b border-white/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"}>dailydrive App</Link>
          </div>
          {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
        </div>
      </nav>
      <div className="flex flex-col gap-20 max-w-5xl p-5">
        {children}
      </div>
    </div>
  );
}

