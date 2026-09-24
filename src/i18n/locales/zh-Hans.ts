import type { Dictionary } from "../types";

export const zhHans: Dictionary = {
  meta: {
    title: "7on — 率先拥有你的 Sunday",
    description: "加入 Sunday 候补名单——一个始终在线、住在你自己机器上的 AI Agent。",
  },
  hero: {
    headline: ["率先拥有", "你的 Sunday。"],
    sub: "一个私人 AI，住在你自己的机器上，在你过好每一天的同时，把事情办妥。",
    placeholder: "你的邮箱",
    cta: "把规格发给我",
    note: "绝不打扰。机器准备就绪时，只发一封邮件。",
    counter: "已有 {count} 人在等待发布。加入他们。",
  },
  form: {
    success: "已加入。我们会把规格发到你的邮箱。",
    duplicate: "你已在名单中，我们没有忘记你。",
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
    headline: "机器到家的那一天",
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
    headline: ["真正属于你。"],
    body: "Sunday 了解你，别人不会。你的数据绝不会用于训练任何人的模型。",
    cta: "把规格发给我",
  },
  footer: "为始终在线而生。",
};
