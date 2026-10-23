import { getSellerUrl } from "../../../storefront/src/utils/config";

describe("landing merchant CTA origins", () => {
  const previous = { ...process.env };
  afterEach(() => {
    process.env = { ...previous };
  });
  const clear = () => {
    delete process.env.NEXT_PUBLIC_SELLER_URL;
    delete process.env.SELLER_URL;
    delete process.env.SELLER_DASHBOARD_URL;
  };
  it("uses explicit production configuration without a trailing slash", () => {
    clear();
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SELLER_URL = "https://merchants.example.com/";
    expect(getSellerUrl()).toBe("https://merchants.example.com");
  });
  it("does not bake localhost into unconfigured production HTML", () => {
    clear();
    process.env.NODE_ENV = "production";
    expect(getSellerUrl()).toBe("https://seller.letzshop.store");
  });
  it("keeps the development merchant origin", () => {
    clear();
    process.env.NODE_ENV = "development";
    expect(getSellerUrl()).toBe("http://localhost:3001");
  });
});
