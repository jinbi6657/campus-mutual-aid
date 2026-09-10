export type PromotionTier = "main" | "rotation" | "category_top";

export interface Promotion {
  id: string;
  postId: string;
  tier: PromotionTier;
  groupId?: string;
  tagId?: string;
  endAt: string;
  weight?: number;
}

const base = Date.now();

function hoursFromNow(hours: number): string {
  return new Date(base + hours * 3600_000).toISOString();
}

export const promotions: Promotion[] = [
  {
    id: "promo-top-1",
    postId: "mock-2",
    tier: "category_top",
    groupId: "study",
    tagId: "competition",
    endAt: hoursFromNow(30),
    weight: 5,
  },
  {
    id: "promo-top-2",
    postId: "mock-7",
    tier: "category_top",
    groupId: "study",
    tagId: "exam",
    endAt: hoursFromNow(52),
    weight: 4,
  },
  {
    id: "promo-top-3",
    postId: "mock-15",
    tier: "category_top",
    groupId: "life",
    tagId: "errand",
    endAt: hoursFromNow(10),
    weight: 4,
  },
  {
    id: "promo-top-4",
    postId: "mock-29",
    tier: "category_top",
    groupId: "hobby",
    tagId: "sports",
    endAt: hoursFromNow(72),
    weight: 3,
  },
  {
    id: "promo-top-5",
    postId: "mock-38",
    tier: "category_top",
    groupId: "career",
    tagId: "job",
    endAt: hoursFromNow(96),
    weight: 5,
  },
  {
    id: "promo-top-6",
    postId: "mock-26",
    tier: "category_top",
    groupId: "hobby",
    tagId: "game",
    endAt: hoursFromNow(40),
    weight: 3,
  },
];

export function getCategoryTopPromotions(
  groupId: string,
  tagId: string,
  now = Date.now(),
): Promotion[] {
  return promotions
    .filter((promotion) => {
      if (promotion.tier !== "category_top") {
        return false;
      }
      if (new Date(promotion.endAt).getTime() <= now) {
        return false;
      }
      if (tagId !== "all") {
        return promotion.tagId === tagId;
      }
      if (groupId !== "all") {
        return promotion.groupId === groupId;
      }
      return true;
    })
    .sort((left, right) => (right.weight ?? 0) - (left.weight ?? 0))
    .slice(0, 2);
}
