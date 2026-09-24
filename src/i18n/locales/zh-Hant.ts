import type { Dictionary } from "../types";

export const zhHant: Dictionary = {
  meta: {
    title: "7on — 搶先擁有你的 Sunday",
    description: "加入 Sunday 候補名單——始終在線、住在你自己機器上的 AI Agent。",
  },
  hero: {
    headline: ["搶先擁有", "你的 Sunday。"],
    sub: "一個私人 AI，住在你自己的機器上，在你過好每一天的同時，把事情辦妥。",
    placeholder: "你的電子郵件",
    cta: "把規格寄給我",
    note: "絕不打擾。機器準備就緒時，只寄一封信。",
    counter: "已有 {count} 人在等待上市。加入他們。",
  },
  form: {
    success: "已加入。我們會把規格寄到你的信箱。",
    duplicate: "你已在名單上，我們沒有忘記你。",
    invalid: "這個電子郵件看起來不太對。",
    required: "請輸入你的電子郵件。",
    error: "發生錯誤，請再試一次。",
    sending: "傳送中…",
    emailLabel: "電子郵件",
  },
  orbit: {
    headline: ["一個 Agent，", "照顧你身邊的一切。"],
    sub: "電話、郵件、行事曆、居家、財務——一處搞定。",
  },
  day: {
    eyebrow: "你的第一天",
    headline: "機器到家的那一天",
    moments: [
      {
        time: "07:00",
        tag: "晨光",
        title: "早晨，已安排妥當",
        line: "早安。今天晴朗，24°。你 9 點的會議改到 10 點了。",
      },
      {
        time: "11:30",
        tag: "你工作時",
        title: "收件匣，已清空",
        line: "只需回一句「好」的三封，我已經回了。有兩封需要你親自看——已置頂。",
      },
      {
        time: "16:45",
        tag: "在路上",
        title: "瑣事，辦好了",
        line: "你的包裹改到明天送達，已加入行事曆。",
      },
      {
        time: "22:10",
        tag: "熄燈",
        title: "家，已入睡",
        line: "門已上鎖，燈已關，鬧鐘設在 6:30。晚安。",
      },
    ],
  },
  machine: {
    headline: ["真正屬於你。"],
    body: "Sunday 了解你，別人不會。你的資料絕不會用來訓練任何人的模型。",
    cta: "把規格寄給我",
  },
  footer: "為始終在線而生。",
};
