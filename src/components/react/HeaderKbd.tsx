import { useEffect, useState } from "react";
import { KbdKey } from "./kbd-key";

/**
 * Atajos del botón de búsqueda del Header: dos keycaps estilo
 * Spectrum (se hunden al mantener la tecla real). La leyenda del
 * modificador cambia a ⌘ en plataformas Apple tras la hidratación,
 * igual que hacía el script data-shortcut-mod que reemplaza.
 */
export default function HeaderKbd() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || ""));
  }, []);

  return (
    <span className="hidden items-center gap-1.5 sm:inline-flex">
      {isMac ? (
        <KbdKey keyName="meta" size="sm">
          ⌘
        </KbdKey>
      ) : (
        <KbdKey keyName="ctrl" size="sm">
          Ctrl
        </KbdKey>
      )}
      <KbdKey size="sm">K</KbdKey>
    </span>
  );
}
