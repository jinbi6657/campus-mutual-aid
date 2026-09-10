"use client";

import { useEffect, useState } from "react";

const snippets = [
  { emoji: "🏆", text: "数模找 Python 队友" },
  { emoji: "🍜", text: "今日食堂：三楼香锅排队 20 分钟" },
  { emoji: "📝", text: "考研自习搭子 · 图书馆四楼" },
  { emoji: "🚗", text: "国庆拼车回石家庄 · 还差 2 人" },
  { emoji: "🎮", text: "找晚上一起打王者的搭子" },
  { emoji: "🏸", text: "每周三体育馆找羽毛球球友" },
  { emoji: "🛵", text: "有偿代取快递，到 3 号宿舍楼" },
  { emoji: "📚", text: "互换《数据结构》课件和笔记" },
  { emoji: "💼", text: "找求职搭子，互相模拟面试" },
  { emoji: "🎒", text: "周末去周边爬山，找同伴拼车" },
  { emoji: "📷", text: "想找互拍搭子，拍校园写真" },
  { emoji: "🔍", text: "在操场丢了校园卡，求扩散" },
];

interface RiverCard {
  id: string;
  emoji: string;
  text: string;
  dir: "lr" | "rl" | "tb" | "bt";
  duration: number;
  delay: number;
  rot: number;
  drift: number;
  blur: number;
  opacity: number;
  size: string;
  pos: number;
}

export function RiverBackground({
  variant = "full",
}: {
  variant?: "full" | "subtle";
}) {
  const [cards, setCards] = useState<RiverCard[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    const fullLayers = isMobile
      ? [
          { count: 4, blur: 7, opacity: 0.16, size: "text-[11px]", speed: [70, 100] },
          { count: 5, blur: 2.5, opacity: 0.26, size: "text-xs", speed: [45, 65] },
          { count: 3, blur: 0, opacity: 0.4, size: "text-sm", speed: [30, 45] },
        ]
      : [
            { count: 10, blur: 7, opacity: 0.2, size: "text-[11px]", speed: [60, 90] },
            { count: 14, blur: 2.5, opacity: 0.36, size: "text-xs", speed: [35, 55] },
            { count: 7, blur: 0, opacity: 0.55, size: "text-sm", speed: [22, 35] },
          ];
    const subtleLayers = isMobile
      ? [
          { count: 3, blur: 8, opacity: 0.08, size: "text-[11px]", speed: [90, 130] },
          { count: 5, blur: 3, opacity: 0.13, size: "text-xs", speed: [55, 85] },
          { count: 3, blur: 0, opacity: 0.18, size: "text-sm", speed: [40, 60] },
        ]
      : [
            { count: 6, blur: 8, opacity: 0.1, size: "text-[11px]", speed: [80, 120] },
            { count: 8, blur: 3, opacity: 0.16, size: "text-xs", speed: [50, 80] },
            { count: 4, blur: 0, opacity: 0.22, size: "text-sm", speed: [35, 55] },
          ];
    const layers = variant === "full" ? fullLayers : subtleLayers;

    const directions: RiverCard["dir"][] = ["lr", "rl", "tb", "bt"];
    const next: RiverCard[] = [];

    layers.forEach((layer, layerIndex) => {
      for (let index = 0; index < layer.count; index += 1) {
        const snippet = snippets[Math.floor(Math.random() * snippets.length)];
        const duration =
          layer.speed[0] + Math.random() * (layer.speed[1] - layer.speed[0]);
        next.push({
          id: `${variant}-${layerIndex}-${index}`,
          ...snippet,
          dir: directions[Math.floor(Math.random() * directions.length)],
          duration,
          delay: -Math.random() * duration,
          rot: Math.random() * 16 - 8,
          drift: Math.random() * 40 - 20,
          blur: layer.blur,
          opacity: layer.opacity + Math.random() * 0.06,
          size: layer.size,
          pos: Math.random() * 100,
        });
      }
    });

    setCards(next);
  }, [variant]);

  useEffect(() => {
    function handleVisibility() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {cards.map((card) => {
        const style = {
          animationName: `river-${card.dir}`,
          animationDuration: `${card.duration}s`,
          animationDelay: `${card.delay}s`,
          opacity: card.opacity,
          filter: card.blur ? `blur(${card.blur}px)` : undefined,
          "--rot": `${card.rot}deg`,
          "--drift": `${card.drift}px`,
          animationPlayState: paused ? "paused" : "running",
        } as React.CSSProperties;
        if (card.dir === "lr" || card.dir === "rl") {
          style.top = `${card.pos}%`;
        } else {
          style.left = `${card.pos}%`;
        }
        return (
          <div
            key={card.id}
            className={`river-card whitespace-nowrap rounded-xl border border-white/60 bg-[#fffdfa]/80 px-3 py-2 shadow-sm ${card.size} text-[#5c6b62]`}
            style={style}
          >
            <span className="mr-1">{card.emoji}</span>
            {card.text}
          </div>
        );
      })}
    </div>
  );
}
