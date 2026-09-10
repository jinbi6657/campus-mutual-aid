export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const KEY = "campus-notifications-v1";

export function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function addNotification(
  notification: Omit<AppNotification, "id" | "createdAt" | "read">,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const record: AppNotification = {
    ...notification,
    id: `nt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([record, ...loadNotifications()]),
    );
  } catch {
    // ignore
  }
}

export function markAllNotificationsRead(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = loadNotifications().map((item) =>
    item.userId === userId ? { ...item, read: true } : item,
  );
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function unreadCount(userId: string): number {
  return loadNotifications().filter(
    (item) => item.userId === userId && !item.read,
  ).length;
}
