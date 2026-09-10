export type DeadlineTone = "normal" | "soon" | "expired";

export function isExpired(endAt: string, now = Date.now()): boolean {
  return new Date(endAt).getTime() <= now;
}

export function formatRemaining(endAt: string, now = Date.now()): string {
  const diff = new Date(endAt).getTime() - now;
  if (diff <= 0) {
    return "已结束";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `剩余 ${days} 天 ${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (hours >= 1) {
    return `剩余 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`;
  }
  return `剩余 ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

export function renewalWindowMinutes(durationMinutes: number): number {
  if (durationMinutes >= 4320) {
    return 2880;
  }
  return Math.max(durationMinutes * 0.25, 10);
}

export function renewalState(
  post: { displayEndAt: string; durationMinutes?: number; renewCount?: number },
  now = Date.now(),
): { canRenew: boolean; reason: string } {
  const duration = post.durationMinutes ?? 1440;
  const renewCount = post.renewCount ?? 0;
  const totalMinutes = duration * (renewCount + 1);

  if (renewCount >= 3) {
    return { canRenew: false, reason: "已达续期上限，请重新发布" };
  }
  if (totalMinutes >= 129600) {
    return { canRenew: false, reason: "累计展示已达 90 天上限" };
  }

  const diff = new Date(post.displayEndAt).getTime() - now;
  if (diff <= 0) {
    return { canRenew: true, reason: "" };
  }

  const windowMs = renewalWindowMinutes(duration) * 60_000;
  if (diff > windowMs) {
    const hours = Math.ceil((diff - windowMs) / 3600_000);
    return { canRenew: false, reason: `剩余 ${hours} 小时后可续期` };
  }

  return { canRenew: true, reason: "" };
}

export function formatDeadline(endAt: string): string {
  const date = new Date(endAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `截止 ${month}月${day}日 ${hours}:${minutes}`;
}

export function deadlineBadge(
  endAt: string,
  now = Date.now(),
): { text: string; tone: DeadlineTone } {
  const diff = new Date(endAt).getTime() - now;
  if (diff <= 0) {
    return { text: "已结束", tone: "expired" };
  }
  const days = diff / 86400000;
  if (days <= 3) {
    return { text: `剩 ${Math.max(1, Math.ceil(days))} 天`, tone: "soon" };
  }
  return { text: formatDeadline(endAt), tone: "normal" };
}
