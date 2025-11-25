"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 flex flex-wrap sm:flex-nowrap justify-between items-center w-full px-4 sm:px-6 py-3 border-b border-gray-200">

      <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
        Admin Dashboard
      </h1>


      <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">

        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium">
          {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
        </div>


        <span className="text-gray-600 text-sm truncate max-w-[120px] sm:max-w-[200px] text-center sm:text-left">
          {user?.email || "Admin"}
        </span>


        <button
          onClick={logout}
          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 active:scale-95 transition"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
