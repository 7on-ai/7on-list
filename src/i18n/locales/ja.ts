import type { Dictionary } from "../types";

export const ja: Dictionary = {
  meta: {
    title: "7on ARC — いち早く、あなたの Sunday を",
    description: "7on ARC、持ち歩ける AI。常時稼働の AI Agent、Sunday が住むマシンの暫定スペックを受け取る。",
    ogLine: "Sunday は 7on ARC に住んでいます。",
  },
  hero: {
    headline: ["いち早く、", "あなたの Sunday を。"],
    sub: "あなただけのマシン、ARC に住むプライベート AI。あなたが毎日を過ごしているあいだに、やるべきことを片づけます。",
    placeholder: "メールアドレス",
    cta: "ARC のスペックを受け取る",
    note: "スパムは送りません。今すぐスペックを、ARC の準備ができたらもう一通だけ。",
  },
  form: {
    success: "登録しました。スペックがまもなく届きます。",
    invalid: "メールアドレスが正しくないようです。",
    required: "メールアドレスを入力してください。",
    error: "問題が発生しました。もう一度お試しください。",
    sending: "送信中…",
    emailLabel: "メールアドレス",
  },
  orbit: {
    headline: ["ひとつの Agent で、", "身のまわりのすべてを。"],
    sub: "電話、メール、カレンダー、家、お金——ひとつの場所で。",
  },
  day: {
    eyebrow: "最初の一日",
    headline: "ARC が届く日",
    moments: [
      {
        time: "07:00",
        tag: "夜明け",
        title: "朝の支度、完了",
        line: "おはようございます。今日は晴れて 24°。9 時の予定は 10 時に移りました。",
      },
      {
        time: "11:30",
        tag: "仕事のあいだに",
        title: "受信箱、整理済み",
        line: "「はい」と返すだけの 3 通には返信しました。確認が必要な 2 通はピン留めしてあります。",
      },
      {
        time: "16:45",
        tag: "移動中",
        title: "用事、完了",
        line: "荷物の配達は明日に変更されました。カレンダーに入れてあります。",
      },
      {
        time: "22:10",
        tag: "消灯",
        title: "家も、おやすみ",
        line: "ドアを施錠し、照明を消して、アラームを 6:30 にセットしました。おやすみなさい。",
      },
    ],
  },
  machine: {
    tagline: "持ち歩ける AI",
    headline: ["本当に、", "あなたのもの。"],
    body: "Sunday はあなたを知っていく。ほかの誰でもなく。あなたのデータが、誰かのモデルの学習に使われることはありません。",
    cta: "ARC のスペックを受け取る",
  },
  prefs: {
    title: "メール設定",
    /* {email} is replaced with the address */
    intro: "{email} にお送りする内容を選んでください。",
    options: {
      updates: { label: "最新情報", description: "Sunday と ARC の最新情報をときどき。ARC の準備ができたときのお知らせも。" },
      launch: { label: "発売のお知らせのみ", description: "ARC の準備ができたときに一通だけ。それ以外は送りません。" },
      none: { label: "受け取らない", description: "7on からのメールを今後お送りしません。" },
    },
    current: "現在の設定",
    choose: "選択",
    confirm: "はい、最新情報を受け取る",
    saved: "保存しました。",
    invalid: "このリンクは使用できません。7on からの最新のメールにあるリンクをお使いください。",
    back: "ARC に戻る",
  },
  invite: {
    invited: "友達からの招待",
    title: "もっと早く手に入れたい？",
    body: "あなたのリンクからスペックを受け取った友達がいるたびに、あなたの順番が繰り上がります。",
    copy: "リンクをコピー",
    copied: "コピーしました",
    share: "共有",
    shareText: "Sunday は ARC に住んでいます。スペックはこちら：",
    pageTitle: "あなたの順番",
    place: "現在の順番",
    friends: "参加した友達",
    how: "ARC の準備ができたら、順番どおりにご連絡します。友達はスペックのメールが届いた時点でカウントされます。",
    out: "このアドレスは 7on からのメールを停止しているため、順番に含まれていません。",
    manage: "メール設定",
  },
  footer: "オンであり続けるために。",
};
