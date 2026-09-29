import { useEffect } from "react";

const BASE = "XQuation";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const prev = document.title;
    if (title) {
      document.title = `${title} | ${BASE}`;
    } else {
      document.title = BASE;
    }
    return () => { document.title = prev; };
  }, [title]);
}
