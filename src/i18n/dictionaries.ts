/* All visitor-facing copy lives here. Add a locale by adding a dictionary
   and listing it in LOCALES — detection and the switcher pick it up. */

export const LOCALES = ["en", "th"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

export type Moment = { time: string; tag: string; title: string; line: string };

/* Thai copy marks allowed line breaks with \u200B (see Phrases) */
export type Dictionary = {
  languageName: string;
  meta: { title: string; description: string };
  hero: {
    /* One entry per display line */
    headline: string[];
    sub: string;
    placeholder: string;
    cta: string;
    note: string;
    /* {count} is replaced with the bold number */
    counter: string;
  };
  form: {
    success: string;
    duplicate: string;
    invalid: string;
    required: string;
    error: string;
    sending: string;
    emailLabel: string;
  };
  orbit: { headline: string[]; sub: string };
  day: { eyebrow: string; headline: string; moments: Moment[] };
  machine: { headline: string[]; body: string; points: string[]; cta: string };
  footer: string;
};

const en: Dictionary = {
  languageName: "English",
  meta: {
    title: "7on — Be first to own your Sunday",
    description:
      "Join the waitlist for Sunday, the always-on AI agent that lives on a machine you own.",
  },
  hero: {
    headline: ["Be first to own", "your Sunday."],
    sub: "A private AI that lives on your own machine and gets things done while you live your day.",
    placeholder: "Your email",
    cta: "Send me the specs",
    note: "No spam. One email when your machine is ready.",
    counter: "{count} people ahead of the launch. Join them.",
  },
  form: {
    success: "You're in. We'll send the specs to your inbox.",
    duplicate: "You're already on the list. We haven't forgotten you.",
    invalid: "That email doesn't look right.",
    required: "Enter your email.",
    error: "Something went wrong. Please try again.",
    sending: "Sending…",
    emailLabel: "Email address",
  },
  orbit: {
    headline: ["One agent.", "Everything around you."],
    sub: "Calls, mail, calendar, home, money — handled from one place.",
  },
  day: {
    eyebrow: "Your first day",
    headline: "The day your machine arrives",
    moments: [
      {
        time: "07:00",
        tag: "First light",
        title: "Morning, handled",
        line: "Good morning. It's 24° and clear, and your 9:00 moved to 10.",
      },
      {
        time: "11:30",
        tag: "While you work",
        title: "Inbox, cleared",
        line: "I replied to the three that only needed a yes. Two need you — they're pinned.",
      },
      {
        time: "16:45",
        tag: "On the move",
        title: "The errand, done",
        line: "Your parcel moved to tomorrow. It's on your calendar.",
      },
      {
        time: "22:10",
        tag: "Lights out",
        title: "House, asleep",
        line: "Doors locked, lights off, alarm set for 6:30. Goodnight.",
      },
    ],
  },
  machine: {
    headline: ["Yours.", "Not rented."],
    body: "Your AI runs on hardware you own. Your data never trains anyone else's model, and never leaves without your say.",
    points: ["On-device memory", "No shared cloud", "Always on"],
    cta: "Send me the specs",
  },
  footer: "Built to stay on.",
};

const th: Dictionary = {
  languageName: "ไทย",
  meta: {
    title: "7on — เป็นคนแรกที่มี Sunday ของคุณเอง",
    description:
      "ลงชื่อรอ Sunday — AI Agent ที่ทำงานตลอดเวลา บนเครื่องที่คุณเป็นเจ้าของ",
  },
  hero: {
    headline: ["เป็นคนแรก", "ที่มี Sunday ของคุณเอง"],
    sub: "AI ส่วนตัว\u200Bที่อยู่บนเครื่อง\u200Bของคุณเอง คอยจัดการ\u200Bเรื่องต่างๆ ให้เสร็จ ระหว่างที่คุณ\u200Bใช้ชีวิต\u200Bในแบบของคุณ",
    placeholder: "อีเมลของคุณ",
    cta: "ส่งสเปกให้ฉัน",
    note: "ไม่มีสแปม ส่งอีเมลเพียงฉบับเดียว\u200Bเมื่อเครื่องของคุณพร้อม",
    counter: "{count} คนรอวันเปิดตัว\u200Bอยู่แล้ว มาร่วมด้วยกัน",
  },
  form: {
    success: "เรียบร้อย เราจะส่งสเปกไปที่อีเมลของคุณ",
    duplicate: "คุณอยู่ในรายชื่อแล้ว เราไม่ลืมคุณแน่นอน",
    invalid: "อีเมลนี้ดูไม่ถูกต้อง",
    required: "กรอกอีเมลของคุณ",
    error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
    sending: "กำลังส่ง…",
    emailLabel: "อีเมล",
  },
  orbit: {
    headline: ["Agent เดียว", "ดูแลทุกอย่างรอบตัวคุณ"],
    sub: "การโทร อีเมล ปฏิทิน บ้าน การเงิน — จัดการได้\u200Bจากที่เดียว",
  },
  day: {
    eyebrow: "วันแรกของคุณ",
    headline: "วันที่เครื่อง\u200Bของคุณ\u200Bมาถึง",
    moments: [
      {
        time: "07:00",
        tag: "แสงแรก",
        title: "เช้านี้ จัดการให้แล้ว",
        line: "อรุณสวัสดิ์ วันนี้ท้องฟ้าแจ่มใส 24 องศา และนัด 9 โมง\u200Bเลื่อนเป็น 10 โมงแล้ว",
      },
      {
        time: "11:30",
        tag: "ระหว่างคุณทำงาน",
        title: "กล่องจดหมาย เคลียร์แล้ว",
        line: "ตอบสามฉบับ\u200Bที่แค่รอคำว่า “ได้” ไปแล้ว อีกสองฉบับ\u200Bต้องให้คุณดูเอง ปักหมุดไว้ให้แล้ว",
      },
      {
        time: "16:45",
        tag: "ระหว่างทาง",
        title: "ธุระ เรียบร้อย",
        line: "พัสดุของคุณ\u200Bเลื่อนเป็นพรุ่งนี้ ลงไว้ในปฏิทินให้แล้ว",
      },
      {
        time: "22:10",
        tag: "ปิดไฟ",
        title: "บ้าน เข้านอนแล้ว",
        line: "ล็อกประตู ปิดไฟ และตั้งปลุก 6:30 แล้ว ราตรีสวัสดิ์",
      },
    ],
  },
  machine: {
    headline: ["ของคุณ", "ไม่ใช่ของเช่า"],
    body: "AI ของคุณทำงาน\u200Bบนฮาร์ดแวร์\u200Bที่คุณเป็นเจ้าของ ข้อมูลของคุณ\u200Bจะไม่ถูกใช้ฝึกโมเดลของใคร และไม่ออกไปไหน\u200Bหากคุณไม่อนุญาต",
    points: ["หน่วยความจำในเครื่อง", "ไม่แชร์คลาวด์กับใคร", "ทำงานตลอดเวลา"],
    cta: "ส่งสเปกให้ฉัน",
  },
  footer: "สร้างมาเพื่อไม่หยุดทำงาน",
};

export const DICTIONARIES: Record<Locale, Dictionary> = { en, th };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/* Pick the best supported locale from an Accept-Language header,
   honouring q-weights (e.g. "th-TH,th;q=0.9,en;q=0.8"). */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) if (isLocale(base)) return base;
  return DEFAULT_LOCALE;
}
