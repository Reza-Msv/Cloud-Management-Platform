"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  LayoutDashboard,
  Users,
  Server,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const tNav = useTranslations("Navigation");
  const tAuth = useTranslations("Auth");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoggingOut, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      title: tNav("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      title: tNav("customers"),
      href: "/dashboard/customers",
      icon: Users,
      active: pathname.startsWith("/dashboard/customers"),
    },
    {
      title: tNav("services"),
      href: "/dashboard/services",
      icon: Server,
      active: pathname.startsWith("/dashboard/services"),
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex flex-col border-e border-border bg-card transition-all duration-300 lg:static",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 p-1 shadow-xs ring-1 ring-primary/20">
              <Image
                src="/logo-symbol.svg"
                alt="Cloud Management Platform Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm tracking-tight truncate">
                CMP Cloud
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-8 w-8 text-muted-foreground"
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            ) : (
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden h-8 w-8 text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Info & Footer */}
        <div className="border-t border-border p-3">
          {!collapsed && user && (
            <div className="mb-3 px-2 py-1.5 rounded-lg bg-muted/50 text-xs">
              <div className="flex items-center gap-1.5 font-medium truncate">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>{user.username}</span>
                <span className="ms-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  {isAdmin ? "Admin" : "Operator"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground truncate">
                {user.email || "cmp@internal.net"}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed ? "justify-center px-0" : "justify-start px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ms-2">{tNav("logout")}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-4 sm:px-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 text-muted-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
