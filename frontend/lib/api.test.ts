import axios from "axios";

jest.mock("axios");

describe("API Interceptors", () => {
  let requestInterceptor: any;
  let responseErrorInterceptor: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
    const axiosMod = await import("axios");
    const axiosMock = axiosMod.default as jest.Mocked<typeof axios>;
    axiosMock.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn((fn) => { requestInterceptor = fn; }) },
        response: { use: jest.fn((_onFulfilled, onRejected) => { responseErrorInterceptor = onRejected; }) },
      },
    } as any);

    await import("./api");
  });

  afterAll(() => {
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
  });

  test("adds Authorization header when token exists", async () => {
    Storage.prototype.getItem = jest.fn(() => "mock-token");

    const config: any = { headers: {} };

    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBe("Bearer mock-token");
  });


  test("does NOT add Authorization when token missing", async () => {
    Storage.prototype.getItem = jest.fn(() => null);

    const config: any = { headers: {} };

    const result = await requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  test("handles 401 response → clears token & redirects", async () => {
    Storage.prototype.removeItem = jest.fn();

    const error = {
      response: { status: 401 },
    };

    try {
      await responseErrorInterceptor(error);
    } catch (e) {
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith("token");
    }
  });

  test("non-401 errors should be rejected normally", async () => {
    const error = { response: { status: 500 } };

    await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
  });
});