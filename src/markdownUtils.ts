export function toggleMarkdownCheckbox(content: string, sourceLine: number) {
  const lines = content.split("\n"); const index = sourceLine - 1;
  if (index < 0 || index >= lines.length) return content;
  lines[index] = lines[index].replace(/^(\s*(?:(?:>\s*)*)(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\])/, (_match, start: string, checked: string, end: string) => `${start}${checked.toLowerCase() === "x" ? " " : "x"}${end}`);
  return lines.join("\n");
}
