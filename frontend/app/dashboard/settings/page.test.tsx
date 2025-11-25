import { api } from "@/lib/api";
import { render, screen, waitFor } from "@testing-library/react";
import SettingsPage from "./page";

jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
}));

jest.mock("@/components/common/LoadingSpinner", () => ({
    LoadingSpinner: () => <div data-testid="spinner">loading...</div>,
}));

jest.mock("@/lib/api", () => ({
    api: {
        get: jest.fn(),
    },
}));

describe("SettingsPage Tests", () => {
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

    const mockedKeys = {
        API_KEY: "****1234",
        SECRET_KEY: "****5678",
    };

    const mockedWebhooks = {
        google: "https://example.com/google",
        outlook: "https://example.com/outlook",
    };

    const mockedWorker = {
        status: "ok",
        lastPing: new Date().toISOString(),
    };

    const mockedTokenExpiry = [
        {
            email: "user@example.com",
            provider: "google",
            tokenExpiresAt: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        (api.get as jest.Mock).mockImplementation((url: string) => {
            switch (url) {
                case "/settings/masked-keys":
                    return Promise.resolve({ data: mockedKeys });
                case "/settings/webhooks":
                    return Promise.resolve({ data: mockedWebhooks });
                case "/settings/worker-health":
                    return Promise.resolve({ data: mockedWorker });
                case "/settings/token-expiry":
                    return Promise.resolve({ data: mockedTokenExpiry });
                default:
                    return Promise.resolve({ data: {} });
            }
        });
    });

    test("renders loading spinner initially", () => {
        render(<SettingsPage />);
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    test("loads and displays API keys", async () => {
        render(<SettingsPage />);

        await waitFor(() => {
            expect(screen.getByText("API Keys")).toBeInTheDocument();
        });

        expect(screen.getByText("API_KEY")).toBeInTheDocument();
        expect(screen.getByText("****1234")).toBeInTheDocument();
    });

    test("loads webhook URLs", async () => {
        render(<SettingsPage />);
        await waitFor(() => {
            expect(screen.getByText("Webhook URLs")).toBeInTheDocument();
        });

        expect(screen.getAllByText("google").length).toBeGreaterThan(0);
        expect(screen.getByText("https://example.com/google")).toBeInTheDocument();
    });

    test("displays worker health", async () => {
        render(<SettingsPage />);
        await waitFor(() =>
            expect(screen.getByText("Worker Health")).toBeInTheDocument()
        );
        expect(screen.getByText("ok")).toBeInTheDocument();
    });

    test("displays token expiry table", async () => {
        render(<SettingsPage />);

        await waitFor(() =>
            expect(screen.getByText("Token Expiry Info")).toBeInTheDocument()
        );
        expect(screen.getAllByText("user@example.com").length).toBeGreaterThan(0);
        expect(screen.getAllByText("google").length).toBeGreaterThan(0);
    });

    test("handles API failure", async () => {
        (api.get as jest.Mock).mockRejectedValueOnce(new Error("failed"));

        render(<SettingsPage />);

        await waitFor(() =>
            expect(screen.getByText("Failed to load settings data.")).toBeInTheDocument()
        );
    });
});

