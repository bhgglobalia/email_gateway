"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Client } from "@/app/types";
import { useSocket } from "@/hooks/useSocket";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    emailProvider: "",
    domain: "",
  });

  const isDuplicateDomain = !!form.domain &&
    clients.some(c => (c.domain || "").trim().toLowerCase() === form.domain.trim().toLowerCase());

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get("/clients");
      setClients(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error("Failed to fetch clients", { id: "fetch-clients" });
    }
  }, []);

  useEffect(() => {
    fetchClients().finally(() => setLoading(false));
  }, [fetchClients]);

  useSocket(
    useCallback(
      (event: string, data: unknown) => {
        if (event === "clientAdded" || event === "mailboxAdded") {
          console.log(`${event} event received`, data);
          fetchClients();
        }
      },
      [fetchClients]
    )
  );

  const handleAdd = useCallback(async () => {
    if (!form.name || !form.emailProvider || !form.domain) return;
    if (isDuplicateDomain) {
      toast.error("Domain already exists. Enter a different domain.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/clients", form);
      setShowModal(false);
      setForm({ name: "", emailProvider: "", domain: "" });
      await fetchClients();
    } catch {
      toast.error("Failed to add client");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, fetchClients, isDuplicateDomain]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-8 text-black">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">Clients ({clients.length})</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 active:scale-[0.99] transition"
          aria-label="Open Add Client Modal"
        >
          <Plus size={18} />
          <span>Add Client</span>
        </button>
      </div>

      <div className="hidden sm:block bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full border-collapse text-black">
          <thead className="bg-gray-100/80 text-black text-sm">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Domain</th>
              <th className="text-left p-3 font-semibold">Provider</th>
              <th className="text-left p-3 font-semibold">Mailboxes</th>
              <th className="text-left p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr
                key={c.id}
                className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} border-t hover:bg-blue-50 transition`}
              >
                <td className="p-3">
                  <span className="font-medium">{c.name}</span>
                </td>
                <td className="p-3">
                  <span className="text-gray-800">{c.domain}</span>
                </td>
                <td className="p-3 capitalize">
                  <span>{c.emailProvider || "-"}</span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm min-w-[2.5rem] text-center">
                    {c.mailboxes || 0}
                  </span>
                </td>
                <td className="p-3">
                  {c.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 size={16} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-700 font-semibold">
                      <AlertTriangle size={16} /> Token Expired
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden grid grid-cols-1 gap-3">
        {clients.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-600">{c.domain}</div>
              </div>
              {c.status === "active" ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle2 size={16} /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-yellow-700 text-sm font-medium">
                  <AlertTriangle size={16} /> Token Expired
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="text-gray-700 capitalize">{c.emailProvider || "-"}</div>
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm">
                {c.mailboxes || 0} mailboxes
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl text-black">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-black inline-flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" /> Add Client
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label htmlFor="client-name" className="sr-only">
              Client Name
            </label>
            <input
              id="client-name"
              type="text"
              placeholder="Client Name"
              aria-label="Client Name"
              className="w-full border border-gray-300 p-2.5 mb-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />


            <label htmlFor="client-domain" className="sr-only">
              Company Domain
            </label>
            <input
              id="client-domain"
              type="text"
              placeholder="Company Domain"
              aria-label="Company Domain"
              className={`w-full border p-2.5 mb-1 rounded-lg text-black focus:outline-none ${isDuplicateDomain
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                }`}
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />
            {isDuplicateDomain && (
              <p className="text-xs text-red-600 mb-2">Domain already exists. Enter a different domain.</p>
            )}

            <label htmlFor="client-emailProvider" className="sr-only">
              Email Provider
            </label>
            <select
              id="client-emailProvider"
              aria-label="Email Provider"
              className="w-full border border-gray-300 p-2.5 mb-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              value={form.emailProvider}
              onChange={(e) => setForm({ ...form, emailProvider: e.target.value })}
            >
              <option value="">Select Provider</option>
              <option value="google">Google</option>
              <option value="outlook">Outlook</option>
            </select>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 transition"
                aria-label="Cancel Add Client"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || isDuplicateDomain || !form.name || !form.emailProvider || !form.domain}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add Client"
              >
                {isSubmitting ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

