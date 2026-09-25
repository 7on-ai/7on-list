import type { Dictionary } from "../types";

export const zhHans: Dictionary = {
  meta: {
    title: "7on ARC — 率先拥有你的 Sunday",
    description: "7on ARC，随身 AI。获取 Sunday 之家的初步规格——一个始终在线的 AI Agent。",
    ogLine: "Sunday 住在 7on ARC 里。",
  },
  hero: {
    headline: ["率先拥有", "你的 Sunday。"],
    sub: "ARC 自带一台专属服务器。只为你一人，从不共享。Sunday 就住在那里，在你生活时把事情办好。",
    placeholder: "你的邮箱",
    cta: "获取 ARC 规格",
    note: "绝不打扰。现在发送规格，ARC 就绪时再发一封邮件。",
  },
  form: {
    success: "已加入。规格正在发往你的邮箱。",
    invalid: "这个邮箱地址似乎不正确。",
    required: "请输入你的邮箱。",
    error: "出了点问题，请重试。",
    sending: "发送中…",
    emailLabel: "邮箱地址",
  },
  orbit: {
    headline: ["一个 Agent，", "照看你身边的一切。"],
    sub: "电话、邮件、日程、家居、财务——一处搞定。",
  },
  day: {
    eyebrow: "你的第一天",
    headline: "ARC 到家的那一天",
    moments: [
      {
        time: "07:00",
        tag: "晨光",
        title: "早晨，已安排妥当",
        line: "早上好。今天晴，24°。你 9 点的会改到了 10 点。",
      },
      {
        time: "11:30",
        tag: "你工作时",
        title: "收件箱，已清空",
        line: "只需回一句“好”的三封，我已经回了。有两封需要你亲自看——已置顶。",
      },
      {
        time: "16:45",
        tag: "在路上",
        title: "琐事，办完了",
        line: "你的包裹改到明天送达，已加入日程。",
      },
      {
        time: "22:10",
        tag: "熄灯",
        title: "家，已入睡",
        line: "门已上锁，灯已关，闹钟定在 6:30。晚安。",
      },
    ],
  },
  machine: {
    tagline: "随身 AI",
    headline: ["真正属于你。"],
    body: "Sunday 了解你，别人不会。你的数据绝不会用于训练任何人的模型。",
    points: [
      { title: "一台服务器，一个人。", line: "专属的 CPU、内存与数据库，从不共享。" },
      { title: "不留身份痕迹。", line: "处理之前，姓名和号码都会被移除。" },
      { title: "跨越时间的记忆。", line: "随时查看 Sunday 在任一时刻记得什么。可添加、编辑，暂时遗忘，或永久删除。" },
    ],
    cta: "获取 ARC 规格",
  },
  prefs: {
    title: "邮件偏好",
    /* {email} is replaced with the address */
    intro: "选择我们发送给 {email} 的内容。",
    options: {
      updates: { label: "动态", description: "不定期分享 Sunday 与 ARC 的最新消息，以及 ARC 就绪时的通知。" },
      launch: { label: "仅发布通知", description: "ARC 就绪时发一封邮件，别无其他。" },
      none: { label: "不接收", description: "不再接收来自 7on 的邮件。" },
    },
    current: "当前",
    choose: "选择",
    confirm: "好的，请告诉我最新动态",
    saved: "已保存。",
    invalid: "此链接无效。请使用 7on 最近发给你的邮件中的链接。",
    back: "返回 ARC",
  },
  invite: {
    invited: "朋友邀请你",
    title: "想更早拿到？",
    body: "每位通过你的链接获取规格的朋友，都会让你在队列中前进。",
    copy: "复制链接",
    copied: "已复制",
    share: "分享",
    shareText: "Sunday 住在 ARC 里。获取规格：",
    pageTitle: "你的排队位置",
    place: "你的位置",
    friends: "加入的朋友",
    how: "ARC 就绪时，我们会按队列顺序发信。朋友收到规格邮件后才会计入。",
    out: "此地址已关闭 7on 的邮件，因此不在队列中。",
    manage: "邮件偏好设置",
  },
  footer: "为始终在线而生。",
};
