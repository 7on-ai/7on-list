import type { Dictionary } from "../types";

/* French typography: non-breaking spaces ( ) keep "9 h" and "6 h 30" together */
export const fr: Dictionary = {
  meta: {
    title: "7on ARC — Votre Sunday, avant tout le monde",
    description: "7on ARC, l'IA partout avec vous. Recevez la fiche technique préliminaire de l'appareil où vit Sunday, l'agent IA toujours actif.",
    ogLine: "Sunday vit sur 7on ARC.",
  },
  hero: {
    headline: ["Votre Sunday,", "avant tout le monde."],
    sub: "ARC est livré avec son propre serveur. Dédié à vous, jamais partagé. Sunday y vit, et s'occupe de tout pendant que vous vivez votre journée.",
    placeholder: "Votre e-mail",
    cta: "Recevoir la fiche ARC",
    note: "Pas de spam. La fiche technique maintenant, et un seul autre e-mail quand votre ARC sera prêt.",
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
    headline: "Le jour où votre ARC arrive",
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
    tagline: "L'IA partout avec vous",
    headline: ["Vraiment à vous."],
    body: "Sunday apprend à vous connaître. Personne d'autre. Vos données n'entraînent jamais le modèle de qui que ce soit.",
    points: [
      { title: "Un serveur. Une personne.", line: "CPU, RAM et base de données dédiés. Jamais partagés." },
      { title: "Rien qui vous identifie.", line: "Noms et numéros sont retirés avant tout traitement." },
      { title: "Effaçable à tout moment.", line: "Voyez chaque souvenir. Effacez ce que vous voulez." },
    ],
    cta: "Recevoir la fiche ARC",
  },
  prefs: {
    title: "Préférences e-mail",
    /* {email} is replaced with the address */
    intro: "Choisissez ce que nous envoyons à {email}.",
    options: {
      updates: { label: "Nouvelles", description: "Des nouvelles de Sunday et d'ARC de temps en temps, et l'e-mail quand votre ARC sera prêt." },
      launch: { label: "Lancement uniquement", description: "Un e-mail quand votre ARC sera prêt. Rien d'autre." },
      none: { label: "Rien", description: "Plus aucun e-mail de 7on." },
    },
    current: "Actuel",
    choose: "Choisir",
    confirm: "Oui, tenez-moi informé",
    saved: "Enregistré.",
    invalid: "Ce lien ne fonctionne pas. Utilisez le lien de votre e-mail le plus récent de 7on.",
    back: "Retour à ARC",
  },
  invite: {
    invited: "Un ami vous invite",
    title: "Vous le voulez plus tôt\u00A0?",
    body: "Chaque ami qui reçoit la fiche technique grâce à votre lien vous fait avancer dans la file.",
    copy: "Copier le lien",
    copied: "Copié",
    share: "Partager",
    shareText: "Sunday vit sur ARC. Recevez la fiche technique\u00A0:",
    pageTitle: "Votre place dans la file",
    place: "Votre place",
    friends: "Amis inscrits",
    how: "Quand ARC sera prêt, nous écrirons dans l'ordre de la file. Un ami compte dès que sa fiche technique lui est parvenue.",
    out: "Les e-mails de 7on sont désactivés pour cette adresse, elle n'est donc pas dans la file.",
    manage: "Préférences e-mail",
  },
  footer: "Conçu pour rester allumé.",
};
