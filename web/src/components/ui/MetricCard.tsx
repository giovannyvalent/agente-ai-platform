import { ReactNode } from "react";
import { Card } from "./Card";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
  icon?: ReactNode;
}

export function MetricCard({ label, value, delta, deltaTone = "up" }: MetricCardProps) {
  return (
    <Card className="p-5">
      <p className="text-steel text-sm">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-semibold text-ivory tracking-tight">{value}</span>
        {delta && (
          <span className={`text-xs font-medium ${deltaTone === "up" ? "text-[#4ade80]" : "text-red-400"}`}>
            {deltaTone === "up" ? "↗" : "↘"} {delta}
          </span>
        )}
      </div>
    </Card>
  );
}
