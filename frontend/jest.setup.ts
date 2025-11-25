import "@testing-library/jest-dom";

// Filter specific noisy console logs in tests while preserving useful logs
const originalConsoleLog = console.log;
const SILENCED_LOG_PATTERNS = [
  "Socket fully disconnected (no active listeners)",
  "Connected to WebSocket:",
  "Disconnected from WebSocket",
];

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation((...args: any[]) => {
    const first = args[0];
    if (typeof first === "string" && SILENCED_LOG_PATTERNS.some((p) => first.includes(p))) {
      return;
    }
    originalConsoleLog(...(args as [any]));
  });
});

afterAll(() => {
  (console.log as unknown as jest.Mock | undefined)?.mockRestore?.();
});
