import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";
import { render, screen, waitFor } from "@testing-library/react";
import ClientsPage from "./page";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

jest.mock("@/lib/api");
jest.mock("@/hooks/useSocket");
jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
}));

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

const mockClients = [
    {
        id: "1",
        name: "client One",
        domain: "one.com",
        emailProvider: "google",
        mailboxes: 5,
        status: "active",
    },
    {
        id: "2",
        name: "Client Two",
        domain: "two.com",
        emailProvider: "outlook",
        mailboxes: 2,
        status: "expired",
    },
];

describe("ClientPage", () => {
    beforeEach(() => {
        (api.get as jest.Mock).mockResolvedValue({ data: { data: mockClients } });
        (api.post as jest.Mock).mockResolvedValue({});
        (useSocket as jest.Mock).mockImplementation((cb) => cb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading initially", () => {
        render(<ClientsPage />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("fetches and displays clients", async () => {
        render(<ClientsPage />);
        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        await screen.findByText(/Clients\s*\(\s*2\s*\)/);
        expect(screen.getAllByText(/client one/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/client two/i).length).toBeGreaterThan(0);
    });

    it("opens and closes the Add Client modal", async () => {
        render(<ClientsPage />);
        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        const addBtn = screen.getByRole("button", { name: "Open Add Client Modal" });
        await userEvent.click(addBtn);

        expect(await screen.findByLabelText(/company domain/i)).toBeInTheDocument();

        const cancelBtn = screen.getByRole("button", { name: "Cancel Add Client" });
        await userEvent.click(cancelBtn);

        await waitFor(() => {
            expect(screen.queryByLabelText(/company domain/i)).not.toBeInTheDocument();
        });
    });

    it("validates duplicate domain", async () => {
        render(<ClientsPage />);
        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        const addBtn = screen.getByRole("button", { name: "Open Add Client Modal" });
        userEvent.click(addBtn);

        const nameInput = await screen.findByPlaceholderText("Client Name");
        const domainInput = await screen.findByPlaceholderText("Company Domain");
        const providerSelect = await screen.findByLabelText("Email Provider");

        await userEvent.type(nameInput, "New Client");
        await userEvent.type(domainInput, "one.com");
        await userEvent.selectOptions(providerSelect, "google");

        const submitBtn = await screen.findByRole("button", { name: "Add Client" });
        expect(submitBtn).toBeDisabled();
        await waitFor(() => {
            expect(screen.getByText(/Domain already exists\.? Enter a different domain\.?/i)).toBeInTheDocument();
        });
        expect(toast.error).not.toHaveBeenCalled();
    });


    it("adds a new client successfully", async () => {
        render(<ClientsPage />);
        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        const addBtn2 = await screen.findByRole("button", { name: "Open Add Client Modal" });
        await userEvent.click(addBtn2);

        const domainInput2 = await screen.findByLabelText(/company domain/i);
        const nameInput2 = screen.getByLabelText(/client name/i);
        const providerSelect2 = screen.getByLabelText(/email provider/i);

        await userEvent.type(nameInput2, "New Client");
        await userEvent.type(domainInput2, "new.com");
        await userEvent.selectOptions(providerSelect2, "google");

        const submitBtn = await screen.findByRole("button", { name: "Add Client" });
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/clients", {
                name: "New Client",
                domain: "new.com",
                emailProvider: "google",
            });
        });
    });

    it("handles fetch failure", async () => {
        (api.get as jest.Mock).mockRejectedValueOnce({});
        render(<ClientsPage />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed to fetch clients", { id: "fetch-clients" });
        });
    });

    it("handles add client failure", async () => {
        (api.post as jest.Mock).mockRejectedValueOnce({});
        render(<ClientsPage />);
        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        const addBtn3 = await screen.findByRole("button", { name: "Open Add Client Modal" });
        await userEvent.click(addBtn3);

        const domainInput3 = await screen.findByLabelText(/company domain/i);
        const nameInput3 = await screen.findByLabelText(/client name/i);
        const providerSelect3 = await screen.findByLabelText(/email provider/i);

        await userEvent.type(nameInput3, "Fail client");
        await userEvent.type(domainInput3, "fail.com");
        await userEvent.selectOptions(providerSelect3, "google");

        const submitBtn2 = await screen.findByRole("button", { name: "Add Client" });
        await waitFor(() => expect(submitBtn2).not.toBeDisabled());
        await userEvent.click(submitBtn2);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed to add client");
        });
    });
});