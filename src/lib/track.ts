import { track as vercelTrack } from "@vercel/analytics";

/* Page events for Vercel Web Analytics — cookieless, and never carrying an
   email or anything else that identifies a person. Custom events show up
   once the project is on Vercel Pro; on Hobby these calls are ignored. */
type Events = {
  cta_click: { location: "hero" | "machine" };
  section_view: { section: "orbit" | "day" | "machine" };
  spec_requested: { locale: string };
  form_error: { reason: "invalid" | "rejected" | "server" | "network" };
  invite_shared: { method: "copy" | "share"; from: "form" | "invite_page" };
};

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics must never break the page
  }
}
