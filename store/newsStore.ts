import { create } from 'zustand';
export interface StateProps {
  query: string;
  setNewsQuery: (query: string) => void;
  sortType: 'rating' | 'date';
  setSortType: (type: 'rating' | 'date') => void;
}

export const useNewsStore = create<StateProps>((set) => ({
  query: "",
  setNewsQuery: (query) => set({ query }),
  sortType: "date",
  setSortType: (type: 'rating' | 'date') => set({ sortType: type })
}));
