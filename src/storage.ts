import { emptyData, isBackupData, normalizeData, type AppData } from "./data";

const DB_NAME = "omnidesk";
const DEMO_DB_NAME = import.meta.env.DEV ? "omnidesk-demo" : DB_NAME;
export const DEV_DEMO_KEY = import.meta.env.DEV ? "omnidesk-dev-demo-mode" : "";
const DB_VERSION = 6;
const entityStores = ["subjects", "assignments", "flashcards", "notebooks", "notes", "checklists", "checklistSections", "checklistItems", "timers", "stats", "teams", "resources", "questions", "simulations", "simulationAttempts", "scheduleEntries"] as const;
const allStores = ["meta", ...entityStores] as const;

export const isDevDemoMode = () => import.meta.env.DEV && localStorage.getItem(DEV_DEMO_KEY) === "1";
// Fixa o banco durante toda a sessão. Ao sair do modo demo, eventos pagehide ainda
// gravam no banco demo; a página seguinte então abre o banco normal intacto.
const ACTIVE_DATABASE_NAME = isDevDemoMode() ? DEMO_DB_NAME : DB_NAME;

function openDatabase(name = ACTIVE_DATABASE_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains("tasks")) database.deleteObjectStore("tasks");
      if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta");
      entityStores.forEach((name) => {
        if (!database.objectStoreNames.contains(name)) {
          const store = database.createObjectStore(name, { keyPath: "id" });
          if (["assignments", "flashcards", "notebooks", "notes", "checklists", "timers", "stats", "resources", "questions", "scheduleEntries"].includes(name)) store.createIndex("subjectId", "subjectId", { unique: false });
          if (["checklistSections", "checklistItems"].includes(name)) store.createIndex("checklistId", "checklistId", { unique: false });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o banco local."));
  });
}

const requestValue = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

export async function loadAppData(): Promise<AppData> {
  const database = await openDatabase();
  const meta = await requestValue(database.transaction("meta", "readonly").objectStore("meta").get("settings"));
  if (meta) {
    const transaction = database.transaction([...entityStores], "readonly");
    const collections = await Promise.all(entityStores.map((store) => requestValue(transaction.objectStore(store).getAll())));
    database.close();
    const entities = Object.fromEntries(entityStores.map((store, index) => [store, collections[index]]));
    return normalizeData({ ...(meta as AppData), ...entities });
  }

  // Migração da versão inicial, que utilizava um único registro.
  let legacy: unknown;
  if (database.objectStoreNames.contains("app")) legacy = await requestValue(database.transaction("app", "readonly").objectStore("app").get("data"));
  database.close();
  const migrated = legacy && typeof legacy === "object" ? normalizeData(legacy as Partial<AppData>) : structuredClone(emptyData);
  localStorage.removeItem("omnidesk-data");
  if (legacy) await saveAppData(migrated);
  return migrated;
}

async function saveToDatabase(data: AppData, databaseName = ACTIVE_DATABASE_NAME): Promise<void> {
  const database = await openDatabase(databaseName);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([...allStores], "readwrite");
    const { subjects, assignments, flashcards, notebooks, notes, checklists, checklistSections, checklistItems, timers, stats, teams, resources, questions, simulations, simulationAttempts, scheduleEntries, ...meta } = data;
    transaction.objectStore("meta").put(meta, "settings");
    const collections = { subjects, assignments, flashcards, notebooks, notes, checklists, checklistSections, checklistItems, timers, stats, teams, resources, questions, simulations, simulationAttempts, scheduleEntries };
    entityStores.forEach((name) => { const store = transaction.objectStore(name); store.clear(); collections[name].forEach((item) => store.put(item)); });
    transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export async function saveAppData(data: AppData): Promise<void> {
  await saveToDatabase(data);
}

export async function saveDevDemoData(data: AppData): Promise<void> {
  if (!import.meta.env.DEV) throw new Error("O ambiente de demonstração só existe em desenvolvimento.");
  await saveToDatabase(normalizeData(data), DEMO_DB_NAME);
}

export function downloadBackup(data: AppData) {
  const payload = JSON.stringify({ application: "OmniDesk", schemaVersion: 6, exportedAt: new Date().toISOString(), data }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" })); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `omnidesk-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
}

export async function readBackup(file: File): Promise<AppData> {
  if (file.size > 100_000_000) throw new Error("O arquivo excede o limite de 100 MB.");
  const parsed: unknown = JSON.parse(await file.text());
  const candidate = parsed && typeof parsed === "object" && "data" in parsed ? (parsed as { data: unknown }).data : parsed;
  if (!isBackupData(candidate)) throw new Error("Este arquivo não é um backup válido do OmniDesk.");
  return normalizeData({ ...candidate, onboarded: true });
}

export async function requestPersistentStorage() { if (navigator.storage?.persist) await navigator.storage.persist(); }
export async function storageUsage(): Promise<StorageEstimate> { return navigator.storage?.estimate ? navigator.storage.estimate() : { usage: 0, quota: 0 }; }
