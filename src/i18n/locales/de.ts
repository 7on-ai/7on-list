import type { Dictionary } from "../types";

export const de: Dictionary = {
  meta: {
    title: "7on — Dein Sunday. Vor allen anderen.",
    description:
      "Trag dich in die Warteliste für Sunday ein – den KI-Agenten, der immer an ist und auf deiner eigenen Maschine lebt.",
  },
  hero: {
    headline: ["Dein Sunday.", "Vor allen anderen."],
    sub: "Eine private KI, die auf deiner eigenen Maschine lebt und Dinge erledigt, während du deinen Tag lebst.",
    placeholder: "Deine E-Mail",
    cta: "Schick mir das Datenblatt",
    note: "Kein Spam. Eine einzige E-Mail, wenn deine Maschine bereit ist.",
    counter: "{count} Menschen warten schon auf den Launch. Sei dabei.",
  },
  form: {
    success: "Du bist dabei. Wir schicken dir das Datenblatt per E-Mail.",
    duplicate: "Du stehst schon auf der Liste. Wir haben dich nicht vergessen.",
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
    headline: "Der Tag, an dem deine Maschine ankommt",
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
    headline: ["Deins.", "Nur deins."],
    body: "Sunday lernt dich kennen. Niemand sonst. Deine Daten trainieren nie das Modell eines anderen.",
    cta: "Schick mir das Datenblatt",
  },
  footer: "Gebaut, um an zu bleiben.",
};
