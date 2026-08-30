import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MinusIcon, Square2StackIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/primitives";
import { Home } from "@Icons";
import { useTabsStore } from "@/stores/tabs.store";

export function WindowTitleBar() {
  const minimize = () => getCurrentWindow().minimize();
  const toggleMaximize = () => getCurrentWindow().toggleMaximize();
  const close = () => getCurrentWindow().close();
  const startDragging = (e: React.MouseEvent) => {
    if (e.button === 0) getCurrentWindow().startDragging();
  };
  const activateTab = useTabsStore((s) => s.activateTab);

  if (isTauri()) {
    return (
      <header className="window-titlebar relative">
        {/* Home button */}
        <div className="shrink-0 ml-2" onMouseDown={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" icon={Home} iconButton className="hover:[&_svg]:text-text-primary!" onClick={() => activateTab("default-home")} aria-label="Home" />
        </div>

        {/* Draggable dead zone */}
        <div className="flex-1 h-full" onMouseDown={startDragging} />

        {/* Window controls only */}
        <div className="window-titlebar__controls self-stretch">
          <button className="control-button" type="button" onClick={minimize} aria-label="Minimize">
            <MinusIcon className="w-4 h-4" />
          </button>
          <button className="control-button" type="button" onClick={toggleMaximize} aria-label="Maximize">
            <Square2StackIcon className="w-4 h-4" />
          </button>
          <button className="control-button-close" type="button" onClick={close} aria-label="Close">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }

  // Browser / dev mode
  return (
    <header className="window-titlebar relative">
      <div className="shrink-0" onMouseDown={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" icon={Home} iconButton onClick={() => activateTab("default-home")} aria-label="Home" />
      </div>
      <div className="flex-1" />
    </header>
  );
}
