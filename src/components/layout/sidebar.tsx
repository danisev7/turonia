"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserRole } from "@/types";
import { getNavItems, type NavEntry } from "@/lib/permissions";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  GraduationCap,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole: UserRole;
}

export function Sidebar({ collapsed, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname();
  const navigation = getNavItems(userRole);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Escola El Turó" width={130} height={42} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8", collapsed && "mx-auto")}
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 p-2">
        {navigation.map((entry) => {
          if (entry.type === "section") {
            if (collapsed) return null;
            return (
              <div
                key={entry.name}
                className="mt-4 mb-1 mx-1 px-2 py-1 rounded-md bg-muted/50"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {entry.name}
                </span>
              </div>
            );
          }

          const isActive =
            pathname === entry.href || pathname.startsWith(entry.href + "/");
          const Icon = iconMap[entry.iconName] || LayoutDashboard;

          const linkContent = (
            <Link
              key={entry.name}
              href={entry.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{entry.name}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={entry.name} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{entry.name}</TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>
    </aside>
  );
}
