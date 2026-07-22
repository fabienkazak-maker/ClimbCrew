import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import type { AppData } from "../domain/types";

export interface DataContextValue {
  data: AppData;
  setData: Dispatch<SetStateAction<AppData>>;
  syncStatus: string;
  setSyncStatus: Dispatch<SetStateAction<string>>;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function useClimbData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error("DataContext absent");
  return value;
}
