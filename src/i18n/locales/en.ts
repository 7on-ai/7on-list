import type { Dictionary } from "../types";

export const en: Dictionary = {
  meta: {
    title: "7on — Be first to own your Sunday",
    description: "Get the preliminary specs for Sunday, the always-on AI agent that lives on a machine you own.",
  },
  hero: {
    headline: ["Be first to own", "your Sunday."],
    sub: "A private AI that lives on your own machine and gets things done while you live your day.",
    placeholder: "Your email",
    cta: "Send me the specs",
    note: "No spam. The specs now, and one email when your machine is ready.",
  },
  form: {
    success: "You're in. The specs are on their way.",
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
    headline: ["Truly yours."],
    body: "Sunday learns you. No one else does. Your data never trains anyone else's model.",
    cta: "Send me the specs",
  },
  footer: "Built to stay on.",
};
