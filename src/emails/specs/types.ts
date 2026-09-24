/* Copy for the preliminary specs email, one file per language */
export type SpecsEmail = {
  subject: string;
  /* Inbox preview line shown after the subject */
  preheader: string;
  /* "\n" marks a deliberate line break */
  headline: string;
  intro: string;
  lead: string;
  features: { title: string; body: string }[];
  mindGraph: { title: string; body: string };
  arc: { title: string; body: string };
  stats: { value: string; label: string }[];
  closing: { title: string; body: string };
  /* Text of the link to 7on.ai */
  cta: string;
  signoff: string;
  footer: string;
  disclaimer: string;
};
