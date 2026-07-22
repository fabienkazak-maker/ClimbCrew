import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { message: error.message || "Erreur de rendu inattendue" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Erreur de rendu ClimbCrew", error, errorInfo);
  }

  render(): ReactNode {
    if (!this.state.message) return this.props.children;
    return (
      <main className="loading-page">
        <section className="card stack">
          <h1>ClimbCrew ne peut pas afficher cette page</h1>
          <p>
            Une erreur inattendue est survenue. Rechargez la page et contactez
            un administrateur si le problème persiste.
          </p>
          <pre>{this.state.message}</pre>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </section>
      </main>
    );
  }
}
