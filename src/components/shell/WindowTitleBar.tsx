import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MinusIcon, Square2StackIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function WindowTitleBar() {
  const minimize = () => getCurrentWindow().minimize();
  const toggleMaximize = () => getCurrentWindow().toggleMaximize();
  const close = () => getCurrentWindow().close();
  const startDragging = (e: React.MouseEvent) => {
    if (e.button === 0) getCurrentWindow().startDragging();
  };

  if (isTauri()) {
    return (
      <header className="window-titlebar relative">
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

  return null;
}
