import { mockPosts } from "./mock-data";
import {
  seedCommunityComments,
  seedCommunityPosts,
  seedTopics,
} from "./community-data";
import type {
  Application,
  CommunityComment,
  CommunityInvite,
  CommunityPost,
  CommunityReport,
  CommunityStatus,
  CommunityTopic,
  Intent,
  Post,
  Profile,
  Promotion,
  Report,
} from "./types";

const POSTS_KEY = "campus-mutual-aid-posts-v1";
const PROFILE_KEY = "campus-mutual-aid-profile-v1";
const INTENT_KEY = "campus-mutual-aid-intents-v1";
const REPORT_KEY = "campus-mutual-aid-reports-v1";
const APPLICATION_KEY = "campus-mutual-aid-applications-v1";
const COMMUNITY_TOPICS_KEY = "campus-community-topics-v1";
const COMMUNITY_POSTS_KEY = "campus-community-posts-v1";
const COMMUNITY_COMMENTS_KEY = "campus-community-comments-v1";
const COMMUNITY_REPORTS_KEY = "campus-community-reports-v1";
const COMMUNITY_INVITE_KEY = "campus-community-invite-v1";
const COMMUNITY_LIKES_KEY = "campus-community-likes-v1";
const FOLLOWED_TOPICS_KEY = "campus-followed-topics-v1";
const PROMOTIONS_KEY = "campus-promotions-v1";

const MAX_RENEWALS = 3;
const MAX_TOTAL_MINUTES = 129600; // 90 天

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function loadLocalPosts(): Post[] {
  const now = Date.now();
  return readArray<Post>(POSTS_KEY).map((post) => {
    const endValid =
      typeof post.displayEndAt === "string" &&
      !Number.isNaN(new Date(post.displayEndAt).getTime());
    if (endValid && typeof post.displayStartAt === "string") {
      return post;
    }
    return {
      ...post,
      displayStartAt: post.displayStartAt ?? new Date(now).toISOString(),
      displayEndAt: endValid
        ? post.displayEndAt
        : new Date(now + 7 * 24 * 3600_000).toISOString(),
      durationMinutes: post.durationMinutes ?? 10080,
    };
  });
}

export function loadPosts(): Post[] {
  return [...loadLocalPosts(), ...mockPosts];
}

export function addPost(post: Post): void {
  writeArray(POSTS_KEY, [post, ...loadLocalPosts()]);
}

export function renewPost(postId: string, extraMinutes: number): Post | null {
  const saved = loadLocalPosts();
  const index = saved.findIndex((post) => post.id === postId);
  if (index === -1) {
    return null;
  }

  const current = saved[index];
  const renewCount = current.renewCount ?? 0;
  const duration = current.durationMinutes ?? extraMinutes;
  const totalMinutes = duration * (renewCount + 1);

  if (renewCount >= MAX_RENEWALS || totalMinutes >= MAX_TOTAL_MINUTES) {
    return null;
  }

  const now = Date.now();
  const baseTime = Math.max(new Date(current.displayEndAt).getTime(), now);
  const updated: Post = {
    ...current,
    displayEndAt: new Date(baseTime + extraMinutes * 60_000).toISOString(),
    renewCount: renewCount + 1,
  };
  saved[index] = updated;
  writeArray(POSTS_KEY, saved);
  return updated;
}

export function updatePostModeration(
  postId: string,
  status: "approved" | "pending" | "rejected",
): void {
  const saved = loadLocalPosts();
  const index = saved.findIndex((post) => post.id === postId);
  if (index === -1) {
    return;
  }
  saved[index] = { ...saved[index], moderationStatus: status };
  writeArray(POSTS_KEY, saved);
}

