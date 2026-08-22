import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 560 && document.documentElement.scrollHeight > window.innerHeight + 480);
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    const observer = new ResizeObserver(update); observer.observe(document.body);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); observer.disconnect(); };
  }, []);
  if (!visible) return null;
  return <button className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo" title="Voltar ao topo"><ArrowUp /></button>;
}
export default ScrollToTop;
