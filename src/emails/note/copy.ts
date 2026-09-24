import type { Locale } from "@/i18n/dictionaries";

/* Fixed words around every short email (campaigns and flow notices), plus
   the notice sent when a friend joins through someone's invite link.
   {position} and {friends} are filled in per person. */
export type NoteCopy = {
  /* Why this person is getting the email, by audience */
  reasonUpdates: string;
  reasonLaunch: string;
  preferences: string;
  unsubscribe: string;
  referral: {
    subject: string;
    preheader: string;
    heading: string;
    bodyOne: string;
    bodyMany: string;
    cta: string;
  };
};

export const NOTE_COPY: Record<Locale, NoteCopy> = {
  en: {
    reasonUpdates: "You're receiving this because you asked for occasional news from 7on.",
    reasonLaunch: "You're receiving this because you asked for the 7on ARC specs at 7on.ai.",
    preferences: "Email preferences",
    unsubscribe: "Unsubscribe",
    referral: {
      subject: "You moved up the line",
      preheader: "A friend just got the 7on ARC specs through your link.",
      heading: "A friend just joined.",
      bodyOne: "A friend got the 7on ARC specs through your link. You're now #{position} in line.",
      bodyMany: "{friends} friends have now got the 7on ARC specs through your link. You're #{position} in line.",
      cta: "See your place",
    },
  },
  th: {
    reasonUpdates: "คุณได้รับอีเมลนี้เพราะขอรับข่าวสารจาก 7on เป็นครั้งคราว",
    reasonLaunch: "คุณได้รับอีเมลนี้เพราะขอรับสเปก 7on ARC ที่ 7on.ai",
    preferences: "ตั้งค่าการรับอีเมล",
    unsubscribe: "ยกเลิกการรับอีเมล",
    referral: {
      subject: "คุณได้เลื่อนคิวขึ้นแล้ว",
      preheader: "เพื่อนของคุณเพิ่งรับสเปก 7on ARC ผ่านลิงก์ของคุณ",
      heading: "เพื่อนของคุณ​เพิ่งเข้ามา",
      bodyOne: "เพื่อนคนหนึ่งรับสเปก 7on ARC ผ่านลิงก์ของคุณ ตอนนี้คุณอยู่ลำดับที่ {position}",
      bodyMany: "เพื่อน {friends} คนรับสเปก 7on ARC ผ่านลิงก์ของคุณแล้ว ตอนนี้คุณอยู่ลำดับที่ {position}",
      cta: "ดูลำดับของคุณ",
    },
  },
  "zh-Hans": {
    reasonUpdates: "你收到这封邮件，是因为你订阅了 7on 的不定期动态。",
    reasonLaunch: "你收到这封邮件，是因为你在 7on.ai 索取了 7on ARC 规格。",
    preferences: "邮件偏好设置",
    unsubscribe: "退订",
    referral: {
      subject: "你在队列中前进了",
      preheader: "一位朋友刚通过你的链接获取了 7on ARC 规格。",
      heading: "一位朋友刚刚加入。",
      bodyOne: "一位朋友通过你的链接获取了 7on ARC 规格。你现在排在第 {position} 位。",
      bodyMany: "已有 {friends} 位朋友通过你的链接获取了 7on ARC 规格。你现在排在第 {position} 位。",
      cta: "查看你的位置",
    },
  },
  "zh-Hant": {
    reasonUpdates: "你收到這封信，是因為你訂閱了 7on 的不定期消息。",
    reasonLaunch: "你收到這封信，是因為你在 7on.ai 索取了 7on ARC 規格。",
    preferences: "郵件偏好設定",
    unsubscribe: "取消訂閱",
    referral: {
      subject: "你在隊伍中往前了",
      preheader: "一位朋友剛透過你的連結索取了 7on ARC 規格。",
      heading: "一位朋友剛剛加入。",
      bodyOne: "一位朋友透過你的連結索取了 7on ARC 規格。你現在排在第 {position} 位。",
      bodyMany: "已有 {friends} 位朋友透過你的連結索取了 7on ARC 規格。你現在排在第 {position} 位。",
      cta: "查看你的位置",
    },
  },
  ja: {
    reasonUpdates: "7on からのお知らせを希望されたため、このメールをお送りしています。",
    reasonLaunch: "7on.ai で 7on ARC のスペックをご請求いただいたため、このメールをお送りしています。",
    preferences: "メール設定",
    unsubscribe: "配信停止",
    referral: {
      subject: "順番が繰り上がりました",
      preheader: "友達があなたのリンクから 7on ARC のスペックを受け取りました。",
      heading: "友達が参加しました。",
      bodyOne: "友達があなたのリンクから 7on ARC のスペックを受け取りました。現在 {position} 番目です。",
      bodyMany: "あなたのリンクから 7on ARC のスペックを受け取った友達は {friends} 人になりました。現在 {position} 番目です。",
      cta: "順番を見る",
    },
  },
  ko: {
    reasonUpdates: "7on 소식을 받아보기로 하셔서 이 이메일을 보내드립니다.",
    reasonLaunch: "7on.ai에서 7on ARC 스펙을 요청하셔서 이 이메일을 보내드립니다.",
    preferences: "이메일 설정",
    unsubscribe: "수신 거부",
    referral: {
      subject: "순서가 앞당겨졌습니다",
      preheader: "친구가 회원님의 링크로 7on ARC 스펙을 받았습니다.",
      heading: "친구가 참여했습니다.",
      bodyOne: "친구가 회원님의 링크로 7on ARC 스펙을 받았습니다. 현재 {position}번째입니다.",
      bodyMany: "지금까지 친구 {friends}명이 회원님의 링크로 7on ARC 스펙을 받았습니다. 현재 {position}번째입니다.",
      cta: "내 순서 보기",
    },
  },
  vi: {
    reasonUpdates: "Bạn nhận được email này vì đã đăng ký nhận tin tức thỉnh thoảng từ 7on.",
    reasonLaunch: "Bạn nhận được email này vì đã yêu cầu thông số 7on ARC tại 7on.ai.",
    preferences: "Tùy chọn email",
    unsubscribe: "Hủy đăng ký",
    referral: {
      subject: "Bạn đã được lên trước trong hàng chờ",
      preheader: "Một người bạn vừa nhận thông số 7on ARC qua liên kết của bạn.",
      heading: "Một người bạn vừa tham gia.",
      bodyOne: "Một người bạn đã nhận thông số 7on ARC qua liên kết của bạn. Giờ bạn đang ở vị trí #{position}.",
      bodyMany: "Đã có {friends} người bạn nhận thông số 7on ARC qua liên kết của bạn. Bạn đang ở vị trí #{position}.",
      cta: "Xem vị trí của bạn",
    },
  },
  id: {
    reasonUpdates: "Kamu menerima email ini karena meminta kabar sesekali dari 7on.",
    reasonLaunch: "Kamu menerima email ini karena meminta spesifikasi 7on ARC di 7on.ai.",
    preferences: "Preferensi email",
    unsubscribe: "Berhenti berlangganan",
    referral: {
      subject: "Antreanmu maju",
      preheader: "Seorang teman baru saja mendapatkan spesifikasi 7on ARC lewat tautanmu.",
      heading: "Seorang teman baru bergabung.",
      bodyOne: "Seorang teman mendapatkan spesifikasi 7on ARC lewat tautanmu. Sekarang kamu di posisi #{position}.",
      bodyMany: "Sudah {friends} teman mendapatkan spesifikasi 7on ARC lewat tautanmu. Kamu di posisi #{position}.",
      cta: "Lihat posisimu",
    },
  },
  es: {
    reasonUpdates: "Recibes este email porque pediste noticias ocasionales de 7on.",
    reasonLaunch: "Recibes este email porque pediste la ficha técnica de 7on ARC en 7on.ai.",
    preferences: "Preferencias de email",
    unsubscribe: "Darse de baja",
    referral: {
      subject: "Avanzaste en la fila",
      preheader: "Un amigo acaba de recibir la ficha técnica de 7on ARC con tu enlace.",
      heading: "Un amigo acaba de unirse.",
      bodyOne: "Un amigo recibió la ficha técnica de 7on ARC con tu enlace. Ahora estás en el puesto #{position}.",
      bodyMany: "Ya son {friends} amigos que recibieron la ficha técnica de 7on ARC con tu enlace. Estás en el puesto #{position}.",
      cta: "Ver tu lugar",
    },
  },
  fr: {
    reasonUpdates: "Vous recevez cet e-mail car vous avez demandé des nouvelles occasionnelles de 7on.",
    reasonLaunch: "Vous recevez cet e-mail car vous avez demandé la fiche technique de 7on ARC sur 7on.ai.",
    preferences: "Préférences e-mail",
    unsubscribe: "Se désabonner",
    referral: {
      subject: "Vous avancez dans la file",
      preheader: "Un ami vient de recevoir la fiche technique de 7on ARC grâce à votre lien.",
      heading: "Un ami vient de vous rejoindre.",
      bodyOne: "Un ami a reçu la fiche technique de 7on ARC grâce à votre lien. Vous êtes maintenant n° {position} dans la file.",
      bodyMany: "{friends} amis ont maintenant reçu la fiche technique de 7on ARC grâce à votre lien. Vous êtes n° {position} dans la file.",
      cta: "Voir votre place",
    },
  },
  de: {
    reasonUpdates: "Du bekommst diese E-Mail, weil du gelegentliche Neuigkeiten von 7on angefordert hast.",
    reasonLaunch: "Du bekommst diese E-Mail, weil du auf 7on.ai das 7on ARC-Datenblatt angefordert hast.",
    preferences: "E-Mail-Einstellungen",
    unsubscribe: "Abmelden",
    referral: {
      subject: "Du bist nach vorn gerückt",
      preheader: "Ein Freund hat gerade das 7on ARC-Datenblatt über deinen Link bekommen.",
      heading: "Ein Freund ist dabei.",
      bodyOne: "Ein Freund hat das 7on ARC-Datenblatt über deinen Link bekommen. Du bist jetzt auf Platz {position}.",
      bodyMany: "{friends} Freunde haben das 7on ARC-Datenblatt jetzt über deinen Link bekommen. Du bist auf Platz {position}.",
      cta: "Deinen Platz ansehen",
    },
  },
  pt: {
    reasonUpdates: "Você recebe este e-mail porque pediu novidades ocasionais da 7on.",
    reasonLaunch: "Você recebe este e-mail porque pediu a ficha técnica do 7on ARC em 7on.ai.",
    preferences: "Preferências de e-mail",
    unsubscribe: "Cancelar inscrição",
    referral: {
      subject: "Você avançou na fila",
      preheader: "Um amigo acabou de receber a ficha técnica do 7on ARC pelo seu link.",
      heading: "Um amigo acabou de entrar.",
      bodyOne: "Um amigo recebeu a ficha técnica do 7on ARC pelo seu link. Agora você está na posição #{position}.",
      bodyMany: "Já são {friends} amigos que receberam a ficha técnica do 7on ARC pelo seu link. Você está na posição #{position}.",
      cta: "Ver seu lugar",
    },
  },
};
