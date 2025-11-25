import { useAuthStore } from "@/store/useAuthStore";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LoginPage from "./page";

jest.mock("@/store/useAuthStore");
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));


describe("LoginPage", () => {
    const pushMock = jest.fn();
    const replaceMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
            push: pushMock,
            replace: replaceMock,
        });
        mockUseAuthStore.mockReturnValue({
            token: null,
            login: jest.fn().mockResolvedValue(undefined),
        } as any);
    });

    test('renders login form correctly', () => {
        render(<LoginPage />);
        expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    test("shows validation error if fields are empty", async () => {
        render(<LoginPage />);
        await userEvent.click(screen.getByRole("button", { name: /login/i }));
        expect(await screen.findByText("Please fill in all fields")).toBeInTheDocument();
    });

    test("shows validation error for invalid email", async () => {
        render(<LoginPage />);
        await userEvent.type(screen.getByPlaceholderText("Email Address"), "invalidemail");
        await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
        await userEvent.click(screen.getByRole("button", { name: /login/i }));
        expect(await screen.findByText("Please enter a valid email")).toBeInTheDocument();
    });

    test("calls login function and redirects on sucess", async () => {
        const loginMock = jest.fn().mockResolvedValue(undefined);
        mockUseAuthStore.mockReturnValue({ token: null, login: loginMock } as any);

        render(<LoginPage />);
        await userEvent.type(screen.getByPlaceholderText("Email Address"), "test@example.com");
        await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
        await userEvent.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith("test@example.com", "password123");
            expect(pushMock).toHaveBeenCalledWith("/dashboard/dashboard");
        });
    });

    test("shows login failed error if login rejects", async () => {
        const loginMock = jest.fn().mockRejectedValue(new Error("Fail"));
        mockUseAuthStore.mockReturnValue({ token: null, login: loginMock } as any);

        render(<LoginPage />);
        await userEvent.type(screen.getByPlaceholderText("Email Address"), "test@example.com");
        await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
        await userEvent.click(screen.getByRole("button", { name: /login/i }));

        expect(await screen.findByText("Login failed")).toBeInTheDocument();
    });

    test("redirects automatically if token exists", () => {
        mockUseAuthStore.mockReturnValue({ token: "fake-token", login: jest.fn() } as any);
        render(<LoginPage />);
        expect(replaceMock).toHaveBeenCalledWith("/dashboard/dashboard");
    });
});