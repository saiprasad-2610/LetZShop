-- CreateTable
CREATE TABLE IF NOT EXISTS "plan_highlights" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "plan_highlights_plan_id_sort_order_idx" ON "plan_highlights"("plan_id", "sort_order");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plan_highlights_plan_id_fkey'
  ) THEN
    ALTER TABLE "plan_highlights" ADD CONSTRAINT "plan_highlights_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed initial default highlights for Launch, Growth, Custom if not already present
DO $$
DECLARE
  v_starter_id TEXT;
  v_growth_id TEXT;
  v_custom_id TEXT;
BEGIN
  SELECT id INTO v_starter_id FROM "plans" WHERE code = 'STARTER_MONTHLY' LIMIT 1;
  IF v_starter_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "plan_highlights" WHERE plan_id = v_starter_id) THEN
    INSERT INTO "plan_highlights" (id, plan_id, text, sort_order) VALUES
      (gen_random_uuid()::text, v_starter_id, 'Make your store live instantly', 0),
      (gen_random_uuid()::text, v_starter_id, 'Up to 50 active products', 1),
      (gen_random_uuid()::text, v_starter_id, '0% transaction fees on all orders', 2),
      (gen_random_uuid()::text, v_starter_id, 'All 6 foundational themes + Brand Studio', 3),
      (gen_random_uuid()::text, v_starter_id, 'Razorpay UPI/Cards + COD payments', 4),
      (gen_random_uuid()::text, v_starter_id, 'Shiprocket shipping & tracking', 5);
  END IF;

  SELECT id INTO v_growth_id FROM "plans" WHERE code = 'GROWTH_MONTHLY' LIMIT 1;
  IF v_growth_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "plan_highlights" WHERE plan_id = v_growth_id) THEN
    INSERT INTO "plan_highlights" (id, plan_id, text, sort_order) VALUES
      (gen_random_uuid()::text, v_growth_id, 'Everything in Launch', 0),
      (gen_random_uuid()::text, v_growth_id, 'Up to 500 active products', 1),
      (gen_random_uuid()::text, v_growth_id, 'Custom domain connection (e.g. yourstore.in)', 2),
      (gen_random_uuid()::text, v_growth_id, 'Up to 10 staff accounts', 3),
      (gen_random_uuid()::text, v_growth_id, 'Advanced analytics & priority support', 4),
      (gen_random_uuid()::text, v_growth_id, 'Automated WhatsApp order updates', 5);
  END IF;

  SELECT id INTO v_custom_id FROM "plans" WHERE code = 'CUSTOM' LIMIT 1;
  IF v_custom_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "plan_highlights" WHERE plan_id = v_custom_id) THEN
    INSERT INTO "plan_highlights" (id, plan_id, text, sort_order) VALUES
      (gen_random_uuid()::text, v_custom_id, 'Unlimited products & staff seats', 0),
      (gen_random_uuid()::text, v_custom_id, 'Dedicated account manager', 1),
      (gen_random_uuid()::text, v_custom_id, 'Custom integrations & themes', 2),
      (gen_random_uuid()::text, v_custom_id, 'SLA guarantee & custom domain', 3);
  END IF;
END $$;
