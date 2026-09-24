import { Fragment } from "react";

/* Split on spaces and zero-width spaces (U+200B). Thai has no spaces between
   words, so browsers break it wherever their dictionary allows — often
   mid-phrase. Copy marks the allowed break points instead. */
export function splitPhrases(text: string) {
  return text.split(/(\s+|​)/).filter(Boolean);
}

/* Chinese and Japanese may break between any two characters, so a run of
   them must stay wrappable; everything else is held together per phrase. */
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

export function phraseClass(part: string) {
  return CJK.test(part) ? "" : "whitespace-nowrap";
}

/* Renders text so lines break only between phrases */
export function Phrases({ text }: { text: string }) {
  return (
    <>
      {splitPhrases(text).map((part, i) =>
        part === "​" ? (
          <wbr key={i} />
        ) : /^\s+$/.test(part) ? (
          <Fragment key={i}>{part}</Fragment>
        ) : (
          <span key={i} className={phraseClass(part)}>
            {part}
          </span>
        )
      )}
    </>
  );
}
