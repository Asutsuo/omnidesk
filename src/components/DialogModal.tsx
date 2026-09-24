/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HelpCircle, Info, X } from "lucide-react";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  eyebrow?: string;
};

export type PromptOptions = {
  title: string;
  message?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  eyebrow?: string;
};

export type AlertOptions = {
  title: string;
  message?: ReactNode;
  confirmText?: string;
  eyebrow?: string;
};

export type DialogContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  prompt: (
    options: PromptOptions | string,
    defaultVal?: string,
  ) => Promise<string | null>;
  alert: (options: AlertOptions | string) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogState =
  | {
      type: "confirm";
      options: ConfirmOptions;
      resolve: (val: boolean) => void;
    }
  | {
      type: "prompt";
      options: PromptOptions;
      value: string;
      resolve: (val: string | null) => void;
    }
  | { type: "alert"; options: AlertOptions; resolve: () => void }
  | null;

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions | string): Promise<boolean> => {
      const opts: ConfirmOptions =
        typeof options === "string"
          ? {
              title: options,
              danger: /excluir|remover|limpar|apagar|deletar/i.test(options),
            }
          : options;
      return new Promise<boolean>((resolve) => {
        setDialog({ type: "confirm", options: opts, resolve });
      });
    },
    [],
  );

  const prompt = useCallback(
    (
      options: PromptOptions | string,
      defaultVal = "",
    ): Promise<string | null> => {
      const opts: PromptOptions =
        typeof options === "string"
          ? { title: options, defaultValue: defaultVal }
          : options;
      return new Promise<string | null>((resolve) => {
        setDialog({
          type: "prompt",
          options: opts,
          value: opts.defaultValue ?? defaultVal,
          resolve,
        });
      });
    },
    [],
  );

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    const opts: AlertOptions =
      typeof options === "string" ? { title: options } : options;
    return new Promise<void>((resolve) => {
      setDialog({ type: "alert", options: opts, resolve });
    });
  }, []);

  useEffect(() => {
    if (dialog?.type === "prompt") {
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [dialog?.type]);

  const handleClose = () => {
    if (!dialog) return;
    if (dialog.type === "confirm") dialog.resolve(false);
    else if (dialog.type === "prompt") dialog.resolve(null);
    else if (dialog.type === "alert") dialog.resolve();
    setDialog(null);
  };

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.type === "confirm") dialog.resolve(true);
    else if (dialog.type === "prompt") dialog.resolve(dialog.value.trim());
    else if (dialog.type === "alert") dialog.resolve();
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {dialog && (
        <div
          className="modal-backdrop custom-dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleClose();
            if (e.key === "Enter" && dialog.type !== "prompt") handleConfirm();
          }}
        >
          <section
            className="modal custom-dialog-modal"
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-header">
              <div>
                <span className="eyebrow custom-dialog-eyebrow">
                  {dialog.type === "confirm" ? (
                    <>
                      <HelpCircle size={14} />{" "}
                      {dialog.options.eyebrow || "CONFIRMAÇÃO"}
                    </>
                  ) : dialog.type === "prompt" ? (
                    <>
                      <HelpCircle size={14} />{" "}
                      {dialog.options.eyebrow || "INFORMAÇÃO"}
                    </>
                  ) : (
                    <>
                      <Info size={14} /> {dialog.options.eyebrow || "AVISO"}
                    </>
                  )}
                </span>
                <h2>{dialog.options.title}</h2>
              </div>
              <button
                className="icon-button"
                onClick={handleClose}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {dialog.options.message && (
              <div className="custom-dialog-message">
                {typeof dialog.options.message === "string" ? (
                  <p>{dialog.options.message}</p>
                ) : (
                  dialog.options.message
                )}
              </div>
            )}

            {dialog.type === "prompt" && (
              <form
                className="custom-dialog-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
              >
                <input
                  ref={inputRef}
                  value={dialog.value}
                  placeholder={dialog.options.placeholder || "Digite aqui..."}
                  onChange={(e) =>
                    setDialog({ ...dialog, value: e.target.value })
                  }
                  maxLength={160}
                  required
                />
              </form>
            )}

            <footer className="custom-dialog-actions">
              {dialog.type !== "alert" && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleClose}
                >
                  {dialog.type === "confirm"
                    ? dialog.options.cancelText || "Cancelar"
                    : dialog.options.cancelText || "Cancelar"}
                </button>
              )}
              <button
                type="button"
                className={`primary-button ${dialog.type === "confirm" && dialog.options.danger ? "danger-button" : ""}`}
                onClick={handleConfirm}
              >
                {dialog.type === "confirm"
                  ? dialog.options.confirmText ||
                    (dialog.options.danger ? "Confirmar" : "Sim")
                  : dialog.type === "prompt"
                    ? dialog.options.confirmText || "Salvar"
                    : dialog.options.confirmText || "OK"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog deve ser usado dentro de um DialogProvider");
  }
  return context;
}
