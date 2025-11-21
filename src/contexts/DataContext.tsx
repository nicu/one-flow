import { createContext, useContext } from "react";
import type { DataStore } from "../store/dataStore";

export interface DataContextValue {
  dataStore: DataStore;
  setDataStore?: (s: DataStore) => void;
  currentItem?: any; // The current item when rendering inside a list
  currentModelId?: string; // The model ID of the current item
}

export const DataContext = createContext<DataContextValue | null>(null);

export const useDataContext = () => {
  return useContext(DataContext);
};
