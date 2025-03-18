// // app/layout.tsx
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata = {
  title: "dailydrive",
  description: "Your daily drive for habits and growth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex-1 flex flex-col">
            {/* Content wrapper grows to fill space */}
            <div className="flex-1 w-full flex flex-col gap-20">
              {children}
            </div>
          </main>
          <footer className="w-full border-t border-gray-300 dark:border-white/10 flex items-center justify-center h-16">
            <p>Powered by AGC</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}