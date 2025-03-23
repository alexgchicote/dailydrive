// app/(app)/layout.tsx
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import "../globals.css";

export const metadata = {
  title: "dailydrive - App",
  description: "Your daily drive for habits and growth",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* {Nav bar} */}
      <nav className="w-full flex justify-center border-b border-gray-300 dark:border-white/10 h-16">
        <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"}>dailydrive</Link>
          </div>
          <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
        </div>
        </div>
      </nav>
      {/* Added mx-auto to center this container and increased the available width */}
      <div className="flex flex-col gap-20 max-w-6xl p-5 mx-auto">
        {children}
      </div>
    </div>
  );
}