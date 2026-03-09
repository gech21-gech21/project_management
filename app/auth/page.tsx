"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function AuthContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Handle verification success/failure messages
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verificationError = searchParams.get('error');
    const verifiedEmail = searchParams.get('email');

    if (verified === 'true') {
      setSuccess(`Email verified successfully! You can now log in${verifiedEmail ? ` with ${verifiedEmail}` : ''}.`);
      setIsLogin(true);
      if (verifiedEmail) {
        setEmail(verifiedEmail);
      }
    } else if (verified === 'false' && verificationError) {
      setError(decodeURIComponent(verificationError));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error === "CredentialsSignin") {
            setError("Login failed. Please check your email and password. If you just registered, please verify your email first.");
          } else {
            setError("Login failed: " + result.error);
          }
        } else {
          await update();
          router.push("/");
        }
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name,
            username,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.data?.exists) {
            if (data.data.field === "username") {
              setError("Username already taken. Please choose another.");
            } else if (data.data.verified) {
              setError("User with this email already exists. Please login.");
            } else {
              setSuccess("Verification email resent. Please check your inbox.");
            }
          } else {
            setSuccess("Registration successful! Please check your email to verify your account.");
            if (data.data?.verificationToken) {
              setSuccess(data.data.message + ` (Dev: Click here to verify: /api/auth/verify-email?token=${data.data.verificationToken})`);
            }
            setPassword("");
            setName("");
            setUsername("");
          }
        } else {
          setError(data.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setError("Google login failed");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset link has been sent to your email. Please check your inbox and follow the instructions.");
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        setError(data.error || "Failed to send password reset email.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  const suggestUsernameFromEmail = (email: string) => {
    if (email && email.includes('@') && !username) {
      const suggested = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(suggested);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Auth Form Container */}
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-10 w-full max-w-md shadow-lg">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-7 text-gray-800 text-center">
            {isLogin ? "Sign In" : "Sign Up"}
          </h1>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-5 py-3 rounded-lg mb-4 text-sm break-words">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Username Field */}
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                    disabled={loading}
                    pattern="[a-z0-9_]{1,20}"
                    title="Username must be 3-20 characters and can only contain lowercase letters, numbers, and underscores"
                  />
               
                </div>
              </>
            )}
            
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!isLogin && !username) {
                    suggestUsernameFromEmail(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 text-base font-semibold bg-blue-500 text-white border-none rounded-md cursor-pointer transition-colors hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed mt-4 mb-3"
              disabled={loading}
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
            </button>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="text-center mt-3">
                <button
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordEmail(email);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-gray-500 text-sm font-medium hover:text-gray-700 transition disabled:opacity-60"
                  disabled={loading}
                  type="button"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

          {/* Toggle Form */}
          <div className="mt-4 text-base text-gray-500 text-center">
            {isLogin ? "New to Project Management? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
                setEmail("");
                setPassword("");
                setName("");
                setUsername("");
              }}
              className="text-blue-500 font-medium hover:text-blue-600 transition disabled:opacity-60"
              disabled={loading}
              type="button"
            >
              {isLogin ? "Sign up now" : "Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="px-4 text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Google Login */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 text-sm bg-blue-500 text-white border-none rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-blue-600 disabled:opacity-60"
            disabled={loading}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-5">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center">
                  Reset Password
                </h3>
                <p className="text-base text-gray-500 mb-6 text-center">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg outline-none transition-colors focus:border-blue-500"
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail("");
                        setError("");
                      }}
                      className="px-5 py-3 text-sm font-semibold bg-gray-100 text-gray-700 border-none rounded-lg cursor-pointer transition-colors hover:bg-gray-200 disabled:opacity-60"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-3 text-sm font-semibold bg-blue-500 text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-blue-600 disabled:opacity-60"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 text-xs hover:text-gray-600 transition"
              type="button"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-700 text-lg">
        Loading...
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}