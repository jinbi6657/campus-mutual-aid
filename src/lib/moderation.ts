export interface ModerationResult {
  status: "approved" | "pending";
  reasons: string[];
}

const bannedWords = [
  "代考",
  "代写",
  "博彩",
  "赌博",
  "贷款",
  "刷单",
  "诈骗",
  "约炮",
  "色情",
  "毒品",
  "办证",
  "发票",
  "裸聊",
];

const attackWords = [
  "傻逼",
  "脑残",
  "去死",
  "滚出",
  "贱人",
  "废物",
  "垃圾人",
];

const privacyWords = ["身份证", "学号", "宿舍号", "家庭住址", "银行卡"];

const contactPatterns: { pattern: RegExp; reason: string }[] = [
  { pattern: /1[3-9]\d{9}/, reason: "包含手机号" },
  { pattern: /(微信|vx|V信|薇信)\s*[:：]?\s*[A-Za-z0-9_-]{4,}/, reason: "包含微信号" },
  { pattern: /(QQ|qq)\s*[:：]?\s*\d{5,}/, reason: "包含 QQ 号" },
];

const adWords = ["加微信", "私聊我", "低价出", "包过", "兼职日结", "扫码进群"];

export function moderateContent(content: string): ModerationResult {
  const text = content.trim();
  const reasons: string[] = [];

  for (const word of bannedWords) {
    if (text.includes(word)) {
      reasons.push(`疑似违规内容：${word}`);
    }
  }

  for (const word of attackWords) {
    if (text.includes(word)) {
      reasons.push("疑似人身攻击或辱骂");
      break;
    }
  }

  for (const word of privacyWords) {
    if (text.includes(word)) {
      reasons.push(`疑似泄露隐私：${word}`);
      break;
    }
  }

  for (const item of contactPatterns) {
    if (item.pattern.test(text)) {
      reasons.push(item.reason);
    }
  }

  for (const word of adWords) {
    if (text.includes(word)) {
      reasons.push("疑似广告或导流");
      break;
    }
  }

  if (reasons.length > 0) {
    return { status: "pending", reasons: Array.from(new Set(reasons)) };
  }
  return { status: "approved", reasons: [] };
}
