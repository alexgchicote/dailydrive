/**
 * LandingPage Component
 * 
 * Renders a sign-up form and checks for an active user session.
 * If a session exists, the user is redirected to the dashboard.
 * Listens for auth state changes to handle email confirmation.
 * This is a client-side component.
 */

"use client"; // Marking this component as a client component

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  // State variables for the sign-up form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  // Check if a session exists on mount
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // If session exists, redirect to the dashboard.
        router.push("/dashboard");
      } 
      else {
        setLoading(false);
      }
    })();
  }, [router, supabase]);

  // Set up an auth state change listener to detect when the session is set (i.e., after email confirmation)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/dashboard");
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Handler for sign-up form submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sign up logic – you might want to add additional validation
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      alert(error.message);
    } else {
      // Set a flag to indicate the user should confirm their email.
      setAwaitingConfirmation(true);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    // Container with responsive layout: flex-col on mobile and flex-row on medium and larger screens.
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Sign-up Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-10 bg-gradient-to-b from-[#000000] to-[#000033]">
        {/* Responsive margins: small on mobile (ml-4 mr-4), larger on desktop (md:ml-32 md:mr-32) */}
        <div className="ml-4 mr-4 md:ml-32 md:mr-32">
          {/* Branding */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">dailydrive</h1>
          </div>
          {/* Sign-up Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-white">Create an account</h2>
            <p className="mb-4 text-sm text-white">Sign up and get 30 day free trial</p>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 border rounded w-full"
                  required
                />
                {/* Optionally add a password visibility toggle */}
              </div>
              <button type="submit" className="bg-purple-600 text-white py-2 rounded font-bold">
                Submit
              </button>
            </form>
            {/* Show a message if waiting for email confirmation */}
            {awaitingConfirmation && (
              <div className="mt-4 p-4 bg-yellow-200 text-black rounded">
                Please check your email to confirm your account. Once confirmed, you'll be redirected to the dashboard.
              </div>
            )}
            {/* Alternative Sign-in Options */}
            <div className="mt-4 flex gap-4">
              <button className="flex-1 bg-gray-200 p-2 rounded">Sign in with Apple</button>
              <button className="flex-1 bg-gray-200 p-2 rounded">Sign in with Google</button>
            </div>
            {/* Footer Links */}
            <div className="mt-4 text-sm">
              <p className="text-white">
                Have an account?{" "}
                <a href="/sign-in" className="text-white underline">
                  Sign in
                </a>
              </p>
              <p>
                <a href="/terms" className="text-blue-400 underline">
                  Terms & Conditions
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - App Showcase */}
      <div className="w-full md:w-1/2 relative bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white">Experience dailydrive</h3>
          <p className="mt-2 text-white">Track your habits, improve your life.</p>
        </div>
      </div>
    </div>
  );
}