/**
 * Isolates a phone number from the surrounding text direction. In Hebrew
 * (RTL) contexts, digit/slash/asterisk sequences like "107 / *9107" or
 * "09-7610310" otherwise get visually scrambled by the bidi algorithm.
 */
export function Phone({ n }: { n: string }) {
  return (
    <span className="phone-ltr" dir="ltr">
      {n}
    </span>
  );
}
