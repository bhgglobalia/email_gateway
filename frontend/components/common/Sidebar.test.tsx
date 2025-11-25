import { useUnreadLogsStore } from "@/store/unreadLogs";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
}));

jest.mock("@/store/unreadLogs", () => ({
    useUnreadLogsStore: jest.fn(),
}));

describe("Sidebar Component", () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (usePathname as jest.Mock).mockReturnValue("/dashboard/dashboard");
        (useUnreadLogsStore as unknown as jest.Mock).mockImplementation(
            (selector?: (s: { unreadCount: number }) => any) =>
                selector ? selector({ unreadCount: 0 }) : { unreadCount: 0 }
        );
    });

    test("renders Sidebar and all navigation links", () => {
        render(<Sidebar onClose={mockOnClose} />);

        expect(screen.getByText("Email Gateway")).toBeInTheDocument();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Clients")).toBeInTheDocument();
        expect(screen.getByText("Mailboxes")).toBeInTheDocument();
        expect(screen.getByText("Logs")).toBeInTheDocument();
        expect(screen.getByText("Compose")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    test("highlights the active link based on pathname", () => {
        (usePathname as jest.Mock).mockReturnValue("/dashboard/compose");

        render(<Sidebar />);
        const compose = screen.getByText("Compose");
        expect(compose.className).toContain("bg-blue-900");
    });

    test("shows unread logs badge when unread > 0", () => {
        (useUnreadLogsStore as unknown as jest.Mock).mockImplementation(
            (selector?: (s: { unreadCount: number }) => any) =>
                selector ? selector({ unreadCount: 5 }) : { unreadCount: 5 }
        );

        render(<Sidebar />);
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    test("calls onClose when link is clicked", () => {
        render(<Sidebar onClose={mockOnClose} />);
        fireEvent.click(screen.getByText("Dashboard"));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test("renders footer © text", () => {
        render(<Sidebar />);

        expect(screen.getByText("© 2025 GlobaliaSoft")).toBeInTheDocument();
    });

    test("mobile close button triggers onClose", () => {
        render(<Sidebar onClose={mockOnClose} />);

        const closeBtn = screen.getByLabelText("Close sidebar");
        fireEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });
});