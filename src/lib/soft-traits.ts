// 软性画像：技能和标签之外的匹配依据。
//
// 校园组队失败的真实原因里，"技能都对但合不来"占比很高：作息完全相反，
// 或者一个想长期做、一个只想凑一次。这类信息规则匹配读不懂，只有模型能判断。
//
// 演示数据按每条需求预置了作息、性格、组队偏好和一句自我介绍；
// 用户自己发布的需求如果没有这些信息就不参与软性匹配，不瞎猜。

export type ScheduleTag = "早八型" | "白天型" | "夜猫子" | "灵活";
export type TeamStyle = "长期稳定" | "短期搭伙" | "任务导向" | "随缘";

export interface SoftTraits {
  mbti: string;
  schedule: ScheduleTag;
  style: TeamStyle;
  bio: string;
}

export const softTraits: Record<string, SoftTraits> = {
  "mock-1": { mbti: "INTJ", schedule: "夜猫子", style: "任务导向", bio: "设计强迫症，觉得界面丑比功能少更致命" },
  "mock-2": { mbti: "INTP", schedule: "夜猫子", style: "任务导向", bio: "喜欢先把问题拆成模型再动手" },
  "mock-3": { mbti: "ENTP", schedule: "白天型", style: "任务导向", bio: "图表控，一张图能讲清楚就不写三段话" },
  "mock-4": { mbti: "ENFJ", schedule: "灵活", style: "短期搭伙", bio: "上过台也知道紧张，愿意陪你对稿" },
  "mock-5": { mbti: "ISTP", schedule: "夜猫子", style: "任务导向", bio: "实验室常驻，焊板子比说话快" },
  "mock-6": { mbti: "ISFJ", schedule: "白天型", style: "短期搭伙", bio: "排版细节控，字号不统一会难受" },
  "mock-7": { mbti: "ISTJ", schedule: "早八型", style: "长期稳定", bio: "每天七点半到馆，位置固定" },
  "mock-8": { mbti: "ISFJ", schedule: "早八型", style: "长期稳定", bio: "行测比较稳，申论在补" },
  "mock-9": { mbti: "ESFJ", schedule: "白天型", style: "长期稳定", bio: "背单词全靠互相催" },
  "mock-10": { mbti: "INFP", schedule: "灵活", style: "短期搭伙", bio: "讲题喜欢从直觉讲，不爱让人背公式" },
  "mock-11": { mbti: "ISTJ", schedule: "白天型", style: "随缘", bio: "笔记记得很全，愿意互换" },
  "mock-12": { mbti: "ISFP", schedule: "夜猫子", style: "短期搭伙", bio: "改论文改到凌晨是常态" },
  "mock-13": { mbti: "INTP", schedule: "夜猫子", style: "长期稳定", bio: "喜欢读完再讨论，不喜欢空聊" },
  "mock-14": { mbti: "INTJ", schedule: "白天型", style: "长期稳定", bio: "想认真做点东西，不只是挂个名" },
  "mock-15": { mbti: "ESTP", schedule: "灵活", style: "短期搭伙", bio: "顺路接单，拿了就走" },
  "mock-16": { mbti: "ESFJ", schedule: "白天型", style: "短期搭伙", bio: "打印店跑得熟，能顺手装订" },
  "mock-17": { mbti: "ESFP", schedule: "灵活", style: "随缘", bio: "经常帮人带东西，顺手的事" },
  "mock-18": { mbti: "ISTJ", schedule: "白天型", style: "随缘", bio: "书保存得不错，有笔记" },
  "mock-19": { mbti: "ISFP", schedule: "夜猫子", style: "随缘", bio: "琴没弹几次，想找个真会用的人" },
  "mock-20": { mbti: "ESFJ", schedule: "灵活", style: "短期搭伙", bio: "有车，路上可以轮流开" },
  "mock-21": { mbti: "ESTJ", schedule: "早八型", style: "短期搭伙", bio: "赶飞机从不迟到" },
  "mock-22": { mbti: "ISFJ", schedule: "白天型", style: "长期稳定", bio: "作息正常，爱干净" },
  "mock-23": { mbti: "ISTP", schedule: "灵活", style: "短期搭伙", bio: "下学期出去实习，床位空着" },
  "mock-24": { mbti: "ESFP", schedule: "白天型", style: "短期搭伙", bio: "力气还行，管饭就干" },
  "mock-25": { mbti: "ESFJ", schedule: "白天型", style: "长期稳定", bio: "什么都吃，不挑" },
  "mock-26": { mbti: "ENFP", schedule: "夜猫子", style: "长期稳定", bio: "打辅助，脾气好，不骂人" },
  "mock-27": { mbti: "INFP", schedule: "夜猫子", style: "随缘", bio: "萌新，愿意慢慢学" },
  "mock-28": { mbti: "ENFJ", schedule: "夜猫子", style: "短期搭伙", bio: "一般是我在组局" },
  "mock-29": { mbti: "ESTP", schedule: "白天型", style: "长期稳定", bio: "打了三年，能带新手" },
  "mock-30": { mbti: "ISTJ", schedule: "夜猫子", style: "长期稳定", bio: "配速稳定，风雨无阻" },
  "mock-31": { mbti: "ISTP", schedule: "夜猫子", style: "长期稳定", bio: "练了两年，能帮你看动作" },
  "mock-32": { mbti: "ESFJ", schedule: "白天型", style: "随缘", bio: "打后卫，传球优先" },
  "mock-33": { mbti: "ISFP", schedule: "灵活", style: "随缘", bio: "喜欢安静的地方" },
  "mock-34": { mbti: "ESFP", schedule: "早八型", style: "短期搭伙", bio: "起得来，装备齐" },
  "mock-35": { mbti: "ISFP", schedule: "夜猫子", style: "随缘", bio: "不爱剧透，看完才聊" },
  "mock-36": { mbti: "INFP", schedule: "白天型", style: "短期搭伙", bio: "会挑角度，不怕被拍" },
  "mock-37": { mbti: "INFJ", schedule: "夜猫子", style: "长期稳定", bio: "读完会写点笔记" },
  "mock-38": { mbti: "ENTJ", schedule: "白天型", style: "长期稳定", bio: "目标产品岗，准备得很认真" },
  "mock-39": { mbti: "ESFJ", schedule: "白天型", style: "长期稳定", bio: "面过几家，能直接说不足" },
  "mock-40": { mbti: "INTP", schedule: "夜猫子", style: "任务导向", bio: "SQL 比较熟，可以互相出题" },
  "mock-41": { mbti: "ENTP", schedule: "灵活", style: "长期稳定", bio: "教得慢但讲得清" },
  "mock-42": { mbti: "INTJ", schedule: "夜猫子", style: "短期搭伙", bio: "剪片要求高，会给具体修改意见" },
  "mock-43": { mbti: "ISTJ", schedule: "白天型", style: "短期搭伙", bio: "讲题从最基础的开始" },
  "mock-44": { mbti: "ESTP", schedule: "白天型", style: "短期搭伙", bio: "干过几次，流程熟" },
  "mock-45": { mbti: "ENFJ", schedule: "灵活", style: "任务导向", bio: "调研报告写过两篇" },
  "mock-46": { mbti: "ENFP", schedule: "灵活", style: "随缘", bio: "话多，基本不会冷场" },
  "mock-47": { mbti: "INFJ", schedule: "白天型", style: "随缘", bio: "喜欢安静的展和安静的咖啡" },
  "mock-48": { mbti: "ESFJ", schedule: "灵活", style: "短期搭伙", bio: "就在图书馆，能马上给你" },
  "mock-49": { mbti: "ISFJ", schedule: "白天型", style: "随缘", bio: "挺着急的，先谢谢好心人" },
  "mock-50": { mbti: "ISTJ", schedule: "夜猫子", style: "任务导向", bio: "LaTeX 熟练，写作比较稳" },
  "mock-51": { mbti: "ENFJ", schedule: "早八型", style: "长期稳定", bio: "口语练了一年，敢开口" },
  "mock-52": { mbti: "ISTJ", schedule: "白天型", style: "短期搭伙", bio: "讲题耐心，可以按次来" },
  "mock-53": { mbti: "ESFJ", schedule: "灵活", style: "短期搭伙", bio: "互填问卷我一定认真填" },
  "mock-54": { mbti: "ISTP", schedule: "夜猫子", style: "短期搭伙", bio: "实验楼常驻，顺路" },
  "mock-55": { mbti: "ESTJ", schedule: "白天型", style: "随缘", bio: "车保养得不错，可以试骑" },
  "mock-56": { mbti: "ISTJ", schedule: "早八型", style: "短期搭伙", bio: "习惯提前一小时到站" },
  "mock-57": { mbti: "INFP", schedule: "夜猫子", style: "长期稳定", bio: "复习的时候话比较少" },
  "mock-58": { mbti: "ENTP", schedule: "夜猫子", style: "长期稳定", bio: "操作一般，意识还行" },
  "mock-59": { mbti: "ISTP", schedule: "早八型", style: "长期稳定", bio: "公路车，均速 22 左右" },
  "mock-60": { mbti: "ENTJ", schedule: "夜猫子", style: "任务导向", bio: "准备转产品，想找人互练" },
  "mock-61": { mbti: "INFP", schedule: "灵活", style: "随缘", bio: "耳机有纪念意义，真的想找回来" },
};

export function getSoftTraits(postId: string): Partial<SoftTraits> {
  return softTraits[postId] ?? {};
}

/** 转成喂给模型的候选字段；没有软性画像的需求返回空对象，不参与软性匹配。 */
export function softFieldsForCandidate(postId: string): {
  authorMbti?: string;
  authorSchedule?: string;
  authorStyle?: string;
  authorBio?: string;
} {
  const traits = softTraits[postId];
  if (!traits) {
    return {};
  }
  return {
    authorMbti: traits.mbti,
    authorSchedule: traits.schedule,
    authorStyle: traits.style,
    authorBio: traits.bio,
  };
}
