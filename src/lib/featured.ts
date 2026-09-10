export interface FeaturedItem {
  id: string;
  postId: string;
  title: string;
  summary: string;
  author: string;
  tagId: string;
  endAt: string;
}

const base = Date.now();

function hoursFromNow(hours: number): string {
  return new Date(base + hours * 3600_000).toISOString();
}

export const featuredItems: FeaturedItem[] = [
  {
    id: "featured-1",
    postId: "mock-3",
    title: "挑战杯找一名会数据可视化的队友",
    summary:
      "项目已有数据和基础结论，缺一位会用 ECharts 或 Tableau 的同学，一起冲省赛。",
    author: "小何 · 经济学大三",
    tagId: "competition",
    endAt: hoursFromNow(26),
  },
  {
    id: "featured-2",
    postId: "mock-20",
    title: "国庆拼车回石家庄，还差 2 人",
    summary: "9 月 30 日下午出发，行李不多，费用 AA，详情可以私聊确认。",
    author: "小孙 · 土木大三",
    tagId: "carpool",
    endAt: hoursFromNow(10),
  },
  {
    id: "featured-3",
    postId: "mock-7",
    title: "找图书馆考研搭子，互相监督打卡",
    summary: "每天早上 8 点图书馆见，专业不限，只求能一起坚持。",
    author: "小赵 · 汉语言大三",
    tagId: "exam",
    endAt: hoursFromNow(168),
  },
  {
    id: "featured-4",
    postId: "mock-33",
    title: "找周末一起看展、爬山的朋友",
    summary: "喜欢看展和户外的同学可以一起，先做朋友慢慢了解。",
    author: "小冯 · 视传大三",
    tagId: "outing",
    endAt: hoursFromNow(50),
  },
  {
    id: "featured-5",
    postId: "mock-38",
    title: "找求职搭子，互相改简历、模拟面试",
    summary: "每周互相改一次简历、做一次模拟面试，目标互联网产品岗。",
    author: "小陈 · 金融大三",
    tagId: "job",
    endAt: hoursFromNow(74),
  },
  {
    id: "featured-6",
    postId: "mock-29",
    title: "找羽毛球搭子，每周三晚上体育馆",
    summary: "水平一般，想找固定球友，互相对练提高，球拍可以多带一副。",
    author: "小冯 · 视传大三",
    tagId: "sports",
    endAt: hoursFromNow(120),
  },
];

export type PromotionTierId = "main" | "rotation" | "category_top";

export interface PromotionTierOption {
  id: PromotionTierId;
  name: string;
  description: string;
  prices: Partial<Record<string, number>>;
}

export const promotionTiers: PromotionTierOption[] = [
  {
    id: "main",
    name: "主屏 C 位",
    description: "首页大屏独家首位，曝光最高，最长支持 3 天",
    prices: { "24h": 3.9, "3d": 5.9 },
  },
  {
    id: "rotation",
    name: "头条轮播",
    description: "进入首页广场大屏，多条加权轮播",
    prices: { "24h": 1.9, "3d": 3.9, "7d": 5.9 },
  },
  {
    id: "category_top",
    name: "分类置顶",
    description: "出现在对应大类/标签列表顶部，价格更低、容量更大",
    prices: { "24h": 0.9, "3d": 1.9, "7d": 3.9 },
  },
];

export interface PromotionDurationOption {
  id: string;
  label: string;
  days: number;
}

export const promotionDurations: PromotionDurationOption[] = [
  { id: "24h", label: "24 小时", days: 1 },
  { id: "3d", label: "3 天", days: 3 },
  { id: "7d", label: "7 天", days: 7 },
];
