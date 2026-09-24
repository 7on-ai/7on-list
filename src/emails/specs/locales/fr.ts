import type { SpecsEmail } from "../types";

/* French typography: non-breaking spaces ( ) before : ; ! ? % and inside numbers */
export const fr: SpecsEmail = {
  subject: "Sunday, de près.",
  preheader: "Un premier regard sur votre IA souveraine et la machine où elle vit.",
  headline: "Sunday, de près.",
  intro: "Merci d'être parmi les premiers. Voici un premier regard sur Sunday et la machine où elle vit.",
  lead: "Sunday ne se contente pas de répondre. Elle agit — sur une machine bien à elle, pour une seule personne. Vous.",
  features: [
    {
      title: "Autodidacte.",
      body: "Demandez-lui ce qu'elle ne sait pas encore faire. Sunday acquiert la compétence, vous demande la permission et la garde pour de bon.",
    },
    {
      title: "Elle passe l'appel.",
      body: "Sunday a son propre numéro de téléphone. Elle compose, parle, et revient avec ce qui s'est dit.",
    },
    {
      title: "Aucune empreinte de données.",
      body: "Les noms et les numéros sont retirés avant tout traitement. Le modèle réfléchit, mais ne sait jamais qui vous êtes.",
    },
    {
      title: "Changez de modèle. Gardez la mémoire.",
      body: "Utilisez nos modèles ou apportez le vôtre. Votre mémoire et votre historique restent sur votre machine — jamais dans un laboratoire.",
    },
  ],
  mindGraph: {
    title: "Mind Graph.",
    body: "Transparence absolue, contrôle total. Examinez chaque connexion, retracez chaque souvenir, effacez ce que vous voulez, quand vous voulez.",
  },
  arc: {
    title: "7on ARC.",
    body: "Un disque de métal brossé à la face de verre éclairée de rouge. Sur votre bureau, à votre chevet, en réunion. Home Assistant se connecte en un clic.",
  },
  stats: [
    { value: "30 000+", label: "Compétences qui s'étendent d'elles-mêmes" },
    { value: "78,57 %", label: "LongMemEval-S — au-delà du meilleur score précédent, 76,88 %" },
    { value: "1 Go", label: "Stockage chiffré, verrouillé avant qu'un seul octet ne parte vers le cloud" },
    { value: "Illimitée", label: "Capacité du Mind Graph" },
  ],
  closing: {
    title: "Une machine. Une personne.",
    body: "Sunday passe vos appels, tient votre agenda et se souvient de ce que vous lui avez dit il y a des mois.",
  },
  cta: "Découvrir 7on.ai",
  signoff: "L'équipe 7on",
  footer:
    "Vous recevez cet e-mail parce que vous avez demandé la fiche technique sur 7on.ai. Pas de spam — un seul autre e-mail quand votre machine sera prête. Répondez « unsubscribe » pour vous désinscrire.",
  disclaimer: "Caractéristiques préliminaires, susceptibles d'évoluer avant le lancement.",
};
