import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  Eye,
  ExternalLink,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { getStorefrontUrl } from '../../utils/config';

interface MerchantActionMenuProps {
  merchant: {
    id: string;
    name: string;
    status: string;
    store?: {
      id?: string;
      name?: string;
      slug?: string;
      status?: string;
    } | null;
    owner?: {
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
  onSendMessage: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onArchive: () => void;
}

export function MerchantActionMenu({
  merchant,
  onSendMessage,
  onSuspend,
  onReactivate,
  onArchive,
}: MerchantActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const isSuspended =
    merchant.status === 'SUSPENDED' || merchant.store?.status === 'SUSPENDED';
  const isArchived =
    merchant.status === 'ARCHIVED' || merchant.store?.status === 'ARCHIVED';
  const storeSlug = merchant.store?.slug;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-admin-muted hover:border-admin-border hover:bg-admin-raised hover:text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Actions for ${merchant.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-admin-border bg-admin-surface py-1.5 shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-30 focus:outline-none"
        >
          <Link
            href={`/merchants/${merchant.id}`}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-admin-text hover:bg-admin-raised transition-colors"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Eye className="h-3.5 w-3.5 text-admin-muted" />
            View Details
          </Link>

          {storeSlug && !isSuspended && !isArchived && (
            <a
              href={`${getStorefrontUrl()}/store/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-admin-text hover:bg-admin-raised transition-colors"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5 text-admin-muted" />
              View Store
            </a>
          )}

          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-admin-text hover:bg-admin-raised transition-colors"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSendMessage();
            }}
          >
            <Mail className="h-3.5 w-3.5 text-admin-accent" />
            Send Message
          </button>

          <div className="my-1 border-t border-admin-border/60" />

          {isSuspended ? (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onReactivate();
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Reactivate
            </button>
          ) : (
            !isArchived && (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSuspend();
                }}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Suspend
              </button>
            )
          )}

          {!isArchived && (
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
