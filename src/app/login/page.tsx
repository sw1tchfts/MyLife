"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  input,
  btnPrimary,
  btnSecondary,
  label as labelStyle,
} from "@/lib/styles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-heading">
          {isForgot
            ? "Reset Password"
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </h1>

        {isForgot ? (
          /* -- Forgot password form -- */
          <>
            <p className="mb-4 text-center text-sm text-muted">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelStyle}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={input}
                />
              </div>

              {error && <p className="text-sm text-danger-text">{error}</p>}
              {message && (
                <p className="text-sm text-success-text">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${btnPrimary}`}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-muted">
              <button
                onClick={() => {
                  setIsForgot(false);
                  setError("");
                  setMessage("");
                }}
                className="font-medium text-accent-text hover:text-accent-hover"
              >
                Back to Sign In
              </button>
            </p>
          </>
        ) : (
          /* -- Normal sign-in / sign-up form -- */
          <>
            <button
              onClick={handleGoogleSignIn}
              className={`flex w-full items-center justify-center gap-2 ${btnSecondary}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface px-2 text-muted">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelStyle}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={input}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelStyle}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={input}
                />
              </div>

              {error && <p className="text-sm text-danger-text">{error}</p>}
              {message && (
                <p className="text-sm text-success-text">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${btnPrimary}`}
              >
                {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            {!isSignUp && (
              <p className="mt-3 text-center">
                <button
                  onClick={() => {
                    setIsForgot(true);
                    setError("");
                    setMessage("");
                  }}
                  className="text-sm text-muted hover:text-body"
                >
                  Forgot password?
                </button>
              </p>
            )}

            <p className="mt-4 text-center text-sm text-muted">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setMessage("");
                }}
                className="font-medium text-accent-text hover:text-accent-hover"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
