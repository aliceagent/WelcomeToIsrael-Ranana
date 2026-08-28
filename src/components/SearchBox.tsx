import { useRef } from "react";
import { SearchIcon } from "./Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

/**
 * The one search bar: high-contrast when filled, with an always-visible ✕
 * to wipe the query and start over.
 */
export function SearchBox({
  value,
  onChange,
  placeholder,
  onSubmit,
  sticky,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  sticky?: boolean;
}) {
  const { lang } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      className={`search${value ? " has-value" : ""}${sticky ? " search-sticky" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <SearchIcon size={22} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={t(lang, "search")}
      />
      {value ? (
        <button
          type="button"
          className="search-clear"
          aria-label={t(lang, "clearSearch")}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <span aria-hidden="true">✕</span>
        </button>
      ) : null}
    </form>
  );
}
