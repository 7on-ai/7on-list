import type { Dictionary } from "../types";

/* French typography: non-breaking spaces ( ) keep "9 h" and "6 h 30" together */
export const fr: Dictionary = {
  meta: {
    title: "7on — Votre Sunday, avant tout le monde",
    description: "Recevez la fiche technique préliminaire de Sunday, l'agent IA toujours actif qui vit sur une machine à vous.",
  },
  hero: {
    headline: ["Votre Sunday,", "avant tout le monde."],
    sub: "Une IA privée qui vit sur votre propre machine et s'occupe de tout pendant que vous vivez votre journée.",
    placeholder: "Votre e-mail",
    cta: "Recevoir la fiche technique",
    note: "Pas de spam. La fiche technique maintenant, et un seul autre e-mail quand votre machine sera prête.",
  },
  form: {
    success: "C'est noté. La fiche technique est en route.",
    invalid: "Cet e-mail ne semble pas valide.",
    required: "Saisissez votre e-mail.",
    error: "Un problème est survenu. Veuillez réessayer.",
    sending: "Envoi…",
    emailLabel: "Adresse e-mail",
  },
  orbit: {
    headline: ["Un seul agent.", "Tout ce qui vous entoure."],
    sub: "Appels, e-mails, agenda, maison, argent — gérés depuis un seul endroit.",
  },
  day: {
    eyebrow: "Votre premier jour",
    headline: "Le jour où votre machine arrive",
    moments: [
      {
        time: "07:00",
        tag: "Premières lueurs",
        title: "Le matin, réglé",
        line: "Bonjour. 24° et ciel dégagé, et votre réunion de 9 h passe à 10 h.",
      },
      {
        time: "11:30",
        tag: "Pendant que vous travaillez",
        title: "Boîte de réception, vidée",
        line: "J'ai répondu aux trois messages qui n'attendaient qu'un oui. Deux ont besoin de vous — ils sont épinglés.",
      },
      {
        time: "16:45",
        tag: "En route",
        title: "La course, faite",
        line: "Votre colis est reporté à demain. C'est dans votre agenda.",
      },
      {
        time: "22:10",
        tag: "Extinction des feux",
        title: "La maison, endormie",
        line: "Portes verrouillées, lumières éteintes, réveil à 6 h 30. Bonne nuit.",
      },
    ],
  },
  machine: {
    headline: ["Vraiment à vous."],
    body: "Sunday apprend à vous connaître. Personne d'autre. Vos données n'entraînent jamais le modèle de qui que ce soit.",
    cta: "Recevoir la fiche technique",
  },
  footer: "Conçu pour rester allumé.",
};
