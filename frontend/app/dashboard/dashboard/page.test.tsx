import { api } from "@/lib/api";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./page";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
}));

const originalConsoleError = console.error;
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        const first = String(args[0] ?? "");
        if (first.includes("not wrapped in act(")) return;
        // @ts-ignore
        originalConsoleError(...args);
    });
});

afterAll(() => {
    (console.error as jest.Mock).mockRestore();
});

describe("DashboardPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading spinner initially", () => {
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
        mockedApi.get.mockResolvedValueOnce({ data: { count: 0 } });
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
        render(<DashboardPage />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("fetches and displays stats correctly", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: "1" }, { id: "2" }] } });
        mockedApi.get.mockResolvedValueOnce({ data: { count: 5 } });
        mockedApi.get.mockResolvedValueOnce({ data: { data: [{ timestamp: "2025-11-14T09:00:00Z" }] } });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText("Total Clients")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("Active Mailboxes")).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument();
            expect(screen.getByText("Last Event")).toBeInTheDocument();
            expect(screen.getByText(new RegExp(new Date("2025-11-14T09:00:00Z").toLocaleTimeString()))).toBeInTheDocument();
        });
    });

    it("navigates correctly when Quick Action buttons are clicked", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
        mockedApi.get.mockResolvedValueOnce({ data: { count: 0 } });
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

        render(<DashboardPage />);
        await waitFor(() => screen.getByText(/dashboard overview/i));

        const gmailBtn = screen.getByRole("button", { name: /connect gmail/i });
        await userEvent.click(gmailBtn);
        expect(pushMock).toHaveBeenCalledWith("/dashboard/mailboxes?provider=gmail");

        const outlookBtn = screen.getByRole("button", { name: /connect outlook/i });
        await userEvent.click(outlookBtn);
        expect(pushMock).toHaveBeenCalledWith("/dashboard/mailboxes?provider=outlook");
    });

    it("shows toast error if API call fails", async () => {
        mockedApi.get.mockRejectedValue(new Error("API failure"));

        render(<DashboardPage />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error fetching dashboard stats. Please refresh.", { id: "fetch-stats" });
        });
    });

    it("shows placeholder em dash for lastEvent if no events", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
        mockedApi.get.mockResolvedValueOnce({ data: { count: 3 } });
        mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText("—")).toBeInTheDocument();
        });
    });
});