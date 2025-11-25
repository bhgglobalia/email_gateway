"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { FiSend } from "react-icons/fi";
import { useUnreadLogsStore } from "@/store/unreadLogs";

const navLinks = [
  { name: "Dashboard", href: "/dashboard/dashboard" },
  { name: "Clients", href: "/dashboard/clients" },
  { name: "Mailboxes", href: "/dashboard/mailboxes" },
  { name: "Logs", href: "/dashboard/logs" },
  { name: "Compose", href: "/dashboard/compose", icon: FiSend },
  { name: "Settings", href: "/dashboard/settings" },
];
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const unread = useUnreadLogsStore((s) => s.unreadCount);

  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full p-4 sm:p-5 bg-blue-700 text-white shadow-lg w-full sm:w-64 min-w-0">

      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-base sm:text-lg font-bold tracking-wide">Email Gateway</h1>
        <button onClick={onClose} className="sm:hidden text-white hover:bg-blue-800 p-1 rounded-md" aria-label="Close sidebar">
          <X className="w-5 h-5" />
        </button>
      </div>


      <nav className="space-y-2 flex-1">
        {navLinks.map((link) => {
          const isLogs = link.name === "Logs";
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-label={link.name}
              className={`block px-3 py-2 rounded-md font-medium transition relative ${pathname === link.href
                  ? "bg-blue-900 text-white"
                  : "hover:bg-blue-800 text-gray-100"
                }`}
            >
              {link.name}
              {isLogs && unread > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-center text-xs text-gray-300 pt-4 border-t border-blue-600">
        © 2025 GlobaliaSoft
      </div>
    </div>
  );
}
