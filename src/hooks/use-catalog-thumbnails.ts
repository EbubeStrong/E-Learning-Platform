"use client";

import { useEffect, useState } from "react";

export type CatalogThumbnail = { thumbnail?: string; imageAlt?: string };

/**
 * Resolves course thumbnails from the YouTube catalog at read time, so cards
 * backed by the Convex `courses` table show real cover art even before the
 * admin catalog sync has persisted thumbnails. Returns a map keyed by course
 * id, or `{}` when the catalog is unreachable (UI falls back to placeholders).
 */
export function useCatalogThumbnails(): Record<string, CatalogThumbnail> | undefined {
  const [thumbnails, setThumbnails] = useState<Record<string, CatalogThumbnail>>();

  useEffect(() => {
    let active = true;
    fetch("/api/courses/thumbnails")
      .then((response) => response.json())
      .then((data: { thumbnails?: Record<string, CatalogThumbnail> }) => {
        if (active) setThumbnails(data.thumbnails ?? {});
      })
      .catch(() => {
        if (active) setThumbnails({});
      });
    return () => {
      active = false;
    };
  }, []);

  return thumbnails;
}