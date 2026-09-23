import { useState, useEffect } from "react";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "@components/shell/AppLayout";
import { Search } from "@/pages/Search";
import { Settings } from "@/pages/Settings";
import { UILibrary } from "@/pages/UILibrary";
import { Auth } from "@/pages/Auth";
import { RouteError } from "@/pages/RouteError";
import { ErrorBoundary } from "@components/primitives/ErrorBoundary";
import { supabase } from "@/lib/supabase";

function Launcher() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDestination(session ? "/app" : "/auth");
    });
  }, []);

  if (!destination) return null;
  return <Navigate to={destination} replace />;
}

const router = createHashRouter([
  { path: "/ui-library", element: <UILibrary />, errorElement: <RouteError /> },
  { path: "/auth",       element: <Auth />,       errorElement: <RouteError /> },
  { path: "/",           element: <Launcher />,   errorElement: <RouteError /> },
  {
    path: "/app",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: null },
      { path: "search",   element: <Search /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

function App() {
  useEffect(() => {
    function blockBrowserReload(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R")) e.preventDefault();
      if (e.key === "F5") e.preventDefault();
    }
    window.addEventListener("keydown", blockBrowserReload);
    return () => window.removeEventListener("keydown", blockBrowserReload);
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