export function addApplication(
  application: Omit<Application, "id" | "createdAt" | "status">,
): Application {
  const record: Application = {
    ...application,
    id: `app-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeArray(APPLICATION_KEY, [record, ...loadApplications()]);
  return record;
}

export function loadApplications(): Application[] {
  return readArray<Application>(APPLICATION_KEY).map((application) => ({
    ...application,
    applicantSkills: application.applicantSkills ?? [],
  }));
}

export function loadApplicationsByApplicant(studentId: string): Application[] {
  return loadApplications().filter(
    (application) => application.applicantId === studentId,
  );
}

export function updateApplicationStatus(
  id: string,
  status: Application["status"],
): void {
  const applications = loadApplications().map((application) =>
    application.id === id ? { ...application, status } : application,
  );
  writeArray(APPLICATION_KEY, applications);
}

export function addIntent(postId: string): void {
  const intents = readArray<Intent>(INTENT_KEY);
  if (intents.some((intent) => intent.postId === postId)) {
    return;
  }
  writeArray(INTENT_KEY, [
    { postId, createdAt: new Date().toISOString() },
    ...intents,
  ]);
}

export function loadIntents(): Intent[] {
  return readArray<Intent>(INTENT_KEY);
}

export function addReport(
  postId: string,
  reason: string,
  reporter?: { id?: string; name?: string },
): void {
  writeArray(REPORT_KEY, [
    {
      postId,
      reason,
      createdAt: new Date().toISOString(),
      reporterId: reporter?.id,
      reporterName: reporter?.name,
    },
    ...readArray<Report>(REPORT_KEY),
  ]);
}

export function loadReports(): Report[] {
  return readArray<Report>(REPORT_KEY);
}

export function loadPromotions(): Promotion[] {
  return readArray<Promotion>(PROMOTIONS_KEY);
}

export function addPromotion(promotion: Promotion): void {
  writeArray(PROMOTIONS_KEY, [promotion, ...loadPromotions()]);
}

export function updatePromotion(
  id: string,
  patch: Partial<Promotion>,
): void {
  writeArray(
    PROMOTIONS_KEY,
    loadPromotions().map((promotion) =>
      promotion.id === id ? { ...promotion, ...patch } : promotion,
    ),
  );
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      name: parsed.name ?? "",
      major: parsed.major ?? "",
      grade: parsed.grade ?? "",
      gender: parsed.gender ?? "",
      age: parsed.age ?? "",
      mbti: parsed.mbti ?? "",
      mood: parsed.mood ?? "😀",
      signature: parsed.signature ?? "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function loadCommunityTopics(): CommunityTopic[] {
  const stored = readArray<CommunityTopic>(COMMUNITY_TOPICS_KEY);
  const ids = new Set(stored.map((topic) => topic.id));
  return [...stored, ...seedTopics.filter((topic) => !ids.has(topic.id))];
}

export function addCommunityTopic(topic: CommunityTopic): void {
  writeArray(COMMUNITY_TOPICS_KEY, [
    topic,
    ...readArray<CommunityTopic>(COMMUNITY_TOPICS_KEY),
  ]);
}

export function loadCommunityPosts(): CommunityPost[] {
  const stored = readArray<CommunityPost>(COMMUNITY_POSTS_KEY);
  const ids = new Set(stored.map((post) => post.id));
  return [...stored, ...seedCommunityPosts.filter((post) => !ids.has(post.id))];
}

export function addCommunityPost(post: CommunityPost): void {
  writeArray(COMMUNITY_POSTS_KEY, [
    post,
    ...readArray<CommunityPost>(COMMUNITY_POSTS_KEY),
  ]);
}

export function updateCommunityPostStatus(
  id: string,
  status: CommunityStatus,
): void {
  const posts = readArray<CommunityPost>(COMMUNITY_POSTS_KEY).map((post) =>
    post.id === id ? { ...post, status } : post,
  );
  writeArray(COMMUNITY_POSTS_KEY, posts);
}

export function deleteCommunityPost(id: string): void {
  writeArray(
    COMMUNITY_POSTS_KEY,
    readArray<CommunityPost>(COMMUNITY_POSTS_KEY).filter(
      (post) => post.id !== id,
    ),
  );
}

export function loadCommunityComments(): CommunityComment[] {
  const stored = readArray<CommunityComment>(COMMUNITY_COMMENTS_KEY);
  const ids = new Set(stored.map((comment) => comment.id));
  return [
    ...stored,
    ...seedCommunityComments.filter((comment) => !ids.has(comment.id)),
  ];
}

export function addCommunityComment(comment: CommunityComment): void {
  writeArray(COMMUNITY_COMMENTS_KEY, [
    comment,
    ...readArray<CommunityComment>(COMMUNITY_COMMENTS_KEY),
  ]);
}

export function addCommunityReport(report: CommunityReport): void {
  writeArray(COMMUNITY_REPORTS_KEY, [
    report,
    ...readArray<CommunityReport>(COMMUNITY_REPORTS_KEY),
  ]);
}

export function loadCommunityReports(): CommunityReport[] {
  return readArray<CommunityReport>(COMMUNITY_REPORTS_KEY);
}

export function loadCommunityLikes(): Record<string, boolean> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(COMMUNITY_LIKES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function toggleCommunityLike(postId: string): boolean {
  const likes = loadCommunityLikes();
  const next = !likes[postId];
  if (next) {
    likes[postId] = true;
  } else {
    delete likes[postId];
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(COMMUNITY_LIKES_KEY, JSON.stringify(likes));
    } catch {
      // ignore
    }
  }
  return next;
}

export function loadFollowedTopics(): string[] {
  return readArray<string>(FOLLOWED_TOPICS_KEY);
}

export function toggleFollowedTopic(topicId: string): boolean {
  const followed = loadFollowedTopics();
  const next = !followed.includes(topicId);
  writeArray(
    FOLLOWED_TOPICS_KEY,
    next ? [topicId, ...followed] : followed.filter((id) => id !== topicId),
  );
  return next;
}

export function loadCommunityInvite(): CommunityInvite | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(COMMUNITY_INVITE_KEY);
    return raw ? (JSON.parse(raw) as CommunityInvite) : null;
  } catch {
    return null;
  }
}

export function saveCommunityInvite(invite: CommunityInvite): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(COMMUNITY_INVITE_KEY, JSON.stringify(invite));
  } catch {
    // ignore
  }
}
