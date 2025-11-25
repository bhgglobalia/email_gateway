"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { useUnreadLogsStore } from "@/store/unreadLogs";
import { usePathname } from "next/navigation";
import { Download, RefreshCw, Mail } from "lucide-react";
import { Client, EmailEvent } from "@/app/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { useSocket } from "@/hooks/useSocket";

const PROVIDERS = ["google", "outlook"];

export default function LogsPage() {

  const resetUnread = useUnreadLogsStore((s) => s.reset);
  useEffect(() => {
    resetUnread();
  }, [resetUnread]);


  const [logs, setLogs] = useState<EmailEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();


  useEffect(() => {
    api
      .get("/clients")
      .then((res) => {
        setClients(Array.isArray(res.data.data) ? res.data.data : []);
      })
      .catch(() => toast.error("Failed to fetch clients", { id: "clients-error" }));
  }, []);


  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedProvider !== "") params.provider = selectedProvider;
      if (selectedClientId !== "") params.clientId = String(selectedClientId);
      if (selectedDate !== "") params.date = selectedDate;

      const query = Object.keys(params)
        .map((k) => `${k}=${encodeURIComponent(params[k])}`)
        .join("&");

      const res = await api.get(`/events${query ? "?" + query : ""}`);
      setLogs(
        Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : []
      );
    } catch {
      toast.error("Failed to fetch logs", { id: "fetch-logs" });
    } finally {
      setLoading(false);
    }
  }, [selectedProvider, selectedClientId, selectedDate]);


  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useSocket(
    useCallback(
      (event: string) => {
        if (event === "email_event") {
          fetchLogs();
        }
      },
      [fetchLogs]
    )
  );


  useEffect(() => {
    resetUnread();
  }, [pathname, resetUnread]);


  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (selectedProvider !== "" && l.provider !== selectedProvider) return false;
      if (selectedClientId !== "" && String(l.mailbox?.client?.id) !== String(selectedClientId)) return false;
      if (
        selectedDate !== "" &&
        new Date(l.timestamp).toDateString() !== new Date(selectedDate).toDateString()
      )
        return false;
      return true;
    });
  }, [logs, selectedProvider, selectedClientId, selectedDate]);


  const handleDownloadCSV = useCallback(() => {
    const csv = filteredLogs
      .map((l) => [
        l.id,
        l.mailbox?.email || "",
        l.direction,
        l.status,
        new Date(l.timestamp).toLocaleString(),
      ])
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_logs.csv";
    a.click();
  }, [filteredLogs]);



  return (
    <div className="p-8 text-black">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Mail className="text-blue-600" /> Email Logs ({filteredLogs.length})
        </h1>
        <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={fetchLogs}
            aria-label="Refresh Logs"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleDownloadCSV}
            aria-label="Download CSV"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>


      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center mb-5 shadow-sm">
        <div className="min-w-0 w-full sm:w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            aria-label="Provider Filter"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          >
            <option value="">All Providers</option>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 w-full sm:w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            aria-label="Client Filter"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          >
            <option value="">All Clients</option>
            {clients.map((c: Client) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 w-full sm:w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Date Filter"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          />
        </div>
      </div>


      <div className="bg-white rounded-xl shadow border border-gray-300 overflow-x-auto max-w-full">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <table className="min-w-[640px] sm:min-w-full border-collapse text-black text-xs sm:text-sm">
            <thead className="bg-gray-200 text-black text-sm">
              <tr>
                <th className="text-left p-3 font-semibold">ID</th>
                <th className="text-left p-3 font-semibold">Mailbox</th>
                <th className="text-left p-3 font-semibold">Subject</th>
                <th className="text-left p-3 font-semibold">Provider</th>
                <th className="text-left p-3 font-semibold">Direction</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Timestamp</th>
                <th className="text-left p-3 font-semibold">Attachments</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l, i) => (
                <tr
                  key={l.id}
                  className={`${i % 2 === 0 ? "bg-gray-100" : "bg-white"
                    } border-t hover:bg-blue-100 transition`}
                >
                  <td className="p-3">{l.id}</td>
                  <td className="p-3">{l.mailbox?.email || "-"}</td>
                  <td className="p-3">{l.subject || "-"}</td>
                  <td className="p-3">{l.provider || "-"}</td>
                  <td className="p-3 capitalize">{l.direction}</td>
                  <td className="p-3">
                    {(() => {
                      const s = String(l.status || "").toLowerCase();
                      const isOk = ["ok", "success", "sent", "delivered"].includes(
                        s
                      );
                      if (isOk) {
                        return (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                            OK
                          </span>
                        );
                      }

                      if (l.direction === "outbound") {
                        return (
                          <a
                            href="/dashboard/mailboxes"
                            className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 underline"
                          >
                            FAIL
                          </a>
                        );
                      }
                      return (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                          FAIL
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3">
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : "-"}
                  </td>
                  <td className="p-3">
                    {Array.isArray(l.attachments) && l.attachments.length > 0
                      ? l.attachments.map((a: { name?: string; filename?: string }, idx: number) => (
                        <span key={idx} className="block text-xs">
                          {a.name || a.filename}
                        </span>
                      ))
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
