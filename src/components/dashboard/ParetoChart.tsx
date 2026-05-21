import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import type { Movement } from "@/lib/data-types";
import { useData } from "@/lib/data-store";

const COLORS = {
  bgCard: "#0D1424",
  border: "#1E2D45",
  teal: "#00E5B4",
  amber: "#F59E0B",
  red: "#EF4444",
  redFill: "rgba(239,68,68,0.80)",
  grayBar: "#334155",
  grayFill: "rgba(51,65,85,0.65)",
  textPrimary: "#F1F5F9",
  textMuted: "#475569",
  textSub: "#94A3B8",
  gridLine: "#1E2D45",
  tooltipBg: "#111D30",
};

const fmtSoles = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `S/ ${(n / 1_000).toFixed(0)}k`;
  return `S/ ${n.toFixed(0)}`;
};
const fmtSolesFull = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n);

export function ParetoChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();

  const { series, total, vitalCount, periodIni, periodFin } = useMemo(() => {
    const m = new Map<string, number>();
    let minF = "", maxF = "";
    for (const r of data) {
      m.set(r.bien, (m.get(r.bien) ?? 0) + r.costo);
      if (r.fecha) {
        if (!minF || r.fecha < minF) minF = r.fecha;
        if (!maxF || r.fecha > maxF) maxF = r.fecha;
      }
    }
    const grandTotal = Array.from(m.values()).reduce((s, v) => s + v, 0);
    const arr = Array.from(m.entries())
      .map(([bien, costo]) => ({ bien, costo }))
      .sort((a, b) => b.costo - a.costo)
      .slice(0, 15);

    let acc = 0;
    let vc = 0;
    const s = arr.map((x, i) => {
      const accBefore = acc;
      acc += x.costo;
      const pct = grandTotal ? (acc / grandTotal) * 100 : 0;
      const share = grandTotal ? (x.costo / grandTotal) * 100 : 0;
      const isVital = grandTotal ? (accBefore / grandTotal) * 100 < 80 : false;
      if (isVital) vc = i + 1;
      return {
        bien: x.bien,
        costo: x.costo,
        pct: i === arr.length - 1 ? 100 : pct,
        share,
        isVital,
      };
    });

    return {
      series: s,
      total: grandTotal,
      vitalCount: vc,
      periodIni: minF,
      periodFin: maxF,
    };
  }, [data]);

  const subtitle = `80/20 sobre costo total (PEN)${
    periodIni && periodFin ? ` · ${periodIni} → ${periodFin}` : ""
  } · ${vitalCount} ítem${vitalCount === 1 ? "" : "s"} concentran el 80% del costo`;

  return (
    <section
      style={{
        background: COLORS.bgCard,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: "20px 24px",
      }}
    >
      <header className="mb-4">
        <div
          style={{
            color: COLORS.teal,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 6,
          }}
        >
          Pareto 80/20
        </div>
        <h3 style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>
          Análisis Pareto — Top bienes
        </h3>
        <p style={{ color: COLORS.textSub, fontSize: 12, fontWeight: 400, marginTop: 4 }}>
          {subtitle}
        </p>
      </header>

      <ResponsiveContainer width="100%" height={460}>
        <ComposedChart data={series} margin={{ top: 32, right: 24, left: 8, bottom: 160 }}>
          <CartesianGrid stroke={COLORS.gridLine} strokeDasharray="3 3" strokeWidth={0.5} vertical={false} />

          <XAxis
            dataKey="bien"
            stroke={COLORS.textMuted}
            tick={{ fill: COLORS.textMuted, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: COLORS.border }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={150}
          />
          <YAxis
            yAxisId="l"
            stroke={COLORS.textMuted}
            tick={{ fill: COLORS.textMuted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtSoles(v)}
            width={70}
          />
          <YAxis
            yAxisId="r"
            orientation="right"
            stroke={COLORS.textMuted}
            tick={{ fill: COLORS.textMuted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            width={44}
          />

          <Tooltip
            cursor={{ fill: "rgba(0,229,180,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as {
                bien: string; costo: number; pct: number; share: number; isVital: boolean;
              };
              return (
                <div
                  style={{
                    background: COLORS.tooltipBg,
                    border: `0.5px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: COLORS.textPrimary,
                    maxWidth: 280,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6, wordBreak: "break-word" }}>{p.bien}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                    <span style={{ color: COLORS.textSub }}>Costo</span>
                    <span style={{ color: COLORS.teal }}>{fmtSolesFull(p.costo)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                    <span style={{ color: COLORS.textSub }}>% del total</span>
                    <span>{p.share.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                    <span style={{ color: COLORS.textSub }}>% acumulado</span>
                    <span style={{ color: COLORS.amber }}>{p.pct.toFixed(1)}%</span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: `0.5px solid ${COLORS.border}`,
                      fontSize: 11,
                      color: p.isVital ? COLORS.red : COLORS.textSub,
                      fontWeight: 600,
                    }}
                  >
                    {p.isVital ? "Vital (concentra el 80%)" : "Trivial"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textMuted }}>
                    Total: {fmtSolesFull(total)}
                  </div>
                </div>
              );
            }}
          />

          <ReferenceLine
            yAxisId="r"
            y={80}
            stroke={COLORS.red}
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: "Umbral 80%",
              position: "insideTopRight",
              fill: COLORS.red,
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          <Bar
            yAxisId="l"
            dataKey="costo"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(d) => toggleFilter("biens", (d as { bien: string }).bien)}
          >
            {series.map((s) => {
              const selected = filters.biens.has(s.bien);
              const dim = filters.biens.size > 0 && !selected;
              return (
                <Cell
                  key={s.bien}
                  fill={s.isVital ? COLORS.redFill : COLORS.grayFill}
                  stroke={s.isVital ? COLORS.red : COLORS.grayBar}
                  strokeWidth={0}
                  fillOpacity={dim ? 0.3 : 1}
                />
              );
            })}
            <LabelList
              dataKey="costo"
              position="top"
              offset={8}
              fontSize={10}
              fill={COLORS.textSub}
              formatter={(v: number) => fmtSoles(v)}
            />
          </Bar>

          <Line
            yAxisId="r"
            type="monotone"
            dataKey="pct"
            stroke={COLORS.amber}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORS.amber, stroke: COLORS.amber }}
            activeDot={{ r: 6 }}
          >
            <LabelList
              dataKey="pct"
              position="top"
              offset={10}
              fontSize={10}
              fill={COLORS.amber}
              formatter={(v: number) => `${v.toFixed(0)}%`}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px 20px",
          marginTop: 12,
          fontSize: 11,
          color: COLORS.textSub,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: COLORS.redFill, border: `1px solid ${COLORS.red}`, borderRadius: 2 }} />
          Pocos vitales (concentran el 80% del costo)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: COLORS.grayFill, border: `1px solid ${COLORS.grayBar}`, borderRadius: 2 }} />
          Muchos triviales
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: COLORS.amber }} />
          % acumulado
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, borderTop: `1.5px dashed ${COLORS.red}` }} />
          Umbral 80%
        </span>
      </div>
    </section>
  );
}
