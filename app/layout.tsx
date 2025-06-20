// // app/layout.tsx
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata = {
  title: "dailydrive",
  description: "Your daily drive for habits and growth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: "dark" }}>
      <body className="flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex-1 flex flex-col">
            {/* Content wrapper grows to fill space with reduced gap */}
            <div className="flex-1 w-full flex flex-col gap-10 lg:gap-20">
              {children}
            </div>
          </main>
          <footer className="w-full border-t border-gray-300 dark:border-white/10 flex items-center justify-center h-16">
            <p>A Personal Project</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}