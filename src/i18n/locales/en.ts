import type { Dictionary } from "../types";

export const en: Dictionary = {
  meta: {
    title: "7on ARC — Be first to own your Sunday",
    description: "7on ARC, AI on the go. Get the preliminary specs for the home of Sunday, the always-on AI agent.",
    ogLine: "Sunday lives on 7on ARC.",
  },
  hero: {
    headline: ["Be first to own", "your Sunday."],
    sub: "ARC comes with a server of its own. Dedicated to you, never shared. Sunday lives there, and gets things done while you live your day.",
    placeholder: "Your email",
    cta: "Get the ARC specs",
    note: "No spam. The specs now, and one email when your ARC is ready.",
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
    headline: "The day your ARC arrives",
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
    tagline: "AI on the go",
    headline: ["Truly yours."],
    body: "Sunday learns you. No one else does. Your data never trains anyone else's model.",
    points: [
      { title: "One server. One person.", line: "Dedicated CPU, RAM and database. Never shared." },
      { title: "Nothing that names you.", line: "Names and numbers are removed before anything is processed." },
      { title: "Memory across time.", line: "See what Sunday knows at any point in time. Add or edit, set aside for now, or erase for good." },
    ],
    cta: "Get the ARC specs",
  },
  prefs: {
    title: "Email preferences",
    /* {email} is replaced with the address */
    intro: "Choose what we send to {email}.",
    options: {
      updates: { label: "Updates", description: "Occasional news about Sunday and ARC, and the email when your ARC is ready." },
      launch: { label: "Launch only", description: "One email when your ARC is ready. Nothing else." },
      none: { label: "Nothing", description: "No more emails from 7on." },
    },
    current: "Current",
    choose: "Choose",
    confirm: "Yes, keep me posted",
    saved: "Saved.",
    invalid: "This link doesn't work. Use the link in your most recent email from 7on.",
    back: "Back to ARC",
  },
  invite: {
    invited: "A friend invited you",
    title: "Want yours sooner?",
    body: "Every friend who gets the specs through your link moves you up the line.",
    copy: "Copy link",
    copied: "Copied",
    share: "Share",
    shareText: "Sunday lives on ARC. Get the specs:",
    pageTitle: "Your place in line",
    place: "Your place",
    friends: "Friends who joined",
    how: "When ARC is ready, we write in the order of the line. A friend counts once their specs arrive.",
    out: "Emails from 7on are turned off for this address, so it isn't in line.",
    manage: "Email preferences",
  },
  footer: "Built to stay on.",
};
