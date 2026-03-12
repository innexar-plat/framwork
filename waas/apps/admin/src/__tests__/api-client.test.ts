/**
 * API client tests (mocked fetch).
 * Verifies request shape and error handling.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("tenant-api request", () => {
  it("throws when response is not ok and error in body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, data: null, error: "Bad request" }),
    });
    const { listBlogPosts } = await import("@/lib/tenant-api");
    await expect(
      listBlogPosts("fake-token", async () => null, { limit: 5 })
    ).rejects.toThrow("Bad request");
  });

  it("returns data on success", async () => {
    const data = [
      {
        id: "1",
        tenant_id: "t1",
        title: "Post",
        slug: "post",
        content: null,
        status: "draft",
        meta_title: null,
        meta_description: null,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data, error: null }),
    });
    const { listBlogPosts } = await import("@/lib/tenant-api");
    const result = await listBlogPosts("fake-token", async () => null, { limit: 5 });
    expect(result).toEqual(data);
  });
});
