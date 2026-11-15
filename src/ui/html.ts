// Tiny helpers for building HTML strings safely. All text goes through esc().

export function esc(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** A button that triggers a UI action. `key` is used to keep keyboard focus across re-renders. */
export function button(opts: {
  act: string;
  label: string;
  arg?: string | number;
  cls?: string;
  disabled?: boolean;
  pressed?: boolean;
  title?: string;
}): string {
  const attrs = [
    `type="button"`,
    `data-act="${esc(opts.act)}"`,
    opts.arg !== undefined ? `data-arg="${esc(opts.arg)}"` : '',
    `data-key="${esc(opts.act)}:${esc(opts.arg ?? '')}"`,
    opts.cls ? `class="${esc(opts.cls)}"` : '',
    opts.disabled ? 'disabled' : '',
    opts.pressed !== undefined ? `aria-pressed="${opts.pressed}"` : '',
    opts.title ? `title="${esc(opts.title)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<button ${attrs}>${opts.label}</button>`;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
