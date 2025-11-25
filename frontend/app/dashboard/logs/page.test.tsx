import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";
import { useUnreadLogsStore } from "@/store/unreadLogs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LogsPage from "./page";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";

jest.mock("@/lib/api");
jest.mock("react-hot-toast");
jest.mock("@/hooks/useSocket");
jest.mock("@/store/unreadLogs", () => ({
    useUnreadLogsStore: jest.fn(),
}));
jest.mock("next/navigation", () => ({
    usePathname: () => "/dashboard/logs",
}));

const mockedApi = api as jest.Mocked<typeof api>;
const resetUnreadMock = jest.fn();
(useUnreadLogsStore as unknown as jest.Mock).mockImplementation((selector?: (s: any) => any) => {
    const state = { reset: resetUnreadMock };
    return typeof selector === "function" ? selector(state) : state;
});
(useSocket as jest.Mock).mockImplementation((cb) => cb);

const originalConsoleError = console.error;
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        const first = String(args[0] ?? "");
        if (first.includes("not wrapped in act(")) return;
        originalConsoleError(...args);
    });
});

afterAll(() => {
    (console.error as jest.Mock).mockRestore();
});

describe("LogsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    it("renders loading initially and fetches clients & logs", async () => {
        mockedApi.get.mockImplementation((url) => {
            if (url === "/clients") return Promise.resolve({ data: { data: [{ id: "1", name: "Client A" }] } });
            if (url.startsWith("/events")) return Promise.resolve({ data: { data: [{ id: "log1", provider: "google", direction: "inbound", status: "ok", timestamp: "2025-11-14T09:00:00Z" }] } });
            return Promise.resolve({ data: { data: [] } });
        });

        render(<LogsPage />);

        await waitFor(() => {
            expect(screen.getByText("Email Logs (1)")).toBeInTheDocument();
            expect(screen.getByText("Client A")).toBeInTheDocument();
            expect(resetUnreadMock).toHaveBeenCalledTimes(2);
        });
    });

    it("filters logs by provider,client, and date", async () => {
        mockedApi.get.mockResolvedValue({ data: { data: [{ id: "log1", provider: "google", mailbox: { client: { id: "1" }, email: "a@a.com" }, direction: "inbound", status: "ok", timestamp: "2025-11-14T09:00:00Z" }] } });
        render(<LogsPage />);

        await waitFor(() => screen.getByText(/Email Logs/i));

        fireEvent.change(screen.getByLabelText("Provider Filter"), { target: { value: "google" } });
        expect(screen.getByText(/Email Logs \(1\)/i)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Client Filter"), { target: { value: "1" } });
        expect(screen.getByText(/Email Logs \(1\)/i)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Date Filter"), { target: { value: "2025-11-14" } });
        expect(screen.getByText(/Email Logs \(1\)/i)).toBeInTheDocument();
    });

    it("handles API errors and shows toast", async () => {
        mockedApi.get.mockRejectedValue(new Error("API failure"));
        render(<LogsPage />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed to fetch clients", { id: "clients-error" });
            expect(toast.error).toHaveBeenCalledWith("Failed to fetch logs", { id: "fetch-logs" });
        });
    });

    it("downloads CSV correctly", async () => {
        mockedApi.get.mockResolvedValue({ data: { data: [{ id: "log1", provider: "google", mailbox: { email: "test@mail.com" }, direction: "inbound", status: "ok", timestamp: "2025-11-14T09:00:00Z" }] } });
        render(<LogsPage />);

        await waitFor(() => screen.getByText(/Email Logs/i));

        const urlMock = jest.fn(() => "blob:mock");
        window.URL.createObjectURL = urlMock;
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });

        const downloadBtn = screen.getByRole("button", { name: /Download CSV/i });
        await userEvent.click(downloadBtn);
        expect(urlMock).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();

        clickSpy.mockRestore();
    });

    it("refreshes logs when refresh button clicked", async () => {
        mockedApi.get.mockResolvedValue({ data: { data: [] } });

        render(<LogsPage />);
        await waitFor(() => screen.getByText(/Email Logs/i));

        const refreshBtn = screen.getByRole("button", { name: /Refresh Logs/i });
        await userEvent.click(refreshBtn);

        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining("/events"));
        });
    });
});
