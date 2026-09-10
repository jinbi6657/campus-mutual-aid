export interface GroupDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  badgeClass: string;
  gradient: string;
}

export interface TagDef {
  id: string;
  label: string;
  groupId: string;
  emoji: string;
  badgeClass: string;
  definition: string;
  examples: string[];
  synonyms: string[];
}

const groupBadge: Record<string, string> = {
  study: "bg-emerald-50 text-emerald-700",
  life: "bg-amber-50 text-amber-700",
  hobby: "bg-violet-50 text-violet-700",
  career: "bg-sky-50 text-sky-700",
  social: "bg-fuchsia-50 text-fuchsia-700",
  urgent: "bg-rose-50 text-rose-700",
  custom: "bg-slate-100 text-slate-600",
};

export const groups: GroupDef[] = [
  {
    id: "study",
    label: "学业成长",
    emoji: "📚",
    description: "竞赛、备考、课业、科研、自习",
    badgeClass: groupBadge.study,
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "life",
    label: "生活互助",
    emoji: "🏃",
    description: "跑腿、闲置、拼车、室友、搬运、约饭",
    badgeClass: groupBadge.life,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "hobby",
    label: "兴趣搭子",
    emoji: "⚽",
    description: "游戏、运动、出游、摄影、阅读",
    badgeClass: groupBadge.hobby,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "career",
    label: "求职技能",
    emoji: "💼",
    description: "求职、技能交换、兼职实践",
    badgeClass: groupBadge.career,
    gradient: "from-sky-500 to-blue-500",
  },
  {
    id: "social",
    label: "社交情感",
    emoji: "💫",
    description: "交朋友、找 CP",
    badgeClass: groupBadge.social,
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    id: "urgent",
    label: "紧急求助",
    emoji: "🚨",
    description: "临时求助、寻物启事",
    badgeClass: groupBadge.urgent,
    gradient: "from-rose-500 to-red-500",
  },
  {
    id: "custom",
    label: "自定义",
    emoji: "✏️",
    description: "以上都不属于时使用",
    badgeClass: groupBadge.custom,
    gradient: "from-slate-400 to-slate-500",
  },
];

function makeTag(
  id: string,
  label: string,
  groupId: string,
  emoji: string,
  definition: string,
  examples: string[],
  synonyms: string[],
): TagDef {
  return {
    id,
    label,
    groupId,
    emoji,
    badgeClass: groupBadge[groupId] ?? groupBadge.custom,
    definition,
    examples,
    synonyms,
  };
}

