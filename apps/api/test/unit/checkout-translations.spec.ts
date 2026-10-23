import { createTranslator } from "@simply/i18n";

describe("checkout field labels", () => {
  it.each(["en-IN", "mr-IN", "hi-IN"] as const)(
    "resolves every checkout form label in %s",
    (locale) => {
      const translate = createTranslator(locale);
      for (const key of [
        "checkout.contactInfo",
        "checkout.fullName",
        "checkout.phone",
        "checkout.email",
        "checkout.delivery",
        "checkout.paymentMethod",
        "checkout.cod",
        "checkout.online",
        "checkout.placeOrder",
        "common.total",
      ]) {
        const value = translate(key);
        expect(value.trim()).not.toBe("");
        expect(value).not.toBe(key);
        expect(value).not.toBe(key.split(".").pop());
      }
    },
  );
});
