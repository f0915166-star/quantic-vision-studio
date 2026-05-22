import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  delta?: number; // % vs previous
  icon?: ReactNode;
  accent?: "primary" | "accent" | "warning" | "info";
  onClick?: () => void;
  active?: boolean;
}

const accentMap: Record<string, string> = {
  primary: "from-[oklch(0.78_0.18_165)] to-[oklch(0.6_0.18_195)]",
  accent: "from-[oklch(0.72_0.18_235)] to-[oklch(0.55_0.2_265)]",
  warning: "from-[oklch(0.78_0.18_75)] to-[oklch(0.7_0.2_45)]",
  info: "from-[oklch(0.72_0.16_230)] to-[oklch(0.6_0.18_260)]",
};

export function KpiCard({ label, value, sublabel, delta, icon, accent = "primary", onClick, active }: KpiCardProps) {
  const trendIcon = delta == null ? <Minus className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
  const trendColor = delta == null ? "text-muted-foreground" : delta > 0 ? "text-[color:var(--color-success)]" : delta < 0 ? "text-[color:var(--color-destructive)]" : "text-muted-foreground";
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`panel kpi-pulse relative overflow-hidden text-left p-5 group transition-all ${active ? "ring-2 ring-primary panel-glow" : ""}`}
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
      <div className="relative flex items-start justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{label}</span>
        {icon && <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>}
      </div>
      <div className="relative font-mono font-semibold tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: value.length > 10 ? `${Math.max(15, 28 - (value.length - 10) * 1.4)}px` : "28px", lineHeight: 1.15 }}>{value}</div>
      <div className="relative mt-2 flex items-center gap-2 text-xs">
        {delta != null && (
          <span className={`inline-flex items-center gap-1 ${trendColor} font-medium`}>
            {trendIcon}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
      </div>
    </motion.button>
  );
}
