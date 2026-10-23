import { Prisma } from "@prisma/client";

/** Products, never variants; matches public storefront product eligibility. */
export function visibleCategoryCount(storeId: string, tenantId: string) {
  return {
    products: {
      where: {
        storeId,
        tenantId,
        status: "PUBLISHED" as const,
        deletedAt: null,
      },
    },
  } satisfies Prisma.CategoryCountOutputTypeSelect;
}
