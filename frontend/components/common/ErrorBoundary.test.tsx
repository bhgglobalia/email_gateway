import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

const mockToastError = jest.fn();
jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
        error: (...args: any[]) => mockToastError(...args),
    },
}));

const ProblemChild = () => {
    throw new Error("Test error");
};

describe("ErrorBoundary Component", () => {
    let errSpy: jest.SpyInstance;
    beforeAll(() => {
        errSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    });
    beforeEach(() => {
        mockToastError.mockClear();
    });
    afterAll(() => {
        errSpy.mockRestore();
    });

    test("renders children normally when no error", () => {
        render(
            <ErrorBoundary>
                <div>Normal Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText("Normal Content")).toBeInTheDocument();
    });

    test("shows fallback UI when error occurs", async () => {
        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(
            screen.getByText("Something went wrong")
        ).toBeInTheDocument();

        expect(mockToastError).toHaveBeenCalledWith(
            "An unexpected error occured."
        );
    });

    test("resets error when clicking Try again", () => {
        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(
            screen.getByText("Something went wrong")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText("Try again"));

        render(
            <ErrorBoundary>
                <div>Normal Content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText("Normal Content")).toBeInTheDocument();
    });

    test("renders custom fallback if provided", () => {
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
    });
});