import { useEffect, useMemo, useState } from "react";
import { Camera, Database, Download, EyeOff, Plus, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import { emptyData, normalizeData, type AppData } from "../data";
import { DEV_DEMO_KEY, downloadBackup, isDevDemoMode, saveDevDemoData } from "../storage";
import { generateDemoData, mergeDemoData } from "./demoGenerator";
import { DEMO_SCENARIOS, type DemoOptions, type DemoScenarioId } from "./demoScenarios";
import "./DevTools.css";

type Props = { data: AppData; onApply: (data: AppData) => void };
const numericFields: Array<{ key: keyof DemoOptions; label: string; min: number; max: number }> = [
  { key: "subjects", label: "Matérias", min: 1, max: 40 }, { key: "assignments", label: "Trabalhos", min: 0, max: 300 },
  { key: "checklists", label: "Checklists", min: 0, max: 80 }, { key: "flashcards", label: "Flashcards", min: 0, max: 1_000 },
  { key: "notebooks", label: "Cadernos", min: 0, max: 80 }, { key: "days", label: "Dias no histórico", min: 7, max: 180 },
  { key: "completion", label: "Conclusão (%)", min: 0, max: 100 }, { key: "intensity", label: "Intensidade (%)", min: 0, max: 100 },
  { key: "dateOffset", label: "Deslocar datas", min: -365, max: 365 },
];

function DevTools({ data, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<DemoScenarioId>("contest");
  const [options, setOptions] = useState<DemoOptions>({ ...DEMO_SCENARIOS.contest.options });
  const [message, setMessage] = useState("");
  const demoMode = isDevDemoMode();
  const preview = useMemo(() => generateDemoData(options), [options]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault(); document.body.classList.remove("dev-presentation"); setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => { window.removeEventListener("keydown", shortcut); document.body.classList.remove("dev-presentation"); };
  }, []);

  const selectScenario = (id: DemoScenarioId) => { setScenario(id); setOptions({ ...DEMO_SCENARIOS[id].options }); };
  const updateNumber = (key: keyof DemoOptions, value: string) => setOptions((current) => ({ ...current, [key]: Number(value) }));
  const enterDemo = async (next: AppData) => {
    await saveDevDemoData(next);
    localStorage.setItem(DEV_DEMO_KEY, "1");
    window.location.reload();
  };
  const apply = async (mode: "replace" | "append") => {
    const generated = generateDemoData(options, `${mode}-${Date.now()}`);
    const next = mode === "append" ? mergeDemoData(data, generated) : generated;
    if (!window.confirm(`${mode === "replace" ? "Substituir" : "Acrescentar ao"} ambiente de demonstração? Seu perfil normal permanecerá intacto.`)) return;
    if (!demoMode) { await enterDemo(next); return; }
    await saveDevDemoData(next); onApply(next); setMessage("Cenário aplicado com sucesso.");
  };
  const clear = async () => {
    if (!window.confirm("Limpar somente o ambiente de demonstração?")) return;
    const cleared = normalizeData({ ...structuredClone(emptyData), onboarded: true, profile: { name: "Perfil de demonstração", course: "Ambiente para capturas", objective: "", weeklyGoal: 5 } });
    if (!demoMode) { await enterDemo(cleared); return; }
    await saveDevDemoData(cleared); onApply(cleared); setMessage("Ambiente de demonstração limpo.");
  };
  const leave = () => { localStorage.removeItem(DEV_DEMO_KEY); window.location.reload(); };
  const presentation = () => { setOpen(false); document.body.classList.add("dev-presentation"); setMessage(""); };

  return <aside className={`dev-tools ${open ? "open" : ""}`} aria-label="Ferramentas de demonstração">
    {!open && <button className="dev-trigger" onClick={() => setOpen(true)} title="Ferramentas de desenvolvimento"><Settings2 size={18} />{demoMode && <i />}</button>}
    {open && <div className="dev-panel">
      <header><div><span><Database size={14} /> SOMENTE DESENVOLVIMENTO</span><h2>Gerador de demonstração</h2></div><button onClick={() => setOpen(false)} aria-label="Fechar"><X /></button></header>
      <p className="dev-safety"><strong>{demoMode ? "Banco demo ativo." : "Perfil normal protegido."}</strong> Os dados são gravados em uma base IndexedDB separada.</p>
      <label>Cenário<select value={scenario} onChange={(event) => selectScenario(event.target.value as DemoScenarioId)}>{Object.entries(DEMO_SCENARIOS).map(([id, item]) => <option value={id} key={id}>{item.name}</option>)}</select><small>{DEMO_SCENARIOS[scenario].description}</small></label>
      <label>Semente<input value={options.seed} maxLength={80} onChange={(event) => setOptions((current) => ({ ...current, seed: event.target.value }))} /><small>A mesma semente e configuração reproduzem os mesmos dados.</small></label>
      <div className="dev-fields">{numericFields.map((field) => <label key={field.key}>{field.label}<input type="number" min={field.min} max={field.max} value={options[field.key]} onChange={(event) => updateNumber(field.key, event.target.value)} /></label>)}</div>
      <div className="dev-preview"><strong>Prévia</strong><span>{preview.subjects.length} matérias</span><span>{preview.assignments.length} trabalhos</span><span>{preview.checklistItems.length} itens</span><span>{preview.flashcards.length} cartões</span><span>{preview.stats.length} registros</span></div>
      {message && <p className="dev-message">{message}</p>}
      <div className="dev-actions"><button className="primary-button" onClick={() => void apply("replace")}><RotateCcw size={15} /> Gerar e substituir</button><button className="secondary-button" onClick={() => void apply("append")}><Plus size={15} /> Acrescentar cenário</button><button className="secondary-button" onClick={() => downloadBackup(preview)}><Download size={15} /> Exportar prévia</button><button className="secondary-button" onClick={presentation}><Camera size={15} /> Modo apresentação</button><button className="dev-danger" onClick={() => void clear()}><Trash2 size={15} /> Limpar demo</button>{demoMode && <button className="dev-leave" onClick={leave}><EyeOff size={15} /> Sair e restaurar perfil normal</button>}</div>
      <footer>Ctrl + Shift + D abre o painel e encerra o modo apresentação.</footer>
    </div>}
  </aside>;
}

export default DevTools;
