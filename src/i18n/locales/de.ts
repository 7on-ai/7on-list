import type { Dictionary } from "../types";

export const de: Dictionary = {
  meta: {
    title: "7on ARC — Dein Sunday. Vor allen anderen.",
    description: "Hol dir das vorläufige Datenblatt von 7on ARC – dem Zuhause von Sunday, dem KI-Agenten, der immer an ist.",
  },
  hero: {
    headline: ["Dein Sunday.", "Vor allen anderen."],
    sub: "Eine private KI, die auf 7on ARC lebt, deiner eigenen Maschine, und Dinge erledigt, während du deinen Tag lebst.",
    placeholder: "Deine E-Mail",
    cta: "7on ARC-Datenblatt anfordern",
    note: "Kein Spam. Das Datenblatt jetzt, und nur noch eine E-Mail, wenn dein 7on ARC bereit ist.",
  },
  form: {
    success: "Du bist dabei. Das Datenblatt ist unterwegs.",
    invalid: "Diese E-Mail sieht nicht richtig aus.",
    required: "Gib deine E-Mail ein.",
    error: "Etwas ist schiefgelaufen. Bitte versuch es noch einmal.",
    sending: "Wird gesendet…",
    emailLabel: "E-Mail-Adresse",
  },
  orbit: {
    headline: ["Ein Agent.", "Alles um dich herum."],
    sub: "Anrufe, Mails, Kalender, Zuhause, Geld – alles an einem Ort.",
  },
  day: {
    eyebrow: "Dein erster Tag",
    headline: "Der Tag, an dem dein 7on ARC ankommt",
    moments: [
      {
        time: "07:00",
        tag: "Erstes Licht",
        title: "Morgen, erledigt",
        line: "Guten Morgen. 24° und klar, und dein Termin um 9 ist auf 10 Uhr verschoben.",
      },
      {
        time: "11:30",
        tag: "Während du arbeitest",
        title: "Posteingang, leer",
        line: "Die drei, die nur ein Ja brauchten, habe ich beantwortet. Zwei brauchen dich – sie sind angeheftet.",
      },
      {
        time: "16:45",
        tag: "Unterwegs",
        title: "Besorgung, erledigt",
        line: "Dein Paket kommt erst morgen. Steht in deinem Kalender.",
      },
      {
        time: "22:10",
        tag: "Licht aus",
        title: "Das Haus schläft",
        line: "Türen zu, Licht aus, Wecker auf 6:30. Gute Nacht.",
      },
    ],
  },
  machine: {
    headline: ["Wirklich deins."],
    body: "Sunday lernt dich kennen. Niemand sonst. Deine Daten trainieren nie das Modell eines anderen.",
    cta: "7on ARC-Datenblatt anfordern",
  },
  prefs: {
    title: "E-Mail-Einstellungen",
    /* {email} is replaced with the address */
    intro: "Wähle, was wir an {email} senden.",
    options: {
      updates: { label: "Neuigkeiten", description: "Ab und zu Neues zu Sunday und 7on ARC – und die E-Mail, wenn dein 7on ARC bereit ist." },
      launch: { label: "Nur zum Launch", description: "Eine E-Mail, wenn dein 7on ARC bereit ist. Sonst nichts." },
      none: { label: "Nichts", description: "Keine E-Mails mehr von 7on." },
    },
    current: "Aktuell",
    choose: "Wählen",
    confirm: "Ja, halte mich auf dem Laufenden",
    saved: "Gespeichert.",
    invalid: "Dieser Link funktioniert nicht. Nutze den Link aus deiner neuesten E-Mail von 7on.",
    back: "Zurück zu 7on ARC",
  },
  footer: "Gebaut, um an zu bleiben.",
};
