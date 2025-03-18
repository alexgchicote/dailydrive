// app/(auth-pages)/layout.tsx
export default async function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex justify-center items-center">
      {children}
    </div>
  );
}
// app/(app)/(auth-pages)/layout.tsx
// export default function AuthPagesLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="max-w-md w-full p-4">{children}</div>
//     </div>
//   );
// }
