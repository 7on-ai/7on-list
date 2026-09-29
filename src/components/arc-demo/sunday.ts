/* Where the demo's answers come from.

   Today the demo plays examples of what Sunday does, and says so on screen.
   When the backend is ready, add an adapter that sends the request to it —
   the device, the screen and the page don't change. */

export type SundayReply = {
  text: string;
  /* An illustration rather than a live answer — the page labels it */
  example: boolean;
};

export type SundayRequest = {
  locale: string;
  /* Whether the visitor actually spoke (false: no mic, or silence) */
  heard: boolean;
};

export interface SundayAdapter {
  reply(request: SundayRequest): Promise<SundayReply>;
}

/* Takes turns through example lines, one per conversation */
export function exampleAdapter(lines: () => string[]): SundayAdapter {
  let next = 0;
  return {
    async reply() {
      const all = lines();
      const text = all[next % all.length];
      next += 1;
      return { text, example: true };
    },
  };
}
