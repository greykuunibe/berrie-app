import { useEffect } from "react";
import { useResourcesStore } from "@/stores/resources.store";

export function useResources() {
  const store = useResourcesStore();

  // Auto-load commentaries on first use
  useEffect(() => {
    if (store.commentaries.length === 0) {
      store.loadCommentaries();
    }
  }, []);

  return store;
}
