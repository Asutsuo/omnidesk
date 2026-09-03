import { Braces, Divide, FunctionSquare, Radical, Sigma, X } from "lucide-react";
import { MathfieldElement } from "mathlive";
import "mathlive/fonts.css";
import "mathlive/static.css";
import { useEffect, useRef, useState } from "react";

export default function FormulaComposer({ onInsert, onClose }: { onInsert: (latex: string, block: boolean) => void; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null); const field = useRef<MathfieldElement | undefined>(undefined); const [value, setValue] = useState("");
  useEffect(() => { const element = new MathfieldElement(); element.mathVirtualKeyboardPolicy = "manual"; element.smartFence = true; element.placeholder = "\\text{Digite uma expressão}"; const update = () => setValue(element.value); element.addEventListener("input", update); host.current?.append(element); field.current = element; window.setTimeout(() => element.focus(), 50); return () => { element.removeEventListener("input", update); element.remove(); }; }, []);
  const insert = (latex: string) => { field.current?.insert(latex, { selectionMode: "placeholder" }); field.current?.focus(); };
  const templates = [{ label: "Fração", icon: Divide, value: "\\frac{#0}{#?}" }, { label: "Raiz", icon: Radical, value: "\\sqrt{#0}" }, { label: "Potência", icon: FunctionSquare, value: "{#0}^{#?}" }, { label: "Integral", icon: Braces, value: "\\int_{#0}^{#?}" }, { label: "Somatório", icon: Sigma, value: "\\sum_{#0}^{#?}" }];
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal formula-composer" role="dialog" aria-modal="true"><header><div><span className="eyebrow">EXPRESSÃO MATEMÁTICA</span><h2>Monte sua fórmula visualmente</h2></div><button className="icon-button" onClick={onClose}><X /></button></header><p>Digite números e operadores normalmente ou escolha uma estrutura pronta. O botão de teclado dentro do campo abre mais símbolos.</p><div className="formula-template-grid">{templates.map(({ label, icon: Icon, value: template }) => <button className="secondary-button" onClick={() => insert(template)} key={label}><Icon /> {label}</button>)}</div><div className="formula-field" ref={host} /><footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="secondary-button" disabled={!value} onClick={() => onInsert(value, false)}>Inserir na linha</button><button className="primary-button" disabled={!value} onClick={() => onInsert(value, true)}>Inserir destacada</button></footer></section></div>;
}
