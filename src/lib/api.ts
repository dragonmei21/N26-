import {
  mockFeedResponse,
  mockTrendsResponse,
  mockSpendMapResponse,
  mockELI10Responses,
  type FeedResponse,
  type TrendsResponse,
  type SpendMapResponse,
  type ELI10Response,
  type Article,
} from "@/data/feedData";

const BASE_URL = "http://localhost:8000";

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function getFeed(userId = "mock_user_1"): Promise<FeedResponse> {
  return fetchWithFallback(`${BASE_URL}/feed?user_id=${userId}`, mockFeedResponse);
}

export async function getTrends(): Promise<TrendsResponse> {
  return fetchWithFallback(`${BASE_URL}/trends`, mockTrendsResponse);
}

export async function getSpendMap(userId = "mock_user_1"): Promise<SpendMapResponse> {
  return fetchWithFallback(`${BASE_URL}/spend-map?user_id=${userId}`, mockSpendMapResponse);
}

export async function getInsight(articleId: string): Promise<Article | null> {
  const fallback = mockFeedResponse.articles.find((a) => a.id === articleId) ?? null;
  return fetchWithFallback(`${BASE_URL}/insight/${articleId}`, fallback);
}

export async function getELI10(concept: string): Promise<ELI10Response> {
  const fallback = mockELI10Responses[concept] ?? {
    concept,
    title: concept.charAt(0).toUpperCase() + concept.slice(1),
    icon: "💡",
    eli10: `${concept} is a key financial concept. Ask Team A to add an ELI10 for this one!`,
    related_investments: [],
  };
  return fetchWithFallback(`${BASE_URL}/eli10/${concept}`, fallback);
}
