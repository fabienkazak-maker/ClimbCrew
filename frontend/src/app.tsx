import { AppContent } from "./app-content";
import { AuthContext } from "./auth/auth-context";
import { AuthForm } from "./auth/auth-form";
import { useAuthProvider } from "./auth/use-auth-provider";
import { DataContext } from "./data/data-context";
import { useDataProvider } from "./data/use-data-provider";

export function App() {
  const auth = useAuthProvider();
  const data = useDataProvider(Boolean(auth.user));
  return (
    <AuthContext.Provider value={auth}>
      <DataContext.Provider value={data}>
        {auth.loading && (
          <main className="loading-page">Chargement de la session</main>
        )}
        {!auth.loading && !auth.user && <AuthForm />}
        {!auth.loading && auth.user && <AppContent />}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}
