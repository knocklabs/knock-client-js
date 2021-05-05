import create from "zustand/vanilla";
import { FeedItem, StoreState } from "./types";

function sortItems(items: FeedItem[]) {
  return items.sort((a, b) => {
    return (
      new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
    );
  });
}

export default function createStore() {
  return create<StoreState>((set, get) => ({
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
        items: sortItems(entries),
        metadata: meta,
        loading: false,
      })),
    prependItems: ({ entries, meta }) =>
      set((state) => {
        let newItems = state.items;
        newItems.unshift(...entries);
        return { items: sortItems(newItems), metadata: meta, loading: false };
      }),
    appendItems: ({ entries, meta }) =>
      set((state) => {
        const newItems = state.items.concat(entries);
        return { items: sortItems(newItems), metadata: meta, loading: false };
      }),
    setMetadata: (metadata) => set((state) => ({ metadata })),
    setItemAttrs: (itemIds, attrs) => {
      // Create a map for the items to the updates to be made
      const itemUpdatesMap: { [id: string]: object } = itemIds.reduce(
        (acc, itemId) => ({ ...acc, [itemId]: attrs }),
        {}
      );

      return set((state) => {
        const items = state.items.map((item) => {
          if (itemUpdatesMap[item.id]) {
            return { ...item, ...itemUpdatesMap[item.id] };
          }

          return item;
        });

        return { items };
      });
    },
  }));
}
