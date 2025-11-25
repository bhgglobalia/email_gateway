"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface MaskedKeys {
  [key: string]: string;
}

interface Webhooks {
  [key: string]: string;
}

interface WorkerHealth {
  status: "ok" | "error";
  lastPing: string;
}

interface TokenExpiry {
  email: string;
  provider: string;
  tokenExpiresAt: string | null;
}
export default function SettingsPage() {
  const [maskedKeys, setMaskedKeys] = useState<MaskedKeys | null>(null);
  const [webhooks, setWebhooks] = useState<Webhooks | null>(null);
  const [worker, setWorker] = useState<WorkerHealth | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<TokenExpiry[]>([]); const [loading, setLoading] = useState(true);


  const errorShownRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [keysRes, webhooksRes, workerRes, expiryRes] = await Promise.all([
          api.get("/settings/masked-keys"),
          api.get("/settings/webhooks"),
          api.get("/settings/worker-health"),
          api.get("/settings/token-expiry"),
        ]);
        setMaskedKeys(keysRes.data);
        setWebhooks(webhooksRes.data);
        setWorker(workerRes.data);
        setTokenExpiry(Array.isArray(expiryRes.data) ? expiryRes.data : []);
      } catch {
        if (!errorShownRef.current) {
          toast.error("Failed to fetch settings info");
          errorShownRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!maskedKeys || !webhooks || !worker) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-red-600 text-lg">Failed to load settings data.</p>
      </div>
    );
  }


  return (
    <div className="max-w-4xl w-full mx-auto bg-white shadow-lg border border-gray-200 rounded-2xl px-3 sm:px-6 md:px-10 py-5 sm:py-8 mt-2 sm:mt-6 md:mt-10 overflow-x-auto text-black">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 tracking-tight">System Settings & Monitoring</h1>

      <section className="mb-8 sm:mb-10">
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">API Keys</h2>
          </div>
          <div className="divide-y">
            {Object.entries(maskedKeys).map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-gray-50">
                <span className="text-gray-800 font-medium break-all">{k}</span>
                <span className="sm:col-span-2 font-mono text-gray-600 break-all text-xs sm:text-sm md:text-base">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="mb-8 sm:mb-10">
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Webhook URLs</h2>
          </div>
          <div className="divide-y">
            {Object.entries(webhooks).map(([k, v]) => (
              <div key={k} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-gray-50">
                <span className="text-gray-800 font-medium capitalize break-all">{k}</span>
                <span className="sm:col-span-2 text-blue-700 font-mono break-all text-xs sm:text-sm md:text-base">{v as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="mb-8 sm:mb-10">
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Worker Health</h2>
          </div>
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <span className="text-gray-800 font-medium">Worker</span>
              <span className={`${worker.status === 'ok' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold inline-flex justify-center w-max`}>
                {worker.status}
              </span>
              <span className="text-gray-600 font-mono text-xs sm:text-sm md:text-base">{new Date(worker.lastPing).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Token Expiry Info</h2>
          </div>
          <div className="p-2 sm:p-3 md:p-4">
            <div className="sm:hidden grid grid-cols-1 gap-3">
              {tokenExpiry.map((t, index) => {
                const isExpired = !t.tokenExpiresAt || (new Date(t.tokenExpiresAt).getTime() < Date.now());
                const when = t.tokenExpiresAt ? new Date(t.tokenExpiresAt).toLocaleString() : 'N/A';
                return (
                  <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 break-all">{t.email}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          <span className="capitalize">{t.provider}</span>
                        </div>
                      </div>
                      <div>
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-red-800 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium">Expired</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-800 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-700">
                      Expires: <span className="font-mono">{when}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-x-auto w-full">
              <table className="min-w-[720px] w-full border-collapse text-black text-sm md:text-base">
                <thead className="bg-gray-100/80 text-black sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">User Email</th>
                    <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Provider</th>
                    <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Expires At</th>
                    <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenExpiry.map((t, i) => {
                    const isExpired = !t.tokenExpiresAt || (new Date(t.tokenExpiresAt).getTime() < Date.now());
                    const when = t.tokenExpiresAt ? new Date(t.tokenExpiresAt).toLocaleString() : 'N/A';
                    return (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-t hover:bg-blue-50 transition`}>
                        <td className="p-2 sm:p-3 break-all max-w-[240px]">{t.email}</td>
                        <td className="p-2 sm:p-3 capitalize break-all max-w-[140px]">{t.provider}</td>
                        <td className="p-2 sm:p-3 break-all font-mono max-w-[220px]">{when}</td>
                        <td className="p-2 sm:p-3">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-red-800 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium">Expired</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-800 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
