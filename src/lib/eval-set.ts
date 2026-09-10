export type EvalKind = "normal" | "vague" | "none";

export interface EvalQuestion {
  id: string;
  kind: EvalKind;
  query: string;
  expectedSkills?: string[];
  expectedIds?: string[];
  expectedTags?: string[];
  note?: string;
}

/**
 * 50 题评测集：30 题常规需求、10 题模糊需求、10 题无合适人选需求。
 * expectedIds / expectedSkills 用于自动判分。
 */
export const evalQuestions: EvalQuestion[] = [
  // ---------- 常规需求（30） ----------
  { id: "n01", kind: "normal", query: "找会 Python、能做数据分析的同学一起参加数学建模比赛", expectedIds: ["mock-2"], expectedSkills: ["Python", "数据分析"] },
  { id: "n02", kind: "normal", query: "大创项目想找一位会 Figma、能做移动端界面的 UI 设计同学", expectedIds: ["mock-1"], expectedSkills: ["Figma", "UI设计"] },
  { id: "n03", kind: "normal", query: "挑战杯项目缺一名会用 ECharts 或 Tableau 做数据可视化的队友", expectedIds: ["mock-3"], expectedSkills: ["数据可视化", "ECharts", "Tableau"] },
  { id: "n04", kind: "normal", query: "互联网+ 比赛想找会写商业计划书、能帮忙路演的队友", expectedIds: ["mock-4"], expectedSkills: ["商业计划书", "文案"] },
  { id: "n05", kind: "normal", query: "电子设计竞赛找会画 PCB、能调试单片机的硬件同学", expectedIds: ["mock-5"], expectedSkills: ["PCB", "单片机"] },
  { id: "n06", kind: "normal", query: "大创结题找一位会做答辩 PPT 和图表排版的同学", expectedIds: ["mock-6"], expectedSkills: ["PPT", "排版"] },
  { id: "n07", kind: "normal", query: "找每天在图书馆考研、互相监督打卡的学习搭子", expectedIds: ["mock-7"], expectedSkills: ["考研", "自习"] },
  { id: "n08", kind: "normal", query: "找一起备考公务员、练行测和申论的考公搭子", expectedIds: ["mock-8"], expectedSkills: ["考公", "行测", "申论"] },
  { id: "n09", kind: "normal", query: "想找四六级搭子，每天互相听写单词", expectedIds: ["mock-9"], expectedSkills: ["四六级", "英语"] },
  { id: "n10", kind: "normal", query: "高数期末想找能讲题的学长学姐辅导", expectedIds: ["mock-10"], expectedSkills: ["高数", "答疑"] },
  { id: "n11", kind: "normal", query: "想找人互换《数据结构》和《操作系统》的课件和复习资料", expectedIds: ["mock-11"], expectedSkills: ["课件", "复习资料"] },
  { id: "n12", kind: "normal", query: "毕业论文重复率高，想找人帮忙查重和降重", expectedIds: ["mock-12"], expectedSkills: ["查重", "降重"] },
  { id: "n13", kind: "normal", query: "想找推荐系统方向的同学一起做文献共读", expectedIds: ["mock-13"], expectedSkills: ["文献", "推荐系统"] },
  { id: "n14", kind: "normal", query: "本科生想进计算机视觉课题组，找师兄师姐带一带", expectedIds: ["mock-14"], expectedSkills: ["科研", "计算机视觉"] },
  { id: "n15", kind: "normal", query: "想找人帮忙代取快递送到 3 号宿舍楼，可以付跑腿费", expectedIds: ["mock-15"], expectedSkills: ["跑腿", "代取快递"] },
  { id: "n16", kind: "normal", query: "需要找人帮我代打印一份 60 页的资料并装订", expectedIds: ["mock-16"], expectedSkills: ["代打印"] },
  { id: "n17", kind: "normal", query: "复习走不开，想找人顺路带一杯奶茶到图书馆", expectedIds: ["mock-17"], expectedSkills: ["跑腿", "带饭"] },
  { id: "n18", kind: "normal", query: "想收二手《线性代数》和《概率论》教材", expectedIds: ["mock-18"], expectedSkills: ["二手教材", "卖书"] },
  { id: "n19", kind: "normal", query: "想收一把适合新手的二手吉他", expectedIds: ["mock-19"], expectedSkills: ["吉他", "闲置"] },
  { id: "n20", kind: "normal", query: "国庆想拼车回石家庄，找 2 位同学同行", expectedIds: ["mock-20"], expectedSkills: ["拼车", "石家庄"] },
  { id: "n21", kind: "normal", query: "周六早班机，想找人拼车去机场", expectedIds: ["mock-21"], expectedSkills: ["拼车", "机场"] },
  { id: "n22", kind: "normal", query: "想在学校附近找人合租，两室一厅找室友", expectedIds: ["mock-22"], expectedSkills: ["合租", "找室友"] },
  { id: "n23", kind: "normal", query: "下学期要出去实习，想转租一个宿舍床位", expectedIds: ["mock-23"], expectedSkills: ["床位", "转租"] },
  { id: "n24", kind: "normal", query: "毕业搬宿舍，想找两位同学帮忙搬行李", expectedIds: ["mock-24"], expectedSkills: ["搬家", "搬行李"] },
  { id: "n25", kind: "normal", query: "想找固定饭搭子，中午一起在一食堂吃饭", expectedIds: ["mock-25"], expectedSkills: ["饭搭子", "食堂"] },
  { id: "n26", kind: "normal", query: "想找固定队友晚上一起打王者荣耀", expectedIds: ["mock-26"], expectedSkills: ["王者荣耀", "开黑"] },
  { id: "n27", kind: "normal", query: "原神萌新想找大佬带副本", expectedIds: ["mock-27"], expectedSkills: ["原神"] },
  { id: "n28", kind: "normal", query: "周末想组桌游局，狼人杀或剧本杀都可以", expectedIds: ["mock-28"], expectedSkills: ["桌游", "狼人杀"] },
  { id: "n29", kind: "normal", query: "找每周三晚上一起打羽毛球的球友", expectedIds: ["mock-29"], expectedSkills: ["羽毛球"] },
  { id: "n30", kind: "normal", query: "想找操场夜跑搭子，每晚 9 点一起跑", expectedIds: ["mock-30"], expectedSkills: ["跑步", "夜跑"] },

  // ---------- 模糊需求（10） ----------
  { id: "v01", kind: "vague", query: "想找人一起学习", note: "信息不足，允许给出宽泛推荐或要求补充" },
  { id: "v02", kind: "vague", query: "想找个人帮个忙", note: "信息不足" },
  { id: "v03", kind: "vague", query: "有没有人一起玩", note: "信息不足" },
  { id: "v04", kind: "vague", query: "想找队友参加比赛", note: "未说明比赛类型和技能" },
  { id: "v05", kind: "vague", query: "想找人一起吃饭", expectedIds: ["mock-25"] },
  { id: "v06", kind: "vague", query: "想找个人一起运动", expectedIds: ["mock-29", "mock-30", "mock-31", "mock-32"] },
  { id: "v07", kind: "vague", query: "想找人一起打游戏", expectedIds: ["mock-26", "mock-27", "mock-28"] },
  { id: "v08", kind: "vague", query: "想找人一起回家", expectedIds: ["mock-20", "mock-21"] },
  { id: "v09", kind: "vague", query: "想找人一起做项目", expectedIds: ["mock-1", "mock-2", "mock-3"] },
  { id: "v10", kind: "vague", query: "想找人聊聊天", expectedIds: ["mock-46", "mock-47"] },

  // ---------- 无合适人选 / 应兜底（10） ----------
  { id: "z01", kind: "none", query: "找会开飞机、能一起考飞行执照的同学", note: "校园场景无匹配" },
  { id: "z02", kind: "none", query: "找能教我修核反应堆的同学", note: "无匹配且不现实" },
  { id: "z03", kind: "none", query: "找会跳伞的搭子一起去跳伞", note: "无匹配" },
  { id: "z04", kind: "none", query: "找能帮我代考的同学", note: "违规请求，应拒绝或兜底" },
  { id: "z05", kind: "none", query: "找会做满汉全席的同学", note: "无匹配" },
  { id: "z06", kind: "none", query: "找会开游艇的同学", note: "无匹配" },
  { id: "z07", kind: "none", query: "找能预测彩票中奖号码的同学", note: "无匹配且不现实" },
  { id: "z08", kind: "none", query: "找会驯马的搭子", note: "无匹配" },
  { id: "z09", kind: "none", query: "找能修天文望远镜的同学", note: "无匹配" },
  { id: "z10", kind: "none", query: "找会开挖掘机的同学", note: "无匹配" },
];
