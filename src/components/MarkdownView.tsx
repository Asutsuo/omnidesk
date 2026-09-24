import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "mathlive/fonts.css";
import "mathlive/static.css";

const preprocessMath = (text: string) => {
  if (!text) return "";
  return text
    .replace(
      /\$\$([\s\S]*?)\$\$/g,
      (_match, math) => `\n\`\`\`math\n${math.trim()}\n\`\`\`\n`,
    )
    .replace(
      /\[\[math:([\s\S]*?)\]\]/g,
      (_match, math) => `\`math:${math.trim()}\``,
    )
    .replace(
      /(^|[^\w$])\$([^\n$]+?)\$(?!\$)/g,
      (_match, prefix, math) => `${prefix}\`math:${math.trim()}\``,
    );
};

function MarkdownView({
  content,
  compact = false,
  onToggleCheckbox,
}: {
  content: string;
  compact?: boolean;
  onToggleCheckbox?: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const processed = useMemo(() => preprocessMath(content), [content]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const formulas = container.querySelectorAll<HTMLElement>("[data-latex]");
    if (!formulas.length) return;
    void import("mathlive").then(({ convertLatexToMarkup }) => {
      formulas.forEach((formula) => {
        if (formula.dataset.latex) {
          formula.innerHTML = convertLatexToMarkup(formula.dataset.latex);
        }
      });
    });
  }, [processed]);

  return (
    <div
      ref={containerRef}
      className={`markdown-view ${compact ? "compact" : ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href, ...props }) => (
            <a {...props} href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          li: ({ node, children, ...props }) => {
            const sourceLine = node?.position?.start.line;
            return (
              <li
                {...props}
                onClick={(event) => {
                  const target = event.target;
                  if (
                    !(target instanceof HTMLInputElement) ||
                    target.type !== "checkbox"
                  )
                    return;
                  event.stopPropagation();
                  event.preventDefault();
                  if (sourceLine) onToggleCheckbox?.(sourceLine);
                }}
              >
                {children}
              </li>
            );
          },
          input: (props) => {
            const { node, ...inputProps } = props;
            void node;
            return (
              <input {...inputProps} disabled={!onToggleCheckbox} readOnly />
            );
          },
          code: ({ className, children, ...props }) => {
            const codeStr = String(children);
            if (className === "language-math") {
              return (
                <div
                  className="notebook-formula block"
                  data-latex={codeStr.trim()}
                  data-block="true"
                >
                  {codeStr}
                </div>
              );
            }
            if (codeStr.startsWith("math:")) {
              const latex = codeStr.slice(5);
              return (
                <span className="notebook-formula inline" data-latex={latex}>
                  {latex}
                </span>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
export default MarkdownView;
