"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { Mailbox } from "@/app/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function ComposePage() {
  const [from, setFrom] = useState("");
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMailboxes = useCallback(async () => {
    try {
      const res = await api.get("/mailboxes");
      setMailboxes(
        Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : []
      );
    } catch {
      setMailboxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMailboxes();
  }, [fetchMailboxes]);

  const handleSend = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSending(true);

      try {
        if (attachment) {
          const formData = new FormData();
          formData.append("mailboxId", from);
          formData.append("to", to);
          formData.append("subject", subject);
          formData.append("message", message);
          formData.append("attachment", attachment);

          await api.post("/mail/send", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.post("/mail/send", {
            mailboxId: from,
            to,
            subject,
            message,
          });
        }

        toast.success("Email sent successfully!");
        setFrom("");
        setTo("");
        setSubject("");
        setMessage("");
        setAttachment(null);
      } catch {
        toast.error("Failed to send email", { id: "send-email" });
      } finally {
        setSending(false);
      }
    },
    [attachment, from, message, subject, to]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6 sm:mt-10 bg-white shadow-lg rounded-2xl p-5 sm:p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 border-b pb-4">
        <Mail className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Compose New Email</h1>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="block text-gray-800 font-medium mb-2">From</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select mailbox</option>
            {mailboxes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-800 font-medium mb-2">To</label>
          <input
            type="email"
            placeholder="recipient@domain.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-800 font-medium mb-2">Subject</label>
          <input
            type="text"
            placeholder="Subject line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-800 font-medium mb-2">Message</label>
          <textarea
            rows={8}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-800 font-medium mb-2">Attachment (optional)</label>
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="w-full text-gray-900 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200"
          />
          {attachment && (
            <div className="mt-2 text-sm text-gray-600 truncate">{attachment.name}</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-6 border-t mt-6">
          <button
            type="reset"
            onClick={() => {
              setFrom("");
              setTo("");
              setSubject("");
              setMessage("");
              setAttachment(null);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold border border-gray-300 transition active:scale-[0.99]"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm disabled:opacity-60 transition focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-[0.99]"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
