"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";

interface HeaderProps {
  userEmail: string;
  onMenuToggle: () => void;
}

export function Header({ userEmail, onMenuToggle }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menú</span>
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {userEmail}
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Tancar sessió</span>
        </Button>
      </div>
    </header>
  );
}
