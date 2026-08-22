import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  MinusIcon,
  Square2StackIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export function WindowTitleBar() {
  //FUNCTIONS
  //   const appWindow = getCurrentWindow();

  const minimize = async () => {
    await getCurrentWindow().minimize();
  };

  const toggleMaximize = async () => {
    await getCurrentWindow().toggleMaximize();
  };

  const close = async () => {
    await getCurrentWindow().close();
  };

  const startDragging = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      await getCurrentWindow().startDragging();
    }
  };

  //UI COMPONENTS
  if (isTauri()) {
    return (
      <header className="window-titlebar">
        <div
          className="window-titlebar__drag-region"
          onMouseDown={startDragging}
        >
          <h1 className="font-medium">Berrie</h1>
        </div>
        <div className="window-titlebar__controls">
          <button
            className="control-button"
            type="button"
            onClick={minimize}
            aria-label="Minimize"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <button
            className="control-button"
            type="button"
            onClick={toggleMaximize}
            aria-label="Maximize"
          >
            <Square2StackIcon className="w-4 h-4" />
          </button>
          <button
            className="control-button-close"
            type="button"
            onClick={close}
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </header>
    );
  }
  return (
    <header className="window-titlebar px-4">
      <h1 className="font-medium">Berrie</h1>
      <div className="titlebar-actions">
        <button className="titlebar-action-button"></button>
      </div>
    </header>
  );
}
