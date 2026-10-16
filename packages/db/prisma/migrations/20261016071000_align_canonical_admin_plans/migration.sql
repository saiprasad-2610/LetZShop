-- Canonical plan records remain the sole price source for every app.
UPDATE "plans" SET "name" = 'Launch', "price_paise" = 99900, "updated_at" = CURRENT_TIMESTAMP WHERE "code" = 'STARTER_MONTHLY';
UPDATE "plans" SET "name" = 'Growth', "price_paise" = 299900, "updated_at" = CURRENT_TIMESTAMP WHERE "code" = 'GROWTH_MONTHLY';
INSERT INTO "plans" ("id", "code", "name", "description", "price_paise", "is_public", "updated_at")
VALUES (gen_random_uuid()::text, 'CUSTOM', 'Custom', 'Contact Aikyam for a custom plan.', 0, false, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
