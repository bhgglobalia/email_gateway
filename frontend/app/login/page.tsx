"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const { token, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/dashboard/dashboard");
    }
  }, [hydrated, token, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard/dashboard");
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };
  if (!hydrated) return <LoadingSpinner />;
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl w-96 border border-blue-100"
      >
        <h2 className="text-3xl font-extrabold text-center mb-8 text-blue-700">
          Email Gateway Admin
        </h2>
        <label htmlFor="login-email" className="sr-only">Email Address</label>
        <input
          id="login-email"
          className="w-full p-3 mb-4 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
          placeholder="Email Address"
          type="text"
          aria-label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="login-password" className="sr-only">Password</label>
        <input
          id="login-password"
          className="w-full p-3 mb-5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
          placeholder="Password"
          type="password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && (
          <div className="text-red-500 text-sm text-center mt-3">{error}</div>
        )}
        <p className="text-center text-xs mt-6 text-gray-500">
          © 2025 <span className="text-blue-700 font-semibold">GlobaliaSoft Pvt. Ltd.</span>
        </p>
      </form>
    </div>
  );

}
