import { loadSession } from "./auth";

export type AnalyticsEventName =
  | "page_view"
  | "login_success"
  | "login_fail"
  | "register_submit"
  | "register_approved"
  | "post_create"
  | "community_post_create"
  | "like"
  | "comment"
  | "pagination_click"
  | "search"
  | "filter_apply"
  | "report_submit"
  | "topic_follow"
  | "ai_call"
  | "ai_fallback"
  | "promotion_impression"
  | "promotion_click";

export interface AnalyticsEvent {
  id: string;
  event: AnalyticsEventName;
  time: string;
  userId: string;
  page: string;
  props?: Record<string, unknown>;
}

const EVENTS_KEY = "campus-analytics-events-v1";
const MAX_EVENTS = 1000;

export function loadAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function track(
  event: AnalyticsEventName,
  props?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const session = loadSession();
  const record: AnalyticsEvent = {
    id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    event,
    time: new Date().toISOString(),
    userId: session?.studentId ?? "anonymous",
    page: window.location.pathname,
    props,
  };
  const list = [record, ...loadAnalyticsEvents()].slice(0, MAX_EVENTS);
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearAnalyticsEvents(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(EVENTS_KEY);
}

export interface AnalyticsSummary {
  total: number;
  today: number;
  byName: { event: AnalyticsEventName; count: number }[];
  recent: AnalyticsEvent[];
}

export function summarizeEvents(
  events = loadAnalyticsEvents(),
): AnalyticsSummary {
  const todayKey = new Date().toDateString();
  const counts = new Map<AnalyticsEventName, number>();
  let today = 0;

  events.forEach((event) => {
    counts.set(event.event, (counts.get(event.event) ?? 0) + 1);
    if (new Date(event.time).toDateString() === todayKey) {
      today += 1;
    }
  });

  return {
    total: events.length,
    today,
    byName: Array.from(counts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((left, right) => right.count - left.count),
    recent: events.slice(0, 50),
  };
}
