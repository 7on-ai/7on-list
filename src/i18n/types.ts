export type Moment = { time: string; tag: string; title: string; line: string };

/* Copy for one language. Thai (no spaces between words) marks allowed
   line breaks with \u200B — see Phrases. */
export type Dictionary = {
  meta: { title: string; description: string };
  hero: {
    /* One entry per display line */
    headline: string[];
    sub: string;
    placeholder: string;
    cta: string;
    note: string;
  };
  form: {
    success: string;
    invalid: string;
    required: string;
    error: string;
    sending: string;
    emailLabel: string;
  };
  orbit: { headline: string[]; sub: string };
  day: { eyebrow: string; headline: string; moments: Moment[] };
  machine: { headline: string[]; body: string; cta: string };
  footer: string;
};

