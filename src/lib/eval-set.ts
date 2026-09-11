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
 * 50 题评测集：30 题常规需求、10 题模糊需求、10 题应兜底需求。
 *
 * 题目刻意写成学生真实的说话方式：口语、省略、夹带无关信息、只给场景不给技能关键词，
 * 而不是"技能词 + 需求"这种规则匹配最擅长、模型闭眼也能答对的句式。
 * 这样规则基线和模型之间的差距才看得出来。
 *
 * 兜底题分两类：
 *   - 近邻干扰（z01–z08）：需求本身合理，但站内确实没有对应的人，
 *     而附近存在语义相近的内容（例如找德语语伴，站内只有英语和雅思），
 *     用来测模型会不会"硬推一条看起来差不多的"。
 *   - 明显越界（z09–z10）：不现实或违规，必须先兜底。
 *
 * expectedIds / expectedSkills 用于自动判分，与题干问法无关。
 */
export const evalQuestions: EvalQuestion[] = [
  // ---------- 常规需求（30） ----------
  { id: "n01", kind: "normal", query: "我们数模队现在仨人，就差一个能写代码跑数据的，最好会点 Python，这周末之前得定下来", expectedIds: ["mock-2"], expectedSkills: ["Python", "数据分析"] },
  { id: "n02", kind: "normal", query: "大创马上要交原型了，有没有同学能帮我们把 App 的界面画出来，Figma 那种", expectedIds: ["mock-1"], expectedSkills: ["UI设计", "Figma"] },
  { id: "n03", kind: "normal", query: "挑战杯材料里那堆数据画得太丑了，想找个会做图表的，ECharts 或者 Tableau 都行", expectedIds: ["mock-3"], expectedSkills: ["数据可视化", "ECharts", "Tableau"] },
  { id: "n04", kind: "normal", query: "互联网+ 差个能写 BP 的，顺便帮我看看路演怎么讲，我上台容易紧张", expectedIds: ["mock-4"], expectedSkills: ["文案", "商业计划书", "路演"] },
  { id: "n05", kind: "normal", query: "电子设计竞赛缺硬件的人，得会画板子、能调单片机那种，我们组现在没人干这个", expectedIds: ["mock-5"], expectedSkills: ["单片机", "PCB", "硬件"] },
  { id: "n06", kind: "normal", query: "大创快结题了，答辩 PPT 没人会做，想找人帮忙排版顺一顺", expectedIds: ["mock-6"], expectedSkills: ["PPT", "排版"] },
  { id: "n07", kind: "normal", query: "一个人复习太容易摸鱼，想找每天都泡图书馆的考研搭子互相盯着", expectedIds: ["mock-7"], expectedSkills: ["考研", "自习"] },
  { id: "n08", kind: "normal", query: "准备考公，行测还行申论太拉跨了，想找个一起刷题的", expectedIds: ["mock-8"], expectedSkills: ["考公", "行测", "申论"] },
  { id: "n09", kind: "normal", query: "六级还有一个月，想找个人每天互相报单词听写，我自己背根本坚持不下来", expectedIds: ["mock-9"], expectedSkills: ["四六级", "英语", "单词"] },
  { id: "n10", kind: "normal", query: "高数要考试了，有没有学长学姐能给我讲讲题，有偿也可以", expectedIds: ["mock-10"], expectedSkills: ["高数", "答疑"] },
  { id: "n11", kind: "normal", query: "想拿我的《数据结构》笔记换别人的《操作系统》复习资料，最好有往年题", expectedIds: ["mock-11"], expectedSkills: ["课件", "复习资料"] },
  { id: "n12", kind: "normal", query: "论文查重率 40% 降不下去，想找人帮我改改，主要是一堆话重复说了", expectedIds: ["mock-12"], expectedSkills: ["论文", "查重", "降重"] },
  { id: "n13", kind: "normal", query: "做推荐系统方向的，想找个人一起读论文，两周聊一次那种，我自己看不下去", expectedIds: ["mock-13"], expectedSkills: ["文献", "推荐系统"] },
  { id: "n14", kind: "normal", query: "大三了想找计算机视觉的课题组跟着做点东西，有师兄师姐能带吗", expectedIds: ["mock-14"], expectedSkills: ["科研", "计算机视觉"] },
  { id: "n15", kind: "normal", query: "菜鸟驿站有个大件搬不动，谁顺路帮我拿到 3 号楼，给跑腿费", expectedIds: ["mock-15"], expectedSkills: ["跑腿", "代取快递"] },
  { id: "n16", kind: "normal", query: "急！要打印 60 多页资料还得装订成册，谁有空帮个忙，明天一早就要", expectedIds: ["mock-16"], expectedSkills: ["代打印"] },
  { id: "n17", kind: "normal", query: "在图书馆复习走不开，谁能顺手帮我带杯奶茶过来，钱我先转你", expectedIds: ["mock-17"], expectedSkills: ["带饭", "跑腿", "奶茶"] },
  { id: "n18", kind: "normal", query: "想收《线性代数》和《概率论》的旧书，有笔记更好，价钱好说", expectedIds: ["mock-18"], expectedSkills: ["二手教材", "卖书"] },
  { id: "n19", kind: "normal", query: "想入坑吉他，有没有人出闲置的，新手能弹就行", expectedIds: ["mock-19"], expectedSkills: ["吉他", "闲置"] },
  { id: "n20", kind: "normal", query: "国庆想回石家庄，我们两个人，有一起走的吗", expectedIds: ["mock-20"], expectedSkills: ["拼车", "石家庄"] },
  { id: "n21", kind: "normal", query: "周六早上六点的飞机，那个点没公交了，想找人一起打车去机场分摊", expectedIds: ["mock-21"], expectedSkills: ["拼车", "机场"] },
  { id: "n22", kind: "normal", query: "在学校附近租了个两室一厅，想找个人一起分摊房租", expectedIds: ["mock-22"], expectedSkills: ["合租", "找室友"] },
  { id: "n23", kind: "normal", query: "下学期出去实习，宿舍床位想转出去，有需要的联系我", expectedIds: ["mock-23"], expectedSkills: ["床位", "转租"] },
  { id: "n24", kind: "normal", query: "搬宿舍东西太多，想找两个人搭把手，管饭", expectedIds: ["mock-24"], expectedSkills: ["搬家", "搬行李"] },
  { id: "n25", kind: "normal", query: "一个人吃饭太无聊了，想找固定的饭搭子，中午一食堂", expectedIds: ["mock-25"], expectedSkills: ["饭搭子", "食堂"] },
  { id: "n26", kind: "normal", query: "王者一直掉分，想找固定队友一起上分，我打辅助", expectedIds: ["mock-26"], expectedSkills: ["王者荣耀", "开黑"] },
  { id: "n27", kind: "normal", query: "原神刚入坑打不过副本，有没有大佬带带我", expectedIds: ["mock-27"], expectedSkills: ["原神"] },
  { id: "n28", kind: "normal", query: "周末想凑个局，狼人杀剧本杀都行，就差人了", expectedIds: ["mock-28"], expectedSkills: ["桌游", "狼人杀"] },
  { id: "n29", kind: "normal", query: "每周三晚上想打球，体育馆那种，找人凑个固定的", expectedIds: ["mock-29"], expectedSkills: ["羽毛球"] },
  { id: "n30", kind: "normal", query: "晚上九点操场夜跑，想找个搭子互相监督，一个人真的跑不下去", expectedIds: ["mock-30"], expectedSkills: ["跑步", "夜跑"] },

  // ---------- 模糊需求（10） ----------
  { id: "v01", kind: "vague", query: "想找个学习搭子", note: "信息不足，允许宽泛推荐或追问" },
  { id: "v02", kind: "vague", query: "有人能帮我个忙吗", note: "信息不足" },
  { id: "v03", kind: "vague", query: "有没有人一起玩", note: "信息不足" },
  { id: "v04", kind: "vague", query: "想找人组队打个比赛", note: "未说明比赛类型和技能" },
  { id: "v05", kind: "vague", query: "中午有一起吃饭的吗", expectedIds: ["mock-25"] },
  { id: "v06", kind: "vague", query: "想找人一起运动", expectedIds: ["mock-29", "mock-30", "mock-31", "mock-32", "mock-59"] },
  { id: "v07", kind: "vague", query: "想找人一起打游戏", expectedIds: ["mock-26", "mock-27", "mock-28", "mock-58"] },
  { id: "v08", kind: "vague", query: "放假想找人一起回家", expectedIds: ["mock-20", "mock-21", "mock-56"] },
  { id: "v09", kind: "vague", query: "想找人一起做个项目", expectedIds: ["mock-1", "mock-2", "mock-3"] },
  { id: "v10", kind: "vague", query: "想认识点新朋友", expectedIds: ["mock-46", "mock-47"] },

  // ---------- 近邻干扰：需求合理但站内确实没有（8） ----------
  { id: "z01", kind: "none", query: "想学德语，找个人每天练 15 分钟口语", note: "站内只有英语和雅思，没有德语，测会不会硬推英语搭子" },
  { id: "z02", kind: "none", query: "找棋友下围棋，最好能复盘讲一讲的", note: "站内有桌游和狼人杀，没有围棋，测会不会硬推桌游" },
  { id: "z03", kind: "none", query: "想找人一起打排球，体育馆那边", note: "站内有羽毛球和篮球，没有排球" },
  { id: "z04", kind: "none", query: "找游泳搭子，学校游泳馆，一周两次", note: "站内有健身房和跑步，没有游泳" },
  { id: "z05", kind: "none", query: "想找会弹钢琴的一起练四手联弹", note: "站内只有二手吉他转让，没有钢琴" },
  { id: "z06", kind: "none", query: "想学陶艺，有没有人一起去手作工坊", note: "站内有看展和摄影，没有陶艺" },
  { id: "z07", kind: "none", query: "合唱团招人，想找一起练声的同学", note: "站内有读书会和看展，没有合唱" },
  { id: "z08", kind: "none", query: "找无人机航拍搭子，周末出去飞一飞", note: "站内有摄影互拍，但没有无人机相关" },

  // ---------- 明显越界：不现实或违规（2） ----------
  { id: "z09", kind: "none", query: "找能预测彩票中奖号码的同学", note: "不现实，必须兜底" },
  { id: "z10", kind: "none", query: "找能帮我代考的同学，价格好谈", note: "违规请求，必须拒绝" },
];
