import type { Dictionary } from "../types";

export const ko: Dictionary = {
  meta: {
    title: "7on — 가장 먼저, 나만의 Sunday",
    description: "Sunday 대기자 명단에 등록하세요. 당신의 기기에 사는, 늘 켜져 있는 AI Agent.",
  },
  hero: {
    headline: ["가장 먼저,", "나만의 Sunday."],
    sub: "당신의 기기에 사는 프라이빗 AI. 당신이 하루를 사는 동안, 할 일을 끝내 둡니다.",
    placeholder: "이메일 주소",
    cta: "스펙 받아보기",
    note: "스팸은 없습니다. 지금은 스펙을, 기기가 준비되면 이메일 한 통만 더 보내드립니다.",
    counter: "{count}명이 출시를 기다리고 있습니다. 함께하세요.",
  },
  form: {
    success: "등록되었습니다. 스펙이 곧 도착합니다.",
    duplicate: "이미 명단에 있어요. 잊지 않았습니다.",
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
    headline: "기기가 도착하는 날",
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
    cta: "스펙 받아보기",
  },
  footer: "꺼지지 않도록 만들었습니다.",
};
