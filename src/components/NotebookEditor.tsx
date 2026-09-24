import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import {
  EditorView,
  keymap,
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { convertLatexToMarkup } from "mathlive";
import "mathlive/fonts.css";
import "mathlive/static.css";

export type NotebookFormatCommand =
  | "bold"
  | "italic"
  | "strikeThrough"
  | "heading"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "checkbox";

export type NotebookEditorHandle = {
  format: (command: NotebookFormatCommand) => void;
  rememberSelection: () => void;
  insertFormula: (latex: string, block: boolean) => void;
  focus: () => void;
};

type Props = {
  content: string;
  onChange: (content: string) => void;
};

const mathCache = new Map<string, string>();

function renderLatexMarkup(latex: string): string {
  const trimmed = latex.trim();
  if (!trimmed) return "";
  const cached = mathCache.get(trimmed);
  if (cached) return cached;
  try {
    const markup = convertLatexToMarkup(trimmed);
    mathCache.set(trimmed, markup);
    return markup;
  } catch {
    return trimmed;
  }
}

class MathWidget extends WidgetType {
  latex: string;
  isBlock: boolean;

  constructor(latex: string, isBlock: boolean) {
    super();
    this.latex = latex;
    this.isBlock = isBlock;
  }
  eq(other: MathWidget) {
    return this.latex === other.latex && this.isBlock === other.isBlock;
  }
  toDOM() {
    const wrap = document.createElement(this.isBlock ? "div" : "span");
    wrap.className = `notebook-formula ${this.isBlock ? "block" : "inline"}`;
    wrap.innerHTML = renderLatexMarkup(this.latex);
    return wrap;
  }
  ignoreEvent() {
    return false;
  }
}

class CheckboxWidget extends WidgetType {
  checked: boolean;
  pos: number;

  constructor(checked: boolean, pos: number) {
    super();
    this.checked = checked;
    this.pos = pos;
  }
  eq(other: CheckboxWidget) {
    return this.checked === other.checked && this.pos === other.pos;
  }
  toDOM(view: EditorView) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "cm-task-checkbox";
    input.checked = this.checked;
    input.onmousedown = (e) => e.stopPropagation();
    input.onclick = (e) => {
      e.stopPropagation();
      const current = view.state.doc.sliceString(this.pos, this.pos + 3);
      const isChecked = current === "[x]" || current === "[X]";
      view.dispatch({
        changes: {
          from: this.pos,
          to: this.pos + 3,
          insert: isChecked ? "[ ]" : "[x]",
        },
      });
    };
    return input;
  }
  ignoreEvent() {
    return true;
  }
}

