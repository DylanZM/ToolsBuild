import type { IconInput, MorphIconElement } from "morphicons/element";

function apply(el: MorphIconElement, icon: IconInput, animate: boolean) {
  if (animate) el.morphTo(icon);
  else el.set(icon);
}

/**
 * Points the first `<morph-icon>` under `root` at `icon`.
 * Waits for the custom element definition before touching it, so the
 * server-rendered shell is never mutated before upgrade.
 */
export function setIcon(root: ParentNode, icon: IconInput, animate = false) {
  const el = root.querySelector("morph-icon") as MorphIconElement | null;
  if (!el) return;
  if (typeof el.morphTo === "function") {
    apply(el, icon, animate);
    return;
  }
  customElements
    .whenDefined("morph-icon")
    .then(() => apply(el, icon, animate))
    .catch(() => {});
}
