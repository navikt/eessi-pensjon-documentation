import { useEffect } from "react";
import { Theme } from "@navikt/ds-react";
import { Sidebar } from "./components/Sidebar";
import { findPage } from "./lib/navigation";
import { installLinkInterception, usePathname } from "./lib/router";
import { useResolvedTheme } from "./lib/theme";
import { useCurrentUser, type UserState } from "./lib/user";
import { HomePage } from "./pages/HomePage";
import { StatusPage } from "./pages/StatusPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { DevelopmentPage } from "./pages/DevelopmentPage";
import { SedBucPage } from "./pages/SedBucPage";
import { ComingSoonPage, NotFoundPage } from "./pages/ComingSoonPage";

function CurrentPage({ pathname, user }: { pathname: string; user: UserState }) {
  const page = findPage(pathname);
  if (!page) return <NotFoundPage />;
  if (page.href === "/") return <HomePage user={user} />;
  if (page.href === "/status") return <StatusPage user={user} />;
  if (page.href === "/applikasjoner") return <ApplicationsPage />;
  if (page.href === "/arkitektur") return <ArchitecturePage />;
  if (page.href === "/utvikling") return <DevelopmentPage />;
  if (page.href === "/sed-og-buc") return <SedBucPage />;
  return <ComingSoonPage page={page} />;
}

export function App() {
  const pathname = usePathname();
  const theme = useResolvedTheme();
  const user = useCurrentUser();

  useEffect(installLinkInterception, []);

  useEffect(() => {
    const page = findPage(pathname);
    document.title = page && page.href !== "/" ? `${page.label} · EESSI Pensjon` : "EESSI Pensjon · Dokumentasjon";
  }, [pathname]);

  return (
    <Theme theme={theme}>
      <div className="ep-shell">
        <a href="#main" className="ep-skip-link">
          Hopp til hovedinnhold
        </a>
        <Sidebar user={user} />
        <main id="main" className="ep-main" tabIndex={-1}>
          <CurrentPage pathname={pathname} user={user} />
        </main>
      </div>
    </Theme>
  );
}
