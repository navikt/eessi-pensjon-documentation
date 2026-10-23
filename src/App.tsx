import { useEffect } from "react";
import { Theme } from "@navikt/ds-react";
import { Sidebar } from "./components/Sidebar";
import { findPage } from "./lib/navigation";
import { installLinkInterception, usePathname } from "./lib/router";
import { useResolvedTheme } from "./lib/theme";
import { useCurrentUser } from "./lib/user";
import { HomePage } from "./pages/HomePage";
import { StatusPage } from "./pages/StatusPage";
import { ComingSoonPage, NotFoundPage } from "./pages/ComingSoonPage";

function CurrentPage({ pathname }: { pathname: string }) {
  const page = findPage(pathname);
  if (!page) return <NotFoundPage />;
  if (page.href === "/") return <HomePage />;
  if (page.href === "/status") return <StatusPage />;
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
          <CurrentPage pathname={pathname} />
        </main>
      </div>
    </Theme>
  );
}
