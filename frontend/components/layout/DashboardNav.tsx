"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { listNotifications } from "@/services/notifications";
import type { User } from "@/types/auth";

type Role = User["role"];
type NavLink = { label: string; href: string; match?: string; badge?: boolean };

const LINKS: Record<Role, NavLink[]> = {
  parent: [
    { label: "Accueil", href: "/dashboard/parent" },
    { label: "Recherche", href: "/dashboard/parent/recherche" },
    {
      label: "Demandes",
      href: "/dashboard/parent/reservations",
      match: "/dashboard/parent/reserv",
    },
    { label: "Messages", href: "/dashboard/parent/conversations" },
    { label: "Notifications", href: "/dashboard/parent/notifications", badge: true },
    { label: "Profil", href: "/dashboard/parent/profil" },
  ],
  aesh: [
    { label: "Accueil", href: "/dashboard/aesh" },
    { label: "Demandes", href: "/dashboard/aesh/demandes" },
    { label: "Documents", href: "/dashboard/aesh/documents" },
    { label: "Messages", href: "/dashboard/aesh/conversations" },
    { label: "Notifications", href: "/dashboard/aesh/notifications", badge: true },
    { label: "Profil", href: "/dashboard/aesh/profil" },
  ],
  admin: [
    { label: "Accueil", href: "/dashboard/admin" },
    { label: "AESH", href: "/dashboard/admin/aesh" },
    { label: "Import", href: "/dashboard/admin/aesh-import" },
    { label: "Réservations", href: "/dashboard/admin/bookings" },
    { label: "Utilisateurs", href: "/dashboard/admin/users" },
    {
      label: "Taxonomies",
      href: "/dashboard/admin/taxonomies/countries",
      match: "/dashboard/admin/taxonomies",
    },
  ],
};

function isActive(link: NavLink, pathname: string, home: string): boolean {
  if (link.href === home) return pathname === home;
  return pathname.startsWith(link.match ?? link.href);
}

export function DashboardNav({ space }: { space: Role }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const links = LINKS[space];
  const hasBadge = links.some((l) => l.badge);
  const allowed = user?.role === space;

  // Recharge le compteur à chaque navigation (une notification lue change le total).
  useEffect(() => {
    setOpen(false);
    if (!allowed || !hasBadge || !pathname) return;
    let cancelled = false;
    listNotifications()
      .then(({ unreadCount }) => !cancelled && setUnread(unreadCount))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [allowed, hasBadge, pathname]);

  if (!allowed || !pathname) return null;

  const home = links[0].href;
  const current = links.find((l) => isActive(l, pathname, home));

  const items = links.map((link) => {
    const active = link === current;
    return (
      <li key={link.href}>
        <Link
          href={link.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 min-h-11 px-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            active ? "bg-primary-light text-primary" : "text-subtle hover:text-ink hover:bg-cream"
          )}
        >
          {link.label}
          {link.badge && unread > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs font-semibold inline-flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
              <span className="sr-only"> non lue{unread > 1 ? "s" : ""}</span>
            </span>
          )}
        </Link>
      </li>
    );
  });

  return (
    <nav aria-label="Navigation de l’espace" className="bg-card border-b border-line">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="hidden md:flex items-center gap-1 py-2">{items}</ul>
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="w-full min-h-11 flex items-center justify-between text-sm font-medium text-ink"
          >
            <span>
              {current?.label ?? "Mon espace"}
              {!open && unread > 0 && (
                <span className="ml-2 text-xs text-primary">
                  · {unread} notification{unread > 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-subtle">
              Menu{" "}
              {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </span>
          </button>
          {open && <ul className="pb-3 space-y-1">{items}</ul>}
        </div>
      </div>
    </nav>
  );
}
