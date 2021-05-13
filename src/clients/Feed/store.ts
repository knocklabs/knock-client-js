import create from "zustand/vanilla";
import { FeedItem } from "./interfaces";
import { FeedStoreState } from "./types";
import { deduplicateItems, sortItems } from "./utils";

function processItems(items: FeedItem[]) {
  const deduped = deduplicateItems(items);
  const sorted = sortItems(deduped);

  return sorted;
}

const defaultSetResultOptions = {
  shouldSetPage: true,
  shouldAppend: false,
};

export default function createStore() {
  return create<FeedStoreState>((set) => ({
    items: [],
    loading: false,
    // Keeps track of the current badge counts
    metadata: {
      total_count: 0,
      unread_count: 0,
      unseen_count: 0,
    },
    // Keeps track of the last full page of results we received (for paginating)
    pageInfo: {
      before: null,
      after: null,
      page_size: 50,
    },
    setLoading: (loading) => set(() => ({ loading })),

    setResult: (
      { entries, meta, page_info },
      options = defaultSetResultOptions,
    ) =>
      set((state) => {
        // We resort the list on set, so concating everything is fine (if a bit suboptimal)
        const items = options.shouldAppend
          ? processItems(state.items.concat(entries))
          : entries;

        return {
          items,
          metadata: meta,
          pageInfo: options.shouldSetPage ? page_info : state.pageInfo,
          loading: false,
        };
      }),

    setMetadata: (metadata) => set(() => ({ metadata })),
    setItemAttrs: (itemIds, attrs) => {
      // Create a map for the items to the updates to be made
      const itemUpdatesMap: { [id: string]: object } = itemIds.reduce(
        (acc, itemId) => ({ ...acc, [itemId]: attrs }),
        {},
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
