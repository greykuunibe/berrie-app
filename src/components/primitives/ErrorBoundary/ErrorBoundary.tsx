import { Component, type ReactNode } from "react";
import { Button } from "@components/primitives/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function ErrorScreen({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 bg-surface-0 p-8">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <p className="text-sm font-medium text-text-primary">Something went wrong</p>
        {error?.message && (
          <p className="text-xs text-text-muted font-mono bg-surface-2 px-3 py-2 rounded-lg">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onReset}>
          Try again
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}
