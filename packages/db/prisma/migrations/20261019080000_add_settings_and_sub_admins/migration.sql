-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_permissions" JSONB DEFAULT '[]'::jsonb;

-- CreateTable platform_settings
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable admin_invites
CREATE TABLE IF NOT EXISTS "admin_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "token_hash" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admin_invites_email_key" ON "admin_invites"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_invites_token_hash_key" ON "admin_invites"("token_hash");
