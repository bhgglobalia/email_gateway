import { useAuthStore } from "@/store/useAuthStore";
import { fireEvent, render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

jest.mock("@/store/useAuthStore");

describe("Navbar Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders default Admin text when no user is logged in", () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: null,
            logout: jest.fn(),
        });
        render(<Navbar />);

        expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Admin")).toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument();
    });

    test("renders user email and first letter avatar", () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { email: "test@example.com" },
            logout: jest.fn(),
        });
        render(<Navbar />);

        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("T")).toBeInTheDocument();
    });

    test("calls logout when logout button is clicked", () => {
        const mockLogout = jest.fn();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { email: "admin@gmail.com" },
            logout: mockLogout,
        });
        render(<Navbar />);

        const button = screen.getByRole("button", { name: /logout/i });
        fireEvent.click(button);

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test("renders logout icon and text", () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { email: "user@mail.com" },
            logout: jest.fn(),
        });

        render(<Navbar />);

        expect(screen.getByLabelText("Logout")).toBeInTheDocument();
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
});