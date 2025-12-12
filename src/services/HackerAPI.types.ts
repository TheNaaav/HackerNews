export interface HNHit {
  objectID: string;
  title: string | null;
  story_title: string | null;
  url: string | null;
  story_url: string | null;
  points: number | null;
  created_at: string;
  author: string;
}

export interface HNSearchResponse {
  hits: HNHit[];
  page: number;
  nbPages: number;
}

export type SortMode = "relevance" | "points" | "time";