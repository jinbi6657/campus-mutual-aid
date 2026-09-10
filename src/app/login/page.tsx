"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import {
  authenticate,
  createVerificationRequest,
  demoHash,
  findUser,
  generateInitialPassword,
  loadUsers,
  loadVerificationRequests,
  matchesRoster,
  saveSession,
  saveUsers,
  updateVerificationRequest,
} from "@/lib/auth";

const snippets = [
  { emoji: "🏆", text: "数模找 Python 队友", tag: "竞赛搭子" },
  { emoji: "🍜", text: "今日食堂：三楼香锅排队 20 分钟", tag: "今日食堂" },
  { emoji: "📝", text: "考研自习搭子 · 图书馆四楼", tag: "备考搭子" },
  { emoji: "🚗", text: "国庆拼车回石家庄 · 还差 2 人", tag: "拼车出行" },
  { emoji: "🎮", text: "找晚上一起打王者的搭子", tag: "游戏搭子" },
  { emoji: "🏸", text: "每周三体育馆找羽毛球球友", tag: "运动搭子" },
  { emoji: "🛵", text: "有偿代取快递，到 3 号宿舍楼", tag: "校园跑腿" },
  { emoji: "📚", text: "互换《数据结构》课件和笔记", tag: "课业求助" },
  { emoji: "💼", text: "找求职搭子，互相模拟面试", tag: "求职搭子" },
  { emoji: "🎒", text: "周末去周边爬山，找同伴拼车", tag: "出游搭子" },
  { emoji: "📷", text: "想找互拍搭子，拍校园写真", tag: "摄影搭子" },
  { emoji: "🔍", text: "在操场丢了校园卡，求扩散", tag: "寻物启事" },
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

export default function LoginPage() {
  const router = useRouter();
  const [cards, setCards] = useState<RiverCard[]>([]);
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regMajor, setRegMajor] = useState("");
  const [regClass, setRegClass] = useState("");
  const [regCollege, setRegCollege] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regNote, setRegNote] = useState("");
  const [approvedInfo, setApprovedInfo] = useState<{
    studentId: string;
    password: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState("");

  const [queryId, setQueryId] = useState("");
  const [queryResult, setQueryResult] = useState("");

  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    const layers: {
      count: number;
      blur: number;
      opacity: number;
      size: string;
      speed: number[];
    }[] = (
      isMobile
        ? [
            { count: 4, blur: 7, opacity: 0.18, size: "text-[11px]", speed: [70, 100] },
            { count: 5, blur: 2.5, opacity: 0.3, size: "text-xs", speed: [45, 65] },
            { count: 3, blur: 0, opacity: 0.45, size: "text-sm", speed: [30, 45] },
          ]
        : [
            { count: 10, blur: 7, opacity: 0.2, size: "text-[11px]", speed: [60, 90] },
            { count: 14, blur: 2.5, opacity: 0.36, size: "text-xs", speed: [35, 55] },
            { count: 7, blur: 0, opacity: 0.55, size: "text-sm", speed: [22, 35] },
          ]
    );
    const directions: RiverCard["dir"][] = ["lr", "rl", "tb", "bt"];
    const next: RiverCard[] = [];

    layers.forEach((layer, layerIndex) => {
      for (let index = 0; index < layer.count; index += 1) {
        const snippet = snippets[Math.floor(Math.random() * snippets.length)];
        const duration =
          layer.speed[0] +
          Math.random() * (layer.speed[1] - layer.speed[0]);
        next.push({
          id: `${layerIndex}-${index}`,
          ...snippet,
          dir: directions[Math.floor(Math.random() * directions.length)],
          duration,
          delay: -Math.random() * duration,
          rot: Math.random() * 16 - 8,
          drift: Math.random() * 40 - 20,
          blur: layer.blur,
          opacity: layer.opacity + Math.random() * 0.08,
          size: layer.size,
          pos: Math.random() * 100,
        });
      }
    });

    setCards(next);
  }, []);

  useEffect(() => {
    function handleVisibility() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function handleLogin() {
    setSubmitting(true);
    const result = authenticate(loginId, loginPassword);
    if (!result.ok || !result.user) {
      track("login_fail", { reason: result.error ?? "unknown" });
      setMessage(result.error ?? "登录失败");
      setSubmitting(false);
      return;
    }
    track("login_success", { role: result.user.role });
    saveSession({
      studentId: result.user.studentId,
      role: result.user.role,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
    });
    setSubmitting(false);
    if (result.user.mustChangePassword) {
      router.replace("/change-password");
      return;
    }
    router.replace(result.user.role === "admin" ? "/admin" : "/");
  }

  function handleRegister() {
    if (!regId.trim() || !regName.trim() || !regMajor.trim() || !regClass.trim()) {
      setMessage("学号、姓名、专业、班级都要填写。");
      return;
    }
    const contact = regContact.trim();
    const phoneValid = /^1[3-9]\d{9}$/.test(contact);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!phoneValid && !emailValid) {
      setMessage("请填写有效的手机号（11 位）或邮箱，用于接收初始密码。");
      return;
    }
    if (findUser(regId.trim())) {
      setMessage("该学号已注册，请直接登录或联系管理员重置密码。");
      return;
    }
    const duplicated = loadVerificationRequests().some(
      (item) =>
        item.studentId === regId.trim() &&
        (item.status === "pending" || item.status === "approved"),
    );
    if (duplicated) {
      setMessage("该学号已提交申请，请勿重复提交。");
      return;
    }
    setSubmitting(true);

    const autoMatched = matchesRoster(regId, regName, regMajor, regClass);
    const request = createVerificationRequest({
      studentId: regId.trim(),
      name: regName.trim(),
      major: regMajor.trim(),
      className: regClass.trim(),
      college: regCollege.trim(),
      contact: regContact.trim(),
      autoMatched,
      rejectReason: regNote.trim() ? `申请说明：${regNote.trim()}` : undefined,
    });

    if (autoMatched) {
      const initial = generateInitialPassword();
      updateVerificationRequest(request.id, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        initialPassword: initial,
      });
      const users = loadUsers();
      if (!users.some((user) => user.studentId === regId.trim())) {
        users.push({
          id: regId.trim(),
          studentId: regId.trim(),
          name: regName.trim(),
          major: regMajor.trim(),
          className: regClass.trim(),
          college: regCollege.trim(),
          contact: regContact.trim(),
          passwordHash: demoHash(initial),
          role: "student",
          status: "active",
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        });
        saveUsers(users);
      }
      setApprovedInfo({ studentId: regId.trim(), password: initial });
      track("register_submit", { autoMatched: true });
      track("register_approved", { method: "auto" });
      setSubmitting(false);
      setPendingId("");
      setMessage("");
      return;
    }

    track("register_submit", { autoMatched: false });
    setSubmitting(false);
    setPendingId(regId.trim());
    setApprovedInfo(null);
    setMessage("");
  }

  function handleQuery() {
    const request = loadVerificationRequests().find(
      (item) => item.studentId === queryId.trim(),
    );
    if (!request) {
      setQueryResult("没有找到这个学号的申请记录。");
      return;
    }
    if (request.status === "approved") {
      setQueryResult(
        request.initialPassword
          ? `审核已通过。初始密码：${request.initialPassword}（首次登录后请立即修改）`
          : "审核已通过，请使用初始密码登录。",
      );
      return;
    }
    if (request.status === "rejected") {
      setQueryResult(`审核未通过：${request.rejectReason ?? "信息不匹配"}`);
      return;
    }
    setQueryResult("申请正在人工复核中，请耐心等待。");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7f1]">
      <div className="pointer-events-none absolute inset-0">
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

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-lg font-bold text-white">
              搭
            </span>
            <span className="text-2xl font-bold text-slate-900">搭友</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-snug text-slate-900 sm:text-4xl">
            AI 帮你找到对的人
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5c6b62]">
            找队友、找搭子、找互助，也能逛校园圈聊校园日常。校内账号才能进入，更安全、更靠谱。
          </p>

          <div className="mt-6 space-y-3">
            {[
              { icon: "✨", title: "AI 智能匹配", desc: "一句话描述需求，帮你挑出最合适的人" },
              { icon: "💬", title: "校园圈话题广场", desc: "逛食堂、吐槽选修课、分享周末去处" },
              { icon: "🔐", title: "邀请制 + 校内账号", desc: "学号审核通过才能进入，减少陌生人风险" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7b8a80]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-6">
            {[
              { value: "49+", label: "校园需求" },
              { value: "6", label: "话题社区" },
              { value: "AI", label: "智能匹配" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-[11px] text-[#7b8a80]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl shadow-[#5c6b62]/20">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setMessage("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                tab === "login"
                  ? "bg-slate-900 text-white"
                  : "bg-white/70 text-[#5c6b62]"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setMessage("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                tab === "register"
                  ? "bg-slate-900 text-white"
                  : "bg-white/70 text-[#5c6b62]"
              }`}
            >
              注册申请
            </button>
          </div>

          {tab === "login" ? (
            <div className="mt-5 space-y-3">
              <input
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="学号"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="密码"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleLogin}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
              >
                登录
              </button>
              <p className="text-[11px] text-[#7b8a80]">
                登录后会话 12 小时有效；忘记密码请联系管理员重置。
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              <input
                value={regId}
                onChange={(event) => setRegId(event.target.value)}
                placeholder="学号（必填）"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                value={regName}
                onChange={(event) => setRegName(event.target.value)}
                placeholder="姓名（必填）"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={regMajor}
                  onChange={(event) => setRegMajor(event.target.value)}
                  placeholder="专业（必填）"
                  className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
                <input
                  value={regClass}
                  onChange={(event) => setRegClass(event.target.value)}
                  placeholder="班级（必填）"
                  className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <input
                value={regCollege}
                onChange={(event) => setRegCollege(event.target.value)}
                placeholder="学院（选填）"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                value={regContact}
                onChange={(event) => setRegContact(event.target.value)}
                placeholder="手机号或邮箱（必填，用于接收初始密码）"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                value={regNote}
                onChange={(event) => setRegNote(event.target.value)}
                placeholder="申请说明（选填）"
                className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleRegister}
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
              >
                提交申请
              </button>
            </div>
          )}

          {message ? (
            <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs text-rose-600">
              {message}
            </p>
          ) : null}

          {approvedInfo ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
              <p className="text-xs font-medium text-emerald-700">
                自动比对通过，账号已创建
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                学号：{approvedInfo.studentId}
              </p>
              <p className="text-xs text-emerald-700">
                初始密码：{approvedInfo.password}
              </p>
              <p className="mt-1 text-[11px] text-emerald-600">
                正式版会通过短信/邮箱发送；演示版在页面显示一次，请先登录再修改密码。
              </p>
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setLoginId(approvedInfo.studentId);
                }}
                className="mt-2 w-full rounded-xl bg-emerald-600 py-2 text-xs font-medium text-white"
              >
                去登录
              </button>
            </div>
          ) : null}

          {pendingId ? (
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700">
              学号 {pendingId} 的申请已提交，正在人工复核。审核通过后会生成初始密码。
            </div>
          ) : null}

          <div className="mt-4 border-t border-white/60 pt-3">
            <p className="text-[11px] text-[#7b8a80]">查询审核状态</p>
            <div className="mt-2 flex gap-2">
              <input
                value={queryId}
                onChange={(event) => setQueryId(event.target.value)}
                placeholder="输入学号"
                className="flex-1 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleQuery}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white"
              >
                查询
              </button>
            </div>
            {queryResult ? (
              <p className="mt-2 text-[11px] text-[#5c6b62]">{queryResult}</p>
            ) : null}
          </div>

          <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-[#7b8a80]">
            演示账号：管理员 admin / admin123；学生 20230001 / student123；测试账号 123123 / 123123。
            演示版数据仅保存在本地，用于展示流程。
          </p>
        </div>
      </div>
    </div>
  );
}
