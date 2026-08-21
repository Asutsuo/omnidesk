import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownView({ content, compact = false, onToggleCheckbox }: { content: string; compact?: boolean; onToggleCheckbox?: (index: number) => void }) {
  return <div className={`markdown-view ${compact ? "compact" : ""}`}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    a: ({ children, href, ...props }) => <a {...props} href={href} target="_blank" rel="noreferrer noopener">{children}</a>,
    li: ({ node, children, ...props }) => { const sourceLine = node?.position?.start.line; return <li {...props} onClick={(event) => { const target = event.target; if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return; event.stopPropagation(); event.preventDefault(); if (sourceLine) onToggleCheckbox?.(sourceLine); }}>{children}</li>; },
    input: (props) => { const { node, ...inputProps } = props; void node; return <input {...inputProps} disabled={!onToggleCheckbox} readOnly />; },
  }}>{content}</ReactMarkdown></div>;
}
export default MarkdownView;
