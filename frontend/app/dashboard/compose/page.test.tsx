import { api } from "@/lib/api";
import { render, screen, waitFor } from "@testing-library/react";
import ComposePage from "./page";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
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

describe("ComposePage", () => {
    const mailboxes = [
        { id: "1", email: "test1@example.com" },
        { id: "2", email: "test2@example.com" },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading spinner initially", () => {
        mockedApi.get.mockResolvedValueOnce({ data: [] });
        render(<ComposePage />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders form after fetching mailboxes", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mailboxes });
        render(<ComposePage />);

        await waitFor(() => {
            expect(screen.getByText(/compose new email/i)).toBeInTheDocument();
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });

        const fromSelect = await screen.findByRole("combobox");
        await userEvent.selectOptions(fromSelect, "1");
        expect((fromSelect as HTMLSelectElement).value).toBe("1");
    });

    it("can fill the form and send email without attachment", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mailboxes });
        mockedApi.post.mockResolvedValueOnce({ data: {} });

        render(<ComposePage />);

        await waitFor(() => {
            expect(screen.getByText(/compose new email/i)).toBeInTheDocument();
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });

        const from = await screen.findByRole("combobox");
        await userEvent.selectOptions(from, "1");
        await userEvent.type(screen.getByPlaceholderText(/recipient@domain.com/i), "recipient@example.com");
        await userEvent.type(screen.getByPlaceholderText(/subject line/i), "Test Subject");
        await userEvent.type(screen.getByPlaceholderText(/type your message here/i), "Test message");

        const sendBtn = screen.getByRole("button", { name: /send email/i });
        await userEvent.click(sendBtn);

        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalledWith("/mail/send", {
                mailboxId: "1",
                to: "recipient@example.com",
                subject: "Test Subject",
                message: "Test message",
            });
            expect(toast.success).toHaveBeenCalledWith("Email sent successfully!");
        });
    });

    it("can send email with attachment", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mailboxes });
        mockedApi.post.mockResolvedValueOnce({ data: {} });

        render(<ComposePage />);
        await waitFor(() => {
            expect(screen.getByText(/compose new email/i)).toBeInTheDocument();
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });

        const from = await screen.findByRole("combobox");
        await userEvent.selectOptions(from, "2");
        await userEvent.type(screen.getByPlaceholderText(/recipient@domain.com/i), "file@example.com");

        const file = new File(["file content"], "test.txt", { type: "text/plain" });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await userEvent.upload(fileInput, file);
        expect(fileInput.files?.[0]).toStrictEqual(file);

        const sendBtn = screen.getByRole("button", { name: /send email/i });
        await userEvent.click(sendBtn);

        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Email sent successfully!");
        });
    });

    it("clears form when clicking Clear button", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mailboxes });
        render(<ComposePage />);

        await waitFor(() => {
            expect(screen.getByText(/compose new email/i)).toBeInTheDocument();
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });
        const from = await screen.findByRole("combobox");
        await userEvent.selectOptions(from, "1");
        await userEvent.type(screen.getByPlaceholderText(/recipient@domain.com/i), "test@example.com");

        const clearBtn = screen.getByRole("button", { name: /clear/i });
        await userEvent.click(clearBtn);

        expect((await screen.findByRole("combobox") as HTMLSelectElement).value).toBe("");
        expect((screen.getByPlaceholderText(/recipient@domain.com/i) as HTMLInputElement).value).toBe("");
    });

    it("shows error toast if sending fails", async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mailboxes });
        mockedApi.post.mockRejectedValueOnce(new Error("fail"));

        render(<ComposePage />);
        await waitFor(() => {
            expect(screen.getByText(/compose new email/i)).toBeInTheDocument();
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });

        const from = await screen.findByRole("combobox");
        await userEvent.selectOptions(from, "1");
        await userEvent.type(screen.getByPlaceholderText(/recipient@domain.com/i), "fail@example.com");

        await userEvent.click(screen.getByRole("button", { name: /send email/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed to send email", { id: "send-email" });
        });
    });
});
