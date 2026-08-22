import {useEffect, useState} from "react";
import {WindowTitleBar} from "@components/shell/WindowTitleBar";
import {Button} from "@components/primitives";
import {Check} from "@Icons";
import {UILibrary} from "@/pages/UILibrary";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
}

function App() {
  const hash = useHashRoute();

  if (hash === "#/ui-library") {
    return <UILibrary />;
  }

  return (
    <>
      <WindowTitleBar />
      <main className={`h-[calc(100vh-40px)] w-full px-2 pb-2 bg-surface-0`}>
        <div className="flex flex-col items-center justify-center gap-5 h-full w-full bg-surface-1 border border-border-gray-1 rounded-2xl ">
          <Button variant="primary" icon={Check} >Click me</Button>
          <Button variant="secondary" icon={Check} >Click me</Button>
          <Button variant="brand" icon={Check} >Click me</Button>
          <Button variant="ghost" icon={Check} >Click me</Button>
        </div>
      </main>
    </>
  );
}

export default App;
