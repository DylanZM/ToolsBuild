import { useEffect, useState } from "react";
import { KbdKey } from "./kbd-key";


 
export default function HeaderKbd() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || ""));
  }, []);

  return (
    <span className="hidden items-center gap-1.5 sm:inline-flex font-bold">
      {isMac ? (
        <KbdKey keyName="meta" size="sm" >
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
