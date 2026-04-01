import "./assets/main.scss";

import { AxiosError } from "axios";
import { searchNews } from "./services/HackerAPI";
import type { HNHit, SortMode } from "./services/HackerAPI.types";



/**
 * DOM references
 */

const listEl = document.querySelector<HTMLUListElement>("#news")!;
const searchFormEl = document.querySelector<HTMLFormElement>("#search-form")!;
const queryEl = document.querySelector<HTMLInputElement>("#query")!;
const sortEl = document.querySelector<HTMLSelectElement>("#sort")!;
const prevBtn = document.querySelector<HTMLButtonElement>("#prev")!;
const nextBtn = document.querySelector<HTMLButtonElement>("#next")!;
const pageLabel = document.querySelector<HTMLSpanElement>("#page-label")!;


/**
 * Local copy containing all news from the server
 */
let hits: HNHit[] = [];
/**
 * Local state
 */
let query = "";
let page = 0;
let sort: SortMode = "time";
let nbPages = 0;

// Helper function to prevent XSS (Cross-Site Scripting)
const escapeHtml = (unsafeText: string) => {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Error handler
const handleError = (err: unknown) => {
	if (err instanceof AxiosError) {
		// Axios status is usually inside err.response
		alert("Network error, response code was: " + err.response?.status);
		console.log("Network Error thrown:", err);

	} else if (err instanceof Error) {
		alert("Something went wrong: " + err.message);
		console.log(err);

	} else {
		alert("Something unexpected happened. Please try not to break stuff.");
		console.log("Unexpected error:", err);
	}
}

// localStorage

const saveState = () => {
  localStorage.setItem("hn_state", JSON.stringify({ query, page, sort }));
}

const loadState = () => {
  const raw = localStorage.getItem("hn_state");
  if (!raw) return;

  try {
    const s = JSON.parse(raw) as Partial<{
      query: string;
      page: number;
      nbPages: number;
      sort: SortMode;
    }>;
    if (typeof s.query === "string") query = s.query;
    if (typeof s.page === "number") page = s.page;
    if (s.sort === "relevance" || s.sort === "points" || s.sort === "time") sort = s.sort;
  } catch (err) {
    handleError(err);
  }
}

// Get News from API and render them
const getNewsAndRender = async() => {
  try {
    const data = await searchNews(query, page, sort);
    hits = data.hits;
    nbPages = data.nbPages;

    renderNews();
    saveState();
  } catch (err) {
    handleError(err);
  }
}

const renderNews = () => {
  let displayHits = hits;
  
  // Create a copy [...hits] to avoid mutating the original state array
  if (sort === "points") {
    displayHits = [...hits].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  } else if (sort === "time") {
    displayHits = [...hits].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  listEl.innerHTML = displayHits
    .map(hit => {
      const title = hit.title ?? hit.story_title ?? "(no title)";
      const url = hit.url || hit.story_url;
      const points = hit.points ?? 0;
      const time = new Date(hit.created_at).toLocaleString();

      return `<li class="news-item">
        <article>
          <a class="news-title" href="${url}" target="_blank" rel="noopener noreferrer">
            <h2>${escapeHtml(title)}</h2>
          </a>
          <div class="news-meta">
            <span class="meta-item">⭐ ${points} poäng</span>
            <span class="meta-item">🕒 ${time}</span>
            <span class="meta-item">👤 ${escapeHtml(hit.author)}</span>
          </div>
        </article>
      </li>`;
    })
    .join("");
  
  // Pager UI
  prevBtn.disabled = page <= 0;
  nextBtn.disabled = page >= nbPages - 1;
  pageLabel.textContent = `Page ${page + 1} / ${nbPages}`;
}

searchFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  query = queryEl.value.trim();
  sort = sortEl.value as SortMode;
  page = 0; // reset to first page on new search
  getNewsAndRender();
});

sortEl.addEventListener("change", () => {
  sort = sortEl.value as SortMode;
  page = 0; // reset to first page on sort change
  getNewsAndRender();
});

prevBtn.addEventListener("click", () => {
  if (page > 0) {
    page--;
    getNewsAndRender();
  }
});

nextBtn.addEventListener("click", () => {
  if (page < nbPages - 1) {
    page++;
    getNewsAndRender();
  }
});

loadState();
queryEl.value = query;
sortEl.value = sort;
getNewsAndRender();