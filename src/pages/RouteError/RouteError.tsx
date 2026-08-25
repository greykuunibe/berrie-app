import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button } from "@components/primitives";

export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let message = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    message = error.statusText || `Error ${error.status}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 bg-surface-0 p-8">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <p className="text-sm font-medium text-text-primary">Something went wrong</p>
        <p className="text-xs text-text-muted font-mono bg-surface-2 px-3 py-2 rounded-lg">
          {message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
          Home
        </Button>
      </div>
    </div>
  );
}
