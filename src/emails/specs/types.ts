/* Copy for the preliminary specs email, one file per language */
export type SpecsEmail = {
  subject: string;
  /* Inbox preview line shown after the subject */
  preheader: string;
  eyebrow: string;
  /* "\n" marks a deliberate line break */
  headline: string;
  intro: string;
  lead: { title: string; body: string };
  featuresTitle: string;
  featuresIntro: string;
  features: { title: string; body: string }[];
  mindGraph: { title: string; body: string };
  arc: { title: string; body: string };
  statsTitle: string;
  stats: { value: string; label: string }[];
  closing: { title: string; body: string };
  cta: string;
  signoff: string;
  /* Opt-in for occasional news, shown only when signed links are available */
  updates: { title: string; body: string; cta: string };
  /* Link text to the email preferences page */
  preferences: string;
  footer: string;
  disclaimer: string;
};
