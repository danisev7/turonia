"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Clock } from "lucide-react";

interface KPICardsProps {
  total: number;
  newLast7Days: number;
  pending: number;
}

export function KPICards({ total, newLast7Days, pending }: KPICardsProps) {
  const cards = [
    {
      title: "Total candidats",
      value: total,
      icon: Users,
      iconBg: "bg-teal-100 text-teal-700",
      border: "border-l-4 border-l-teal-500",
    },
    {
      title: "Nous (últims 7 dies)",
      value: newLast7Days,
      icon: UserPlus,
      iconBg: "bg-lime-100 text-lime-700",
      border: "border-l-4 border-l-lime-500",
    },
    {
      title: "Pendents de revisar",
      value: pending,
      icon: Clock,
      iconBg: "bg-amber-100 text-amber-700",
      border: "border-l-4 border-l-amber-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className={`${card.border} flex flex-col`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.iconBg}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center">
            <div className="text-4xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
