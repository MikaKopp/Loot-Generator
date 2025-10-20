import { useEffect, useState } from "react";
import type { ItemData } from "../types";

type ItemDataMap = Record<string, ItemData[]>;

/**
 *Internal global item store
 */
let itemStore: ItemDataMap = {};
const subscribers = new Set<() => void>();

function notifySubscribers() {
  for (const cb of subscribers) cb();
}

/**
 * Load item data from JSON file path or uploaded file.
 * Defaults to /data/magic_items.json.
 */
export async function loadItemData(filePath?: string): Promise<ItemDataMap> {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const path = filePath ?? `${base}data/magic_items.json`;
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Could not fetch item data from ${path} — status ${response.status}`);
      return {};
    }
    const json = await response.json();
    itemStore = ensureAllCategories(json);
    notifySubscribers();
    return itemStore;
  } catch (err) {
    console.error("Failed to load item data:", err);
    return {};
  }
}

/**
 * Ensures all categories are valid arrays.
 */
export function ensureAllCategories(data: Record<string, any>): ItemDataMap {
  const cleanData: ItemDataMap = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) cleanData[key] = value as ItemData[];
  }
  return cleanData;
}

/**
 * ➕ Adds or replaces an item inside the appropriate category.
 */
export function addOrReplaceItem(data: ItemDataMap, item: ItemData): ItemDataMap {
  const updated = structuredClone(data ?? {});
  if (!updated[item.type]) updated[item.type] = [];
  const index = updated[item.type].findIndex((i) => i.name.toLowerCase() === item.name.toLowerCase());
  if (index >= 0) updated[item.type][index] = item;
  else updated[item.type].push(item);
  itemStore = updated;
  notifySubscribers();
  return updated;
}

/**
 * Adds a new empty category, with validation for safe names.
 */
export function addCategory(data: ItemDataMap, categoryName: string): ItemDataMap {
  const updated = structuredClone(data ?? {});
  const cleanName = categoryName.trim();

  if (!cleanName) {
    console.warn("Attempted to add an empty category name.");
    return data;
  }
  if (!/^[\w\s()\-]+$/.test(cleanName)) {
    console.warn(`Invalid category name '${cleanName}'. Use letters, numbers, spaces, (), or - only.`);
    return data;
  }

  if (!updated[cleanName]) updated[cleanName] = [];
  itemStore = updated;
  notifySubscribers();
  return updated;
}

/**
 * Renames an existing category.
 */
export function renameCategory(data: ItemDataMap, oldName: string, newName: string): ItemDataMap {
  const updated = structuredClone(data ?? {});
  const cleanNewName = newName.trim();

  if (!updated[oldName]) return data;
  if (!cleanNewName || !/^[\w\s()\-]+$/.test(cleanNewName)) {
    console.warn(`Invalid category name '${cleanNewName}'`);
    return data;
  }

  updated[cleanNewName] = updated[oldName];
  delete updated[oldName];

  // Update item types inside that category
  updated[cleanNewName].forEach((item) => (item.type = cleanNewName));

  itemStore = updated;
  notifySubscribers();
  return updated;
}

/**
 * Deletes a category entirely.
 */
export function deleteCategory(data: ItemDataMap, categoryName: string): ItemDataMap {
  const updated = structuredClone(data ?? {});
  if (updated[categoryName]) {
    delete updated[categoryName];
    itemStore = updated;
    notifySubscribers();
  }
  return updated;
}

/**
 * Deletes a single item by name and category.
 */
export function deleteItem(data: ItemDataMap, name: string, type: string): ItemDataMap {
  const updated = structuredClone(data ?? {});
  if (updated[type]) {
    updated[type] = updated[type].filter((i) => i.name.toLowerCase() !== name.toLowerCase());
    itemStore = updated;
    notifySubscribers();
  }
  return updated;
}

/**
 * Downloads current data as JSON.
 */
export function downloadItemDataFile(data: ItemDataMap, filename = "magic_items.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Returns the current in-memory item data.
 */
export function getAllData(): ItemDataMap {
  return itemStore;
}

/**
 * Replaces the in-memory data and notifies subscribers.
 * Used when resetting to defaults or uploading a new JSON.
 */
export function setAllData(newData: ItemDataMap) {
  itemStore = ensureAllCategories(newData);
  notifySubscribers();
}

/**
 * React hook that auto-updates when item data changes.
 */
export function useItemData(): ItemDataMap {
  const [data, setData] = useState<ItemDataMap>(() => itemStore);

  useEffect(() => {
    const listener = () => setData({ ...itemStore });
    subscribers.add(listener);
    if (Object.keys(itemStore).length === 0) {
      loadItemData(); // Lazy-load if empty
    }
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return data;
}
