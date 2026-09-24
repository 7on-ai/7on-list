import type { Dictionary } from "../types";

export const ko: Dictionary = {
  meta: {
    title: "7on ARC — 가장 먼저, 나만의 Sunday",
    description: "7on ARC 예비 스펙을 받아보세요. 늘 켜져 있는 AI Agent, Sunday가 사는 기기.",
    ogLine: "Sunday는 7on ARC에 삽니다.",
  },
  hero: {
    headline: ["가장 먼저,", "나만의 Sunday."],
    sub: "당신만의 기기, 7on ARC에 사는 프라이빗 AI. 당신이 하루를 사는 동안, 할 일을 끝내 둡니다.",
    placeholder: "이메일 주소",
    cta: "7on ARC 스펙 받아보기",
    note: "스팸은 없습니다. 지금은 스펙을, 7on ARC가 준비되면 이메일 한 통만 더 보내드립니다.",
  },
  form: {
    success: "등록되었습니다. 스펙이 곧 도착합니다.",
    invalid: "이메일 주소가 올바르지 않은 것 같아요.",
    required: "이메일 주소를 입력해 주세요.",
    error: "문제가 발생했습니다. 다시 시도해 주세요.",
    sending: "보내는 중…",
    emailLabel: "이메일 주소",
  },
  orbit: {
    headline: ["하나의 Agent.", "당신 주변의 모든 것."],
    sub: "전화, 메일, 캘린더, 집, 돈 — 한 곳에서.",
  },
  day: {
    eyebrow: "당신의 첫날",
    headline: "7on ARC가 도착하는 날",
    moments: [
      {
        time: "07:00",
        tag: "첫 햇살",
        title: "아침, 준비 완료",
        line: "좋은 아침이에요. 오늘은 맑고 24°예요. 9시 일정은 10시로 옮겨졌어요.",
      },
      {
        time: "11:30",
        tag: "일하는 동안",
        title: "받은편지함, 정리 완료",
        line: "‘네’라고만 하면 되는 세 통은 답장했어요. 직접 보셔야 할 두 통은 고정해 두었어요.",
      },
      {
        time: "16:45",
        tag: "이동 중",
        title: "볼일, 끝",
        line: "택배가 내일로 변경됐어요. 캘린더에 넣어 두었어요.",
      },
      {
        time: "22:10",
        tag: "소등",
        title: "집도, 잠들 시간",
        line: "문 잠그고, 불 끄고, 알람은 6:30에 맞췄어요. 잘 자요.",
      },
    ],
  },
  machine: {
    headline: ["진정한 당신의 것."],
    body: "Sunday는 당신을 알아갑니다. 다른 누구도 아닌. 당신의 데이터는 결코 누구의 모델 학습에도 쓰이지 않습니다.",
    cta: "7on ARC 스펙 받아보기",
  },
  prefs: {
    title: "이메일 설정",
    /* {email} is replaced with the address */
    intro: "{email}(으)로 보낼 메일을 선택하세요.",
    options: {
      updates: { label: "소식", description: "Sunday와 7on ARC의 새 소식을 가끔, 그리고 7on ARC가 준비되면 알림 메일." },
      launch: { label: "출시 알림만", description: "7on ARC가 준비되면 이메일 한 통. 그 외에는 없습니다." },
      none: { label: "받지 않음", description: "7on에서 더 이상 메일을 보내지 않습니다." },
    },
    current: "현재",
    choose: "선택",
    confirm: "네, 소식 받을게요",
    saved: "저장되었습니다.",
    invalid: "이 링크는 사용할 수 없습니다. 7on에서 받은 최근 메일의 링크를 이용해 주세요.",
    back: "7on ARC로 돌아가기",
  },
  invite: {
    invited: "친구가 초대했어요",
    title: "더 빨리 받고 싶으신가요?",
    body: "내 링크로 스펙을 받은 친구가 생길 때마다 순서가 앞당겨집니다.",
    copy: "링크 복사",
    copied: "복사됨",
    share: "공유",
    shareText: "Sunday는 7on ARC에 삽니다. 스펙 받아보기:",
    pageTitle: "내 대기 순서",
    place: "현재 순서",
    friends: "참여한 친구",
    how: "7on ARC가 준비되면 대기 순서대로 이메일을 보내드립니다. 친구는 스펙 이메일이 도착한 뒤에 집계됩니다.",
    out: "이 주소는 7on 이메일 수신을 끈 상태라 대기열에 없습니다.",
    manage: "이메일 설정",
  },
  footer: "꺼지지 않도록 만들었습니다.",
};
