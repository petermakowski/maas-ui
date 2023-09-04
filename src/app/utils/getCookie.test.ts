import { getCookie } from "@/app/utils";

describe("getCookie", () => {
  it("returns undefined if a cookie is not found", () => {
    expect(getCookie("foo")).toBeNull();
  });

  it("returns the value of a cookie by name", () => {
    Object.defineProperty(document, "cookie", {
      get: jest.fn().mockImplementation(() => {
        return "a=foo; b=bar; c=baz";
      }),
    });
    expect(getCookie("b")).toEqual("bar");
  });
});
