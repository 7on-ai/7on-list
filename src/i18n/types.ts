export type Moment = { time: string; tag: string; title: string; line: string };

/* Copy for one language. Thai (no spaces between words) marks allowed
   line breaks with \u200B — see Phrases. */
export type Dictionary = {
  meta: {
    title: string;
    description: string;
    /* Second line of the share image */
    ogLine: string;
  };
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
  prefs: {
    title: string;
    intro: string;
    options: Record<"updates" | "launch" | "none", { label: string; description: string }>;
    current: string;
    choose: string;
    confirm: string;
    saved: string;
    invalid: string;
    back: string;
  };
  /* Invite link after asking for the specs, and the place-in-line page */
  invite: {
    /* Shown to someone who arrives on a friend's invite link */
    invited: string;
    title: string;
    body: string;
    copy: string;
    copied: string;
    share: string;
    /* Text shared along with the link */
    shareText: string;
    pageTitle: string;
    place: string;
    friends: string;
    how: string;
    /* Shown when the address has turned off all email */
    out: string;
    manage: string;
  };
  footer: string;
};

