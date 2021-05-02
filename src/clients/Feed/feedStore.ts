import create from "zustand/vanilla";
import { FeedMetadata, FeedResponse, FeedItem } from "./types";

export type State = {
  items: FeedItem[];
  metadata: FeedMetadata;
  loading: boolean;
  setResult: (response: FeedResponse) => void;
  prependItems: (response: FeedResponse) => void;
  appendItems: (response: FeedResponse) => void;
  setMetadata: (metadata: FeedMetadata) => void;
  setLoading: (loading: boolean) => void;
};

export default function createStore() {
  return create<State>((set, get) => ({
    items: [],
    loading: false,
    metadata: {
      total_count: 0,
      unread_count: 0,
      unseen_count: 0,
    },
    setLoading: (loading) => set(() => ({ loading })),
    setResult: ({ entries, meta }) =>
      set((state) => ({
        items: entries,
        metadata: meta,
        loading: false,
      })),
    prependItems: ({ entries, meta }) =>
      set((state) => {
        let newItems = state.items;
        newItems.unshift(...entries);
        return { items: newItems, metadata: meta, loading: false };
      }),
    appendItems: ({ entries, meta }) =>
      set((state) => {
        const newItems = state.items.concat(entries);
        return { items: newItems, metadata: meta, loading: false };
      }),
    setMetadata: (metadata) => set((state) => ({ metadata })),
  }));
}