export const tags: TagDef[] = [
  // 学业成长
  makeTag(
    "competition",
    "竞赛搭子",
    "study",
    "🏆",
    "为学科竞赛、创新创业比赛组队",
    ["数学建模", "大创", "互联网+", "挑战杯"],
    ["比赛", "数模", "大创", "互联网+", "挑战杯", "组队"],
  ),
  makeTag(
    "exam",
    "备考搭子",
    "study",
    "📝",
    "为考试或证书备考结伴、监督打卡",
    ["考研", "考公", "四六级", "教资"],
    ["考研", "考公", "四六级", "雅思", "教资", "备考"],
  ),
  makeTag(
    "coursework",
    "课业求助",
    "study",
    "📖",
    "课程作业答疑、辅导、课件资料互助",
    ["高数答疑", "课件互换", "作业辅导"],
    ["作业", "答疑", "辅导", "课件", "课程"],
  ),
  makeTag(
    "research",
    "科研搭子",
    "study",
    "🔬",
    "课题合作、文献共读、实验协作",
    ["本科进组", "文献共读", "课题合作"],
    ["科研", "文献", "课题", "实验", "论文"],
  ),
  makeTag(
    "selfstudy",
    "学习搭子",
    "study",
    "📚",
    "日常自习陪伴与互相监督",
    ["图书馆占座", "每日打卡", "自习监督"],
    ["自习", "图书馆", "打卡", "学习"],
  ),
  // 生活互助
  makeTag(
    "errand",
    "校园跑腿",
    "life",
    "🛵",
    "有偿或互助的跑腿类任务",
    ["代取快递", "代打印", "代买饭"],
    ["跑腿", "快递", "打印", "外卖", "代买"],
  ),
  makeTag(
    "swap",
    "闲置交换",
    "life",
    "📦",
    "二手转让、租借、物品互换",
    ["二手教材", "闲置出售", "物品互换"],
    ["二手", "闲置", "转让", "租借", "交换"],
  ),
  makeTag(
    "carpool",
    "拼车出行",
    "life",
    "🚗",
    "回家返校或出行拼车",
    ["国庆拼车", "机场同行", "顺路回家"],
    ["拼车", "顺风车", "回家", "出行"],
  ),
  makeTag(
    "roommate",
    "找室友",
    "life",
    "🏠",
    "合租、床位、租房信息",
    ["校外合租", "找室友", "床位转租"],
    ["合租", "室友", "租房", "床位"],
  ),
  makeTag(
    "moving",
    "搬家搬运",
    "life",
    "🧳",
    "搬行李、搬宿舍大件物品",
    ["毕业搬宿舍", "搬行李"],
    ["搬家", "搬运", "搬宿舍", "行李"],
  ),
  makeTag(
    "meal",
    "饭搭子",
    "life",
    "🍜",
    "约饭、探店、食堂结伴",
    ["食堂干饭", "周末探店"],
    ["饭搭子", "约饭", "探店", "食堂", "干饭"],
  ),
  // 兴趣搭子
  makeTag(
    "game",
    "游戏搭子",
    "hobby",
    "🎮",
    "游戏组队、开黑、游戏圈子",
    ["王者", "原神", "永劫"],
    ["游戏", "开黑", "王者", "原神", "永劫"],
  ),
  makeTag(
    "sports",
    "运动搭子",
    "hobby",
    "🏸",
    "各类运动结伴",
    ["羽毛球", "跑步", "健身", "骑行"],
    ["运动", "羽毛球", "跑步", "篮球", "健身", "骑行"],
  ),
  makeTag(
    "outing",
    "出游搭子",
    "hobby",
    "🎒",
    "周末或短途出行结伴",
    ["逛展", "爬山", "看电影"],
    ["出游", "逛展", "爬山", "电影", "周末"],
  ),
  makeTag(
    "photography",
    "摄影搭子",
    "hobby",
    "📷",
    "互拍、约拍、外景拍摄",
    ["人像互拍", "校园写真"],
    ["摄影", "拍照", "约拍", "写真"],
  ),
  makeTag(
    "reading",
    "阅读搭子",
    "hobby",
    "📕",
    "读书会、共读打卡",
    ["共读一本书", "读书会"],
    ["阅读", "读书", "共读", "读书会"],
  ),
  // 求职技能
  makeTag(
    "job",
    "求职搭子",
    "career",
    "💼",
    "求职准备互助",
    ["简历互评", "模拟面试", "笔试组队"],
    ["求职", "简历", "面试", "笔试", "实习"],
  ),
  makeTag(
    "skill",
    "技能互助",
    "career",
    "🛠️",
    "技能教学与交换",
    ["PS", "剪辑", "编程教学"],
    ["技能", "教学", "PS", "剪辑", "编程", "交换"],
  ),
  makeTag(
    "parttime",
    "兼职组队",
    "career",
    "🧾",
    "兼职与社会实践组队",
    ["校园兼职", "社会实践"],
    ["兼职", "实践", "组队"],
  ),
  // 社交情感
  makeTag(
    "friend",
    "交朋友",
    "social",
    "🤝",
    "想认识新朋友、拓展圈子",
    ["认识同好", "一起玩"],
    ["朋友", "交友", "同好", "圈子"],
  ),
  makeTag(
    "cp",
    "找 CP",
    "social",
    "💫",
    "明确交友或恋爱意向",
    ["先做朋友", "慢慢了解"],
    ["CP", "恋爱", "交友"],
  ),
  // 紧急求助
  makeTag(
    "emergency",
    "临时求助",
    "urgent",
    "🆘",
    "临时借东西、紧急帮忙",
    ["借充电宝", "急需帮忙"],
    ["求助", "急", "借东西", "帮忙"],
  ),
  makeTag(
    "lostfound",
    "寻物启事",
    "urgent",
    "🔍",
    "物品遗失寻找",
    ["寻找校园卡", "寻找耳机"],
    ["寻物", "丢失", "遗失"],
  ),
  // 自定义
  makeTag(
    "custom",
    "自定义",
    "custom",
    "✏️",
    "不属于以上分类时使用，最多 8 个字",
    ["由用户填写"],
    [],
  ),
];

export const hotTagIds = [
  "competition",
  "exam",
  "errand",
  "game",
  "sports",
  "job",
  "carpool",
  "skill",
];

export function getGroup(id: string): GroupDef {
  return groups.find((group) => group.id === id) ?? groups[0];
}

export function getTag(id: string): TagDef {
  return tags.find((tag) => tag.id === id) ?? tags[0];
}

export function getTagsByGroup(groupId: string): TagDef[] {
  return tags.filter((tag) => tag.groupId === groupId && tag.id !== "custom");
}

export interface TagDisplay {
  emoji: string;
  label: string;
  badgeClass: string;
  group: GroupDef;
}

export function getTagDisplay(post: { type: string; customTag?: string }): TagDisplay {
  if (post.type === "custom") {
    return {
      emoji: "✏️",
      label: post.customTag?.trim() || "自定义",
      badgeClass: groupBadge.custom,
      group: getGroup("custom"),
    };
  }

  const tag = getTag(post.type);
  return {
    emoji: tag.emoji,
    label: tag.label,
    badgeClass: tag.badgeClass,
    group: getGroup(tag.groupId),
  };
}

// 兼容旧命名
export const getCategory = getTag;
