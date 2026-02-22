"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserRole } from "@/types";
import { getNavItems } from "@/lib/permissions";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  GraduationCap,
};

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export function MobileNav({ open, onClose, userRole }: MobileNavProps) {
  const pathname = usePathname();
  const navigation = getNavItems(userRole);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="flex h-14 items-center border-b px-4">
          <SheetTitle className="font-bold text-lg">Turonia</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <nav className="p-2">
          {navigation.map((entry) => {
            if (entry.type === "section") {
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

            return (
              <Link
                key={entry.name}
                href={entry.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{entry.name}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
