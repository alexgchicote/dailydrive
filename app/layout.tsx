// app/layout.tsx
import { ThemeProvider } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";

export const metadata = {
  title: "dailydrive",
  description: "Your daily drive for habits and growth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="min-h-screen">
            {/* Removed items-center to allow content to span full width */}
            <div className="flex-1 w-full flex flex-col gap-20">
              {children}
              <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-16">
                <p>Powered by AGC</p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}