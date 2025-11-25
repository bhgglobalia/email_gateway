import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MailboxesPage from "@/app/dashboard/mailboxes/page";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    api: {
        get: jest.fn(),
        patch: jest.fn(),
    },
}));

jest.mock("@/hooks/useSocket", () => ({
    useSocket: jest.fn(),
}));

jest.mock("@/components/common/LoadingSpinner", () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn(),
}));

describe("MailboxesPage Component", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
            const first = String(args[0] ?? "");
            if (first.includes("not wrapped in act(")) return;
            // @ts-ignore ensure passthrough for other errors
            originalConsoleError(...args);
        });
    });

    afterAll(() => {
        (console.error as jest.Mock).mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("initial loading state should render", async () => {
        (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });
        (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

        render(<MailboxesPage />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("should load and display mailboxes", async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({ data: { data: [{ id: 1, email: "test@gmail.com", status: "active", provider: "google", client: { name: "Client A" } }] } })
            .mockResolvedValueOnce({ data: { data: [{ id: 10, name: "Client A", emailProvider: "google" }] } });

        render(<MailboxesPage />);

        await waitFor(() => {
            expect(screen.getAllByText("test@gmail.com").length).toBeGreaterThan(0);
        });

        expect(screen.getByText("Active: 1")).toBeInTheDocument();
    });

    test("should open Gmail connect modal", async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({ data: { data: [] } })
            .mockResolvedValueOnce({ data: { data: [{ id: 10, name: "Client A" }] } });

        render(<MailboxesPage />);

        await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
        fireEvent.change(screen.getByLabelText("Select Client"), {
            target: { value: "10" },
        });

        fireEvent.click(screen.getByLabelText("Connect Gmail"));

        expect(screen.getByText("Connect Gmail Mailbox")).toBeInTheDocument();
    });

    test("should show error for invalid email", async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({ data: { data: [] } })
            .mockResolvedValueOnce({ data: { data: [{ id: 10, name: "Client A" }] } });

        const { getByLabelText, getByText } = render(<MailboxesPage />);

        await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());

        fireEvent.change(getByLabelText("Select Client"), { target: { value: "10" } });
        fireEvent.click(getByLabelText("Connect Gmail"));

        fireEvent.change(getByLabelText("Mailbox Email"), { target: { value: "invalid_email" } });

        fireEvent.click(getByText("Connect"));

        expect(require("react-hot-toast").error).toHaveBeenCalled();
    });

    test("should refresh mailbox", async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({ data: { data: [{ id: 1, email: "test@gmail.com", status: "active", provider: "google" }] } })
            .mockResolvedValueOnce({ data: { data: [{ id: 10, name: "Client A" }] } });

        (api.patch as jest.Mock).mockResolvedValueOnce({});

        render(<MailboxesPage />);

        await waitFor(() => {
            expect(screen.getAllByText("test@gmail.com").length).toBeGreaterThan(0);
        });

        const refreshBtn = screen.getAllByLabelText("Refresh mailbox token")[0];

        fireEvent.click(refreshBtn);

        expect(api.patch).toHaveBeenCalledWith("/mailboxes/1/refresh");
    });
});
