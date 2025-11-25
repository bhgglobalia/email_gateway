
"use client";
import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import Navbar from "@/components/common/Navbar";
import { Menu } from "lucide-react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {


  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 antialiased">

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-blue-700 text-white shadow-xl transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:static sm:block`}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 sm:hidden"
          aria-hidden="true"
        />
      )}


      <div className="flex flex-col flex-1 w-full min-w-0">

        <div className="flex items-center justify-between bg-white border-b border-gray-200 shadow-sm p-3 sm:p-4 sticky top-0 z-40">
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-[0.99]"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Navbar />
        </div>

        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto min-w-0 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
