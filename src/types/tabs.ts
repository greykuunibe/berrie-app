export type TabType = "home" | "bible-library" | "reader" | "notes-list" | "note";

export type TabParams = Record<string, string>;

export interface Tab {
  id: string;
  type: TabType;
  label: string;
  params: TabParams;
}

export type TabDescriptor = Omit<Tab, "id">;
