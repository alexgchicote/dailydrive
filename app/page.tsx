"use client"; // Marking this component as a client component

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For the App Router
import { createClient } from "@/utils/supabase/client"; // Import your browser client creator

const LoginPage = () => {
  const router = useRouter();
  // Create a Supabase client instance for this component.
  const supabase = createClient();

  // State variables for the email, password, and loading state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // On mount, check if a session exists.
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // If a session exists, redirect to the dashboard.
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    })();
  }, [router, supabase]);

  // Handler for login form submission.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "300px" }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "0.5rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
