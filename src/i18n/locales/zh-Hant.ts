import type { Dictionary } from "../types";

export const zhHant: Dictionary = {
  meta: {
    title: "7on ARC — 搶先擁有你的 Sunday",
    description: "7on ARC，隨身 AI。索取 Sunday 之家的初步規格——一個始終在線的 AI Agent。",
    ogLine: "Sunday 住在 7on ARC 裡。",
  },
  hero: {
    headline: ["搶先擁有", "你的 Sunday。"],
    sub: "ARC 附帶一台專屬伺服器。只為你一人，從不共用。Sunday 就住在那裡，在你生活時把事情辦好。",
    placeholder: "你的電子郵件",
    cta: "索取 ARC 規格",
    note: "絕不打擾。現在寄出規格，ARC 就緒時再寄一封信。",
  },
  form: {
    success: "已加入。規格正寄往你的信箱。",
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
    headline: "ARC 到家的那一天",
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
    tagline: "隨身 AI",
    headline: ["真正屬於你。"],
    body: "Sunday 了解你，別人不會。你的資料絕不會用來訓練任何人的模型。",
    points: [
      { title: "一台伺服器，一個人。", line: "專屬的 CPU、記憶體與資料庫，從不共用。" },
      { title: "不留身分痕跡。", line: "處理之前，姓名和號碼都會被移除。" },
      { title: "隨時可刪。", line: "看見每一段記憶，刪除任何內容。" },
    ],
    cta: "索取 ARC 規格",
  },
  prefs: {
    title: "郵件偏好",
    /* {email} is replaced with the address */
    intro: "選擇我們寄給 {email} 的內容。",
    options: {
      updates: { label: "動態", description: "不定期分享 Sunday 與 ARC 的最新消息，以及 ARC 就緒時的通知。" },
      launch: { label: "僅上市通知", description: "ARC 就緒時寄一封信，別無其他。" },
      none: { label: "不接收", description: "不再接收來自 7on 的郵件。" },
    },
    current: "目前",
    choose: "選擇",
    confirm: "好，請告訴我最新動態",
    saved: "已儲存。",
    invalid: "此連結無效。請使用 7on 最近寄給你的郵件中的連結。",
    back: "返回 ARC",
  },
  invite: {
    invited: "朋友邀請你",
    title: "想更早拿到？",
    body: "每位透過你的連結索取規格的朋友，都會讓你在隊伍中往前移。",
    copy: "複製連結",
    copied: "已複製",
    share: "分享",
    shareText: "Sunday 住在 ARC 裡。索取規格：",
    pageTitle: "你的排隊位置",
    place: "你的位置",
    friends: "加入的朋友",
    how: "ARC 就緒時，我們會依隊伍順序寄信。朋友收到規格信後才會計入。",
    out: "此信箱已關閉 7on 的郵件，因此不在隊伍中。",
    manage: "郵件偏好設定",
  },
  footer: "為始終在線而生。",
};