const TOKEN_REGEX =
  /(\[\[math:([\s\S]*?)\]\]|\$\$([\s\S]*?)\$\$|\$([^\n$]+?)\$|\*\*([^*]+?)\*\*|__([^_]+?)__|~~([^~]+?)~~|`([^`]+?)`|\*([^*]+?)\*|_([^_]+?)_)/g;

function buildLiveDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const sel = view.state.selection.main;
  const cursorFrom = sel.from;
  const cursorTo = sel.to;

  type DecItem = { from: number; to: number; dec: Decoration };
  const items: DecItem[] = [];

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to && pos <= doc.length) {
      const line = doc.lineAt(pos);
      const lineText = line.text;
      const isCursorOnLine = cursorFrom >= line.from && cursorTo <= line.to;

      // 1. Headings: #, ##, ###
      const headingMatch = lineText.match(/^(#{1,6})\s/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        items.push({
          from: line.from,
          to: line.from,
          dec: Decoration.line({ class: `cm-heading cm-heading-${level}` }),
        });
        if (!isCursorOnLine) {
          items.push({
            from: line.from,
            to: line.from + level + 1,
            dec: Decoration.replace({}),
          });
        }
      }

      // 2. Task Checkbox: - [ ] or - [x]
      const taskMatch = lineText.match(/^(\s*[-*+]\s+)\[([ xX])\]/);
      if (taskMatch) {
        const checkPos = line.from + taskMatch[1].length;
        const isChecked = taskMatch[2].toLowerCase() === "x";
        items.push({
          from: checkPos,
          to: checkPos + 3,
          dec: Decoration.replace({
            widget: new CheckboxWidget(isChecked, checkPos),
          }),
        });
      }

      // 3. Inline Tokens: Math, Bold, Italic, Strikethrough, Code
      const lineOffset = line.from;
      TOKEN_REGEX.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = TOKEN_REGEX.exec(lineText)) !== null) {
        const start = lineOffset + m.index;
        const end = start + m[0].length;
        const isCursorInside = cursorTo >= start && cursorFrom <= end;

        // Math: [[math:...]], $$...$$, $...$
        if (m[2] !== undefined || m[3] !== undefined || m[4] !== undefined) {
          const latex = m[2] ?? m[3] ?? m[4];
          const isBlock = m[3] !== undefined;
          if (!isCursorInside) {
            items.push({
              from: start,
              to: end,
              dec: Decoration.replace({
                widget: new MathWidget(latex, isBlock),
              }),
            });
          }
        }
        // Bold: **text** or __text__
        else if (m[5] !== undefined || m[6] !== undefined) {
          const delimLen = 2;
          items.push({
            from: start + delimLen,
            to: end - delimLen,
            dec: Decoration.mark({ class: "cm-bold-text" }),
          });
          if (!isCursorInside) {
            items.push({
              from: start,
              to: start + delimLen,
              dec: Decoration.replace({}),
            });
            items.push({
              from: end - delimLen,
              to: end,
              dec: Decoration.replace({}),
            });
          }
        }
        // Strike: ~~text~~
        else if (m[7] !== undefined) {
          const delimLen = 2;
          items.push({
            from: start + delimLen,
            to: end - delimLen,
            dec: Decoration.mark({ class: "cm-strike-text" }),
          });
          if (!isCursorInside) {
            items.push({
              from: start,
              to: start + delimLen,
              dec: Decoration.replace({}),
            });
            items.push({
              from: end - delimLen,
              to: end,
              dec: Decoration.replace({}),
            });
          }
        }
        // Code: `code`
        else if (m[8] !== undefined) {
          const delimLen = 1;
          items.push({
            from: start + delimLen,
            to: end - delimLen,
            dec: Decoration.mark({ class: "cm-code-text" }),
          });
          if (!isCursorInside) {
            items.push({
              from: start,
              to: start + delimLen,
              dec: Decoration.replace({}),
            });
            items.push({
              from: end - delimLen,
              to: end,
              dec: Decoration.replace({}),
            });
          }
        }
        // Italic: *text* or _text_
        else if (m[9] !== undefined || m[10] !== undefined) {
          const delimLen = 1;
          items.push({
            from: start + delimLen,
            to: end - delimLen,
            dec: Decoration.mark({ class: "cm-italic-text" }),
          });
          if (!isCursorInside) {
            items.push({
              from: start,
              to: start + delimLen,
              dec: Decoration.replace({}),
            });
            items.push({
              from: end - delimLen,
              to: end,
              dec: Decoration.replace({}),
            });
          }
        }
      }

      pos = line.to + 1;
    }
  }

  // Sort items: RangeSetBuilder requires monotonic order. Line decorations must come before replaces at same position.
  items.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    const aIsLine = a.from === a.to;
    const bIsLine = b.from === b.to;
    if (aIsLine && !bIsLine) return -1;
    if (!aIsLine && bIsLine) return 1;
    return a.to - b.to;
  });

  for (const item of items) {
    builder.add(item.from, item.to, item.dec);
  }

  return builder.finish();
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildLiveDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildLiveDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

const omniTheme = EditorView.theme({
  "&": {
    height: "100%",
    minHeight: "420px",
    background: "transparent",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "14.5px",
    lineHeight: "1.75",
    outline: "none",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    caretColor: "var(--detail-color)",
    padding: "16px 8px",
    fontFamily: "inherit",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--detail-color)",
    borderLeftWidth: "2px",
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor:
      "color-mix(in srgb, var(--detail-color) 25%, transparent) !important",
  },
});

const NotebookEditor = forwardRef<NotebookEditorHandle, Props>(
  function NotebookEditor({ content, onChange }, forwardedRef) {
    const hostRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const savedSelection = useRef<{ from: number; to: number } | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
      if (!hostRef.current) return;

      const state = EditorState.create({
        doc: content,
        extensions: [
          omniTheme,
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          EditorView.lineWrapping,
          livePreviewPlugin,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: hostRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== content) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: content },
        });
      }
    }, [content]);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        viewRef.current?.focus();
      },
      rememberSelection: () => {
        const view = viewRef.current;
        if (view) {
          savedSelection.current = {
            from: view.state.selection.main.from,
            to: view.state.selection.main.to,
          };
        }
      },
      insertFormula: (latex, block) => {
        const view = viewRef.current;
        if (!view) return;
        const sel = savedSelection.current ?? {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
        };
        const insertText = block ? `\n$$\n${latex}\n$$\n` : `$${latex}$ `;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: insertText },
          selection: { anchor: sel.from + insertText.length },
          scrollIntoView: true,
        });
        view.focus();
      },
      format: (command) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.doc.sliceString(from, to);
        let insertText = "";
        let newAnchor = from;
        switch (command) {
          case "bold":
            insertText = selected ? `**${selected}**` : `**negrito**`;
            newAnchor = selected ? from + insertText.length : from + 2;
            break;
          case "italic":
            insertText = selected ? `*${selected}*` : `*itálico*`;
            newAnchor = selected ? from + insertText.length : from + 1;
            break;
          case "strikeThrough":
            insertText = selected ? `~~${selected}~~` : `~~tachado~~`;
            newAnchor = selected ? from + insertText.length : from + 2;
            break;
          case "heading":
            insertText = selected ? `## ${selected}` : `## Título`;
            newAnchor = from + insertText.length;
            break;
          case "checkbox":
            insertText = selected ? `- [ ] ${selected}` : `- [ ] `;
            newAnchor = from + insertText.length;
            break;
          case "insertUnorderedList":
            insertText = selected ? `- ${selected}` : `- `;
            newAnchor = from + insertText.length;
            break;
          case "insertOrderedList":
            insertText = selected ? `1. ${selected}` : `1. `;
            newAnchor = from + insertText.length;
            break;
        }
        view.dispatch({
          changes: { from, to, insert: insertText },
          selection: { anchor: newAnchor },
          scrollIntoView: true,
        });
        view.focus();
      },
    }));

    return <div className="notebook-live-workspace" ref={hostRef} />;
  },
);

export default NotebookEditor;
