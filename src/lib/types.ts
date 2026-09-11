// 兼容旧命名：PostType 现在存储的是标签 ID（tag id）
export type PostType = string;

export type PostStatus = "open" | "matched" | "closed";

export interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  skills: string[];
  customTag?: string;
  majorPreference?: string;
  gradePreference?: string;
  authorName: string;
  authorMajor: string;
  authorGrade: string;
  createdAt: string;
  status: PostStatus;
  displayStartAt: string;
  displayEndAt: string;
  durationMinutes?: number;
  renewCount?: number;
  ownerId?: string;
  moderationStatus?: "approved" | "pending" | "rejected";
  moderationReasons?: string[];
}

export interface MatchResult {
  postId: string;
  name: string;
  major: string;
  grade: string;
  category: string;
  reason: string;
  source: string[];
  score: number;
  /** 三段式解释：共同点 / 互补点 / 怎么开口 */
  common?: string;
  complement?: string;
  opener?: string;
}

export interface Profile {
  name: string;
  major: string;
  grade: string;
  gender: string;
  age: string;
  mbti: string;
  /** 作息偏好与组队偏好：参与软性匹配，AI 会用来避开"技能合适但时间对不上"的人 */
  schedule?: string;
  teamStyle?: string;
  mood: string;
  signature: string;
  skills: string[];
}

export interface Intent {
  postId: string;
  createdAt: string;
}

export interface Report {
  postId: string;
  reason: string;
  createdAt: string;
  reporterId?: string;
  reporterName?: string;
}

export interface Application {
  id: string;
  postId: string;
  applicantId?: string;
  message: string;
  applicantName: string;
  applicantMajor: string;
  applicantGrade: string;
  applicantSkills: string[];
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface CommunityTopic {
  id: string;
  name: string;
  description: string;
  emoji: string;
  official: boolean;
  createdAt: string;
}

export type CommunityStatus = "approved" | "pending" | "rejected";

export interface CommunityPost {
  id: string;
  topicId: string;
  ownerId?: string;
  author: string;
  anonymous: boolean;
  content: string;
  createdAt: string;
  likes: number;
  status: CommunityStatus;
  moderationReasons: string[];
  isMine?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  status: CommunityStatus;
}

export interface CommunityReport {
  id: string;
  postId: string;
  reason: string;
  createdAt: string;
  reporterId?: string;
  reporterName?: string;
}

export interface CommunityInvite {
  code: string;
  nickname: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  postId: string;
  tier: string;
  durationId: string;
  price: number;
  status: "pending_review" | "active" | "expired";
  createdAt: string;
  endAt: string;
  impressions: number;
  clicks: number;
}
