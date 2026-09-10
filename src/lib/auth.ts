export type AuthRole = "student" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface AuthUser {
  id: string;
  studentId: string;
  name: string;
  major: string;
  className: string;
  college?: string;
  contact?: string;
  passwordHash: string;
  role: AuthRole;
  status: "active" | "disabled";
  mustChangePassword: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  studentId: string;
  name: string;
  major: string;
  className: string;
  college?: string;
  contact: string;
  status: VerificationStatus;
  autoMatched: boolean;
  rejectReason?: string;
  initialPassword?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface Session {
  studentId: string;
  role: AuthRole;
  loginAt: string;
  expiresAt?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

const USERS_KEY = "campus-auth-users-v1";
const REQUESTS_KEY = "campus-auth-requests-v1";
const SESSION_KEY = "campus-auth-session-v1";
const AUDIT_KEY = "campus-auth-audit-v1";
const HANDLED_REPORTS_KEY = "campus-auth-handled-reports-v1";

export const roster = [
  {
    studentId: "20230001",
    name: "张同学",
    major: "计算机科学与技术",
    className: "计算机2301",
  },
  {
    studentId: "20230002",
    name: "李同学",
    major: "统计学",
    className: "统计2301",
  },
  {
    studentId: "20230003",
    name: "王同学",
    major: "新闻传播学",
    className: "新传2302",
  },
  {
    studentId: "20230004",
    name: "刘同学",
    major: "土木工程",
    className: "土木2301",
  },
];

export function demoHash(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

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
    // ignore
  }
}

export function loadUsers(): AuthUser[] {
  return readArray<AuthUser>(USERS_KEY);
}

export function saveUsers(users: AuthUser[]): void {
  writeArray(USERS_KEY, users);
}

export function findUser(studentId: string): AuthUser | null {
  return (
    loadUsers().find((user) => user.studentId === studentId.trim()) ?? null
  );
}

export function ensureSeedData(): void {
  const users = loadUsers();
  const next = [...users];

  if (!next.some((user) => user.studentId === "admin")) {
    next.push({
      id: "admin",
      studentId: "admin",
      name: "平台管理员",
      major: "平台运营",
      className: "管理组",
      passwordHash: demoHash("admin123"),
      role: "admin",
      status: "active",
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (!next.some((user) => user.studentId === "20230001")) {
    next.push({
      id: "20230001",
      studentId: "20230001",
      name: "张同学",
      major: "计算机科学与技术",
      className: "计算机2301",
      passwordHash: demoHash("student123"),
      role: "student",
      status: "active",
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (!next.some((user) => user.studentId === "123123")) {
    next.push({
      id: "123123",
      studentId: "123123",
      name: "测试同学",
      major: "软件工程",
      className: "测试班",
      passwordHash: demoHash("123123"),
      role: "student",
      status: "active",
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveUsers(next);
}

export function generateInitialPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < 8; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function matchesRoster(
  studentId: string,
  name: string,
  major: string,
  className: string,
): boolean {
  return roster.some(
    (entry) =>
      entry.studentId === studentId.trim() &&
      entry.name === name.trim() &&
      entry.major === major.trim() &&
      entry.className === className.trim(),
  );
}

export function loadVerificationRequests(): VerificationRequest[] {
  return readArray<VerificationRequest>(REQUESTS_KEY);
}

export function saveVerificationRequests(
  requests: VerificationRequest[],
): void {
  writeArray(REQUESTS_KEY, requests);
}

export function createVerificationRequest(
  request: Omit<VerificationRequest, "id" | "createdAt" | "status">,
): VerificationRequest {
  const record: VerificationRequest = {
    ...request,
    id: `vr-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  saveVerificationRequests([record, ...loadVerificationRequests()]);
  return record;
}

export function updateVerificationRequest(
  id: string,
  patch: Partial<VerificationRequest>,
): void {
  saveVerificationRequests(
    loadVerificationRequests().map((request) =>
      request.id === id ? { ...request, ...patch } : request,
    ),
  );
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}

export function authenticate(
  studentId: string,
  password: string,
): { ok: boolean; user?: AuthUser; error?: string } {
  ensureSeedData();
  const user = findUser(studentId);
  if (!user) {
    return { ok: false, error: "账号不存在，请先提交注册申请" };
  }
  if (user.status === "disabled") {
    return { ok: false, error: "账号已被禁用，请联系管理员" };
  }
  if (user.passwordHash !== demoHash(password)) {
    return { ok: false, error: "密码不正确" };
  }
  return { ok: true, user };
}

export function changePassword(
  studentId: string,
  oldPassword: string,
  newPassword: string,
): { ok: boolean; error?: string } {
  const user = findUser(studentId);
  if (!user) {
    return { ok: false, error: "账号不存在" };
  }
  if (user.passwordHash !== demoHash(oldPassword)) {
    return { ok: false, error: "原密码不正确" };
  }
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return { ok: false, error: "新密码至少 8 位，且包含字母和数字" };
  }
  if (newPassword === studentId) {
    return { ok: false, error: "密码不能与学号相同" };
  }
  saveUsers(
    loadUsers().map((item) =>
      item.studentId === studentId
        ? {
            ...item,
            passwordHash: demoHash(newPassword),
            mustChangePassword: false,
          }
        : item,
    ),
  );
  return { ok: true };
}

export function resetPassword(studentId: string): string | null {
  const users = loadUsers();
  const target = users.find((user) => user.studentId === studentId);
  if (!target) {
    return null;
  }
  const initial = generateInitialPassword();
  saveUsers(
    users.map((user) =>
      user.studentId === studentId
        ? {
            ...user,
            passwordHash: demoHash(initial),
            mustChangePassword: true,
          }
        : user,
    ),
  );
  return initial;
}

export function setUserStatus(
  studentId: string,
  status: AuthUser["status"],
): void {
  saveUsers(
    loadUsers().map((user) =>
      user.studentId === studentId ? { ...user, status } : user,
    ),
  );
}

export function addAuditLog(
  actor: string,
  action: string,
  target: string,
  detail: string,
): void {
  writeArray(AUDIT_KEY, [
    {
      id: `log-${Date.now()}`,
      actor,
      action,
      target,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...readArray<AuditLog>(AUDIT_KEY),
  ]);
}

export function loadAuditLogs(): AuditLog[] {
  return readArray<AuditLog>(AUDIT_KEY);
}

export function loadHandledReports(): string[] {
  return readArray<string>(HANDLED_REPORTS_KEY);
}

export function markReportHandled(id: string): void {
  const handled = loadHandledReports();
  if (!handled.includes(id)) {
    writeArray(HANDLED_REPORTS_KEY, [id, ...handled]);
  }
}
