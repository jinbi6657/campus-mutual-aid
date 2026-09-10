import type {
  CommunityComment,
  CommunityPost,
  CommunityTopic,
} from "./types";

const base = Date.now();

function hoursAgo(hours: number): string {
  return new Date(base - hours * 3600_000).toISOString();
}

export const seedTopics: CommunityTopic[] = [
  {
    id: "topic-canteen",
    name: "今日食堂",
    description: "今天吃了什么？哪家踩雷哪家好吃",
    emoji: "🍜",
    official: true,
    createdAt: hoursAgo(72),
  },
  {
    id: "topic-course",
    name: "吐槽选修课",
    description: "选课踩雷、作业太多、老师有趣都来聊",
    emoji: "📚",
    official: true,
    createdAt: hoursAgo(70),
  },
  {
    id: "topic-club",
    name: "社团招新",
    description: "社团宣传、招新答疑、活动预告",
    emoji: "🎪",
    official: true,
    createdAt: hoursAgo(60),
  },
  {
    id: "topic-weekend",
    name: "周末去哪玩",
    description: "校园周边好吃好玩的地方互相安利",
    emoji: "🎒",
    official: true,
    createdAt: hoursAgo(48),
  },
  {
    id: "topic-lost",
    name: "失物招领互助",
    description: "捡到东西、丢了东西都可以发在这里",
    emoji: "🔍",
    official: true,
    createdAt: hoursAgo(40),
  },
  {
    id: "topic-study",
    name: "考研自习室",
    description: "考研、考公、期末复习的日常打卡",
    emoji: "📝",
    official: false,
    createdAt: hoursAgo(30),
  },
];

export const seedCommunityPosts: CommunityPost[] = [
  {
    id: "cpost-1",
    topicId: "topic-canteen",
    author: "一只干饭人",
    anonymous: false,
    content:
      "二食堂三楼新开的麻辣香锅今天排队 20 分钟，味道还行，就是阿姨手抖得厉害，土豆片只有三片。",
    createdAt: hoursAgo(1),
    likes: 32,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-2",
    topicId: "topic-canteen",
    author: "匿名同学",
    anonymous: true,
    content:
      "一食堂的番茄鸡蛋面是不是换师傅了？今天的汤特别咸，吃完一下午都在喝水。",
    createdAt: hoursAgo(2),
    likes: 18,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-3",
    topicId: "topic-course",
    author: "选课小天才",
    anonymous: false,
    content:
      "强烈建议大家避开周四晚上的那门通识课，作业是每周一篇 2000 字小论文，期末还要闭卷。",
    createdAt: hoursAgo(3),
    likes: 56,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-4",
    topicId: "topic-course",
    author: "匿名同学",
    anonymous: true,
    content:
      "有没有人觉得这学期某门课的签到方式很离谱，必须用校园网连指定 WiFi 才算，宿舍根本连不上。",
    createdAt: hoursAgo(5),
    likes: 41,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-5",
    topicId: "topic-club",
    author: "摄影社小助手",
    anonymous: false,
    content:
      "摄影社这周日下午在操场有免费人像拍摄活动，欢迎想拍照的同学来玩，现场教简单构图。",
    createdAt: hoursAgo(6),
    likes: 27,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-6",
    topicId: "topic-weekend",
    author: "城市探索者",
    anonymous: false,
    content:
      "学校北门坐两站地铁有个旧书店，咖啡也不错，适合周末下午去坐一下午，推荐给想安静看书的同学。",
    createdAt: hoursAgo(8),
    likes: 45,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-7",
    topicId: "topic-lost",
    author: "匿名同学",
    anonymous: true,
    content:
      "昨天在图书馆四楼靠窗的位置丢了一个蓝色的保温杯，杯子上有一张猫猫贴纸，捡到的同学麻烦留言。",
    createdAt: hoursAgo(9),
    likes: 12,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-8",
    topicId: "topic-study",
    author: "图书馆常驻",
    anonymous: false,
    content:
      "考研自习室每天 7:30 就有人排队了，想找固定搭子一起早起，互相叫一下，一个人真的起不来。",
    createdAt: hoursAgo(11),
    likes: 38,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-9",
    topicId: "topic-study",
    author: "匿名同学",
    anonymous: true,
    content:
      "考公的同学们，行测数量关系到底要不要放弃？每次做到这一块都想撕卷子。",
    createdAt: hoursAgo(13),
    likes: 29,
    status: "approved",
    moderationReasons: [],
  },
  {
    id: "cpost-10",
    topicId: "topic-weekend",
    author: "周末不宅",
    anonymous: false,
    content:
      "这周末天气好，有人想一起去爬学校后面的那座小山吗？大概两小时往返，带点水就行。",
    createdAt: hoursAgo(15),
    likes: 22,
    status: "approved",
    moderationReasons: [],
  },
];

export const seedCommunityComments: CommunityComment[] = [
  {
    id: "cc-1",
    postId: "cpost-1",
    author: "隔壁宿舍的",
    content: "哈哈哈哈阿姨手抖是统一的吗，我上次也数了土豆片。",
    createdAt: hoursAgo(0.5),
    status: "approved",
  },
  {
    id: "cc-2",
    postId: "cpost-1",
    author: "麻辣香锅爱好者",
    content: "建议点微辣，他们家辣椒真的有点猛。",
    createdAt: hoursAgo(0.3),
    status: "approved",
  },
  {
    id: "cc-3",
    postId: "cpost-3",
    author: "已经被作业淹没",
    content: "晚了，已经选了，看到这条的时候心凉了一半。",
    createdAt: hoursAgo(2.5),
    status: "approved",
  },
  {
    id: "cc-4",
    postId: "cpost-8",
    author: "早起困难户",
    content: "求带，我可以请你喝一周的咖啡。",
    createdAt: hoursAgo(10),
    status: "approved",
  },
  {
    id: "cc-5",
    postId: "cpost-10",
    author: "户外新手",
    content: "算我一个，正好想出去走走。",
    createdAt: hoursAgo(14),
    status: "approved",
  },
];
