-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'SELLER_OWNER', 'SELLER_STAFF');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'PRIVATE_PREVIEW', 'LIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductMode" AS ENUM ('SELL_ONLINE', 'ENQUIRY_ONLY', 'SELL_AND_ENQUIRY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('COLOUR', 'SIZE', 'MATERIAL', 'STORAGE', 'PACK_SIZE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL_STOCK', 'MANUAL_ADJUSTMENT', 'ORDER_RESERVATION', 'ORDER_FULFILLMENT', 'ORDER_CANCELLATION', 'RETURN_RESTOCK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'ACCEPTED', 'READY', 'DISPATCHED', 'COMPLETED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'QUOTATION_SENT', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING_COMMUNICATION', 'ORDER_TRACKING');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('DATA_EXPORT', 'DATA_ERASURE', 'CONSENT_WITHDRAWAL', 'DATA_RECTIFICATION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('MOCK', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('PLATFORM_SUBSCRIPTION', 'MERCHANT_ORDER');

-- CreateEnum
CREATE TYPE "ShippingProviderType" AS ENUM ('MOCK', 'SHIPROCKET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER_OWNER',
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "store_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "ip_address" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "replaced_by_token_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER_STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "StoreStatus" NOT NULL DEFAULT 'DRAFT',
    "default_currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "is_publicly_accessible" BOOLEAN NOT NULL DEFAULT false,
    "preview_secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_branding" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#1E40AF',
    "accent_color" TEXT NOT NULL DEFAULT '#F59E0B',
    "font_heading" TEXT NOT NULL DEFAULT 'Inter',
    "font_body" TEXT NOT NULL DEFAULT 'Inter',
    "announcement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_theme_configs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_theme_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_sections" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "section_type" TEXT NOT NULL,
    "title" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_paise" INTEGER NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "max_products" INTEGER NOT NULL DEFAULT 50,
    "max_staff" INTEGER NOT NULL DEFAULT 2,
    "max_storage_mb" INTEGER NOT NULL DEFAULT 1024,
    "custom_domain_allowed" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "invoice_pdf_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "provider_payment_id" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "mode" "ProductMode" NOT NULL DEFAULT 'SELL_ONLINE',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "min_order_quantity" INTEGER NOT NULL DEFAULT 1,
    "lead_time_days" INTEGER,
    "brochure_url" TEXT,
    "specifications" JSONB,
    "enquiry_cta_text" TEXT DEFAULT 'Request Quotation',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OptionType" NOT NULL DEFAULT 'CUSTOM',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price_paise" INTEGER NOT NULL,
    "compare_at_price_paise" INTEGER,
    "cost_price_paise" INTEGER,
    "status" "VariantStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option_values" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "option_value_id" TEXT NOT NULL,

    CONSTRAINT "product_variant_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "stock_on_hand" INTEGER NOT NULL DEFAULT 0,
    "stock_reserved" INTEGER NOT NULL DEFAULT 0,
    "safety_stock_threshold" INTEGER NOT NULL DEFAULT 0,
    "allow_backorder" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "full_name" TEXT NOT NULL,
    "is_guest" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "guest_token" TEXT,
    "customer_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "shipment_status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal_paise" INTEGER NOT NULL,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "shipping_paise" INTEGER NOT NULL DEFAULT 0,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "delivery_address" JSONB NOT NULL,
    "guest_checkout" BOOLEAN NOT NULL DEFAULT true,
    "tracking_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "product_name" TEXT NOT NULL,
    "variant_title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "selected_options" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_paise" INTEGER NOT NULL,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_payment_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "provider" "PaymentProviderType" NOT NULL DEFAULT 'MOCK',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "connection_status" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "kyc_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "key_id" TEXT NOT NULL,
    "key_secret_encrypted" TEXT NOT NULL,
    "webhook_secret_encrypted" TEXT,
    "merchant_account_id" TEXT,
    "capabilities" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'MERCHANT_ORDER',
    "provider" "PaymentProviderType" NOT NULL DEFAULT 'MOCK',
    "provider_order_id" TEXT NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT,
    "receipt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "payment_order_id" TEXT NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "provider_signature" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "amount_paise" INTEGER NOT NULL,
    "fee_paise" INTEGER,
    "tax_paise" INTEGER,
    "payment_method" TEXT,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_transaction_id" TEXT NOT NULL,
    "provider_refund_id" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'MERCHANT_ORDER',
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_shipping_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "provider" "ShippingProviderType" NOT NULL DEFAULT 'MOCK',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "api_key_encrypted" TEXT NOT NULL,
    "api_secret_encrypted" TEXT NOT NULL,
    "account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_shipping_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flat_rate_paise" INTEGER NOT NULL DEFAULT 0,
    "free_shipping_threshold_paise" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "awb_number" TEXT,
    "courier_name" TEXT,
    "tracking_url" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "label_url" TEXT,
    "manifest_url" TEXT,
    "weight_kg" DOUBLE PRECISION,
    "length_cm" DOUBLE PRECISION,
    "width_cm" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "event_timestamp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "company_name" TEXT,
    "message" TEXT NOT NULL,
    "requested_quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "quotation_amount_paise" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT NOT NULL DEFAULT 'USER',
    "tenant_id" TEXT,
    "store_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tenant_id" TEXT,
    "store_id" TEXT,
    "route" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "response_status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "store_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "phone" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "policy_version" TEXT NOT NULL DEFAULT 'v1.0',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "request_type" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilled_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "otp_requests_phone_is_verified_expires_at_idx" ON "otp_requests"("phone", "is_verified", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_is_revoked_expires_at_idx" ON "sessions"("user_id", "is_revoked", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_is_revoked_idx" ON "refresh_tokens"("token_hash", "is_revoked");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_tenant_id_user_id_key" ON "tenant_memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_tenant_id_status_idx" ON "stores"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "stores_slug_is_publicly_accessible_idx" ON "stores"("slug", "is_publicly_accessible");

-- CreateIndex
CREATE UNIQUE INDEX "store_branding_store_id_key" ON "store_branding"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "themes_code_key" ON "themes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "store_theme_configs_store_id_theme_id_key" ON "store_theme_configs"("store_id", "theme_id");

-- CreateIndex
CREATE INDEX "store_sections_store_id_sort_order_idx" ON "store_sections"("store_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscription_events_subscription_id_created_at_idx" ON "subscription_events"("subscription_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_invoice_number_key" ON "subscription_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "categories_tenant_id_store_id_is_active_idx" ON "categories"("tenant_id", "store_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_store_id_slug_key" ON "categories"("store_id", "slug");

-- CreateIndex
CREATE INDEX "products_tenant_id_store_id_status_idx" ON "products"("tenant_id", "store_id", "status");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_slug_key" ON "products"("store_id", "slug");

-- CreateIndex
CREATE INDEX "product_options_tenant_id_store_id_idx" ON "product_options"("tenant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_name_key" ON "product_options"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_option_id_value_key" ON "product_option_values"("option_id", "value");

-- CreateIndex
CREATE INDEX "product_variants_tenant_id_store_id_status_idx" ON "product_variants"("tenant_id", "store_id", "status");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_store_id_sku_key" ON "product_variants"("store_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_option_values_variant_id_option_value_id_key" ON "product_variant_option_values"("variant_id", "option_value_id");

-- CreateIndex
CREATE INDEX "product_media_product_id_sort_order_idx" ON "product_media"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_media_variant_id_idx" ON "product_media"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_key" ON "inventory"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_tenant_id_store_id_idx" ON "inventory"("tenant_id", "store_id");

-- CreateIndex
CREATE INDEX "inventory_movements_variant_id_created_at_idx" ON "inventory_movements"("variant_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_store_id_idx" ON "inventory_movements"("tenant_id", "store_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_store_id_phone_idx" ON "customers"("tenant_id", "store_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "carts_guest_token_key" ON "carts"("guest_token");

-- CreateIndex
CREATE INDEX "carts_tenant_id_store_id_idx" ON "carts"("tenant_id", "store_id");

-- CreateIndex
CREATE INDEX "carts_guest_token_idx" ON "carts"("guest_token");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tracking_token_key" ON "orders"("tracking_token");

-- CreateIndex
CREATE INDEX "orders_tenant_id_store_id_status_idx" ON "orders"("tenant_id", "store_id", "status");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "merchant_payment_accounts_tenant_id_store_id_idx" ON "merchant_payment_accounts"("tenant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_payment_accounts_store_id_provider_key" ON "merchant_payment_accounts"("store_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_idempotency_key_key" ON "payment_orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_orders_tenant_id_store_id_idx" ON "payment_orders"("tenant_id", "store_id");

-- CreateIndex
CREATE INDEX "payment_orders_provider_order_id_idx" ON "payment_orders"("provider_order_id");

-- CreateIndex
CREATE INDEX "payment_orders_subscription_id_idx" ON "payment_orders"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_payment_id_key" ON "payment_transactions"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_provider_refund_id_key" ON "refunds"("provider_refund_id");

-- CreateIndex
CREATE INDEX "refunds_tenant_id_store_id_idx" ON "refunds"("tenant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_event_id_key" ON "payment_webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_event_type_is_processed_idx" ON "payment_webhook_events"("provider", "event_type", "is_processed");

-- CreateIndex
CREATE INDEX "merchant_shipping_accounts_tenant_id_store_id_idx" ON "merchant_shipping_accounts"("tenant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_shipping_accounts_store_id_provider_key" ON "merchant_shipping_accounts"("store_id", "provider");

-- CreateIndex
CREATE INDEX "shipping_profiles_tenant_id_store_id_idx" ON "shipping_profiles"("tenant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_awb_number_key" ON "shipments"("awb_number");

-- CreateIndex
CREATE INDEX "shipments_tenant_id_store_id_status_idx" ON "shipments"("tenant_id", "store_id", "status");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_created_at_idx" ON "shipment_events"("shipment_id", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_tenant_id_store_id_status_idx" ON "enquiries"("tenant_id", "store_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_status_expires_at_idx" ON "idempotency_keys"("key", "status", "expires_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_next_retry_at_idx" ON "outbox_events"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "consent_records_tenant_id_phone_purpose_idx" ON "consent_records"("tenant_id", "phone", "purpose");

-- CreateIndex
CREATE INDEX "data_subject_requests_tenant_id_status_idx" ON "data_subject_requests"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_branding" ADD CONSTRAINT "store_branding_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_theme_configs" ADD CONSTRAINT "store_theme_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_theme_configs" ADD CONSTRAINT "store_theme_configs_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_sections" ADD CONSTRAINT "store_sections_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "subscription_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_payment_accounts" ADD CONSTRAINT "merchant_payment_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_shipping_accounts" ADD CONSTRAINT "merchant_shipping_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_profiles" ADD CONSTRAINT "shipping_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_profiles" ADD CONSTRAINT "shipping_profiles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

