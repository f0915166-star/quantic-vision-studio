import { useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Download } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  kicker?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  exportData?: () => { filename: string; csv: string };
}

export function ChartPanel({ title, subtitle, kicker, children, actions, exportData }: Props) {
  const [full, setFull] = useState(false);

  const onExport = () => {
    if (!exportData) return;
    const { filename, csv } = exportData();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      layout
      className={full ? "fixed inset-4 z-50 panel panel-glow flex flex-col" : "panel p-5 flex flex-col"}
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          {kicker && <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold mb-1">{kicker}</div>}
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          {exportData && (
            <button onClick={onExport} title="Exportar CSV"
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setFull(!full)} title={full ? "Salir pantalla completa" : "Pantalla completa"}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            {full ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>
      <div className={full ? "flex-1 min-h-0" : ""}>{children}</div>
    </motion.section>
  );
}
