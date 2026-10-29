import type { ReactNode } from "react";
import { BodyShort, Button, Skeleton } from "@navikt/ds-react";
import { EnterIcon, PadlockLockedIcon } from "@navikt/aksel-icons";
import { usePathname } from "../lib/router";
import { loginHref, type UserState } from "../lib/user";

/** Shows `children` to logged-in employees and a login prompt to everyone else. */
export function RequireLogin({ user, children }: { user: UserState; children: ReactNode }) {
  const pathname = usePathname();

  if (user.status === "loading") return <Skeleton variant="rounded" height="4.5rem" />;
  if (user.status === "authenticated") return <>{children}</>;

  return (
    <div className="ep-login-required">
      <span className="ep-login-required__icon" aria-hidden>
        <PadlockLockedIcon />
      </span>
      <div className="ep-login-required__text">
        <BodyShort weight="semibold">Krever innlogging</BodyShort>
        <BodyShort size="small" textColor="subtle">
          Logg inn som Nav-ansatt for å se dette.
        </BodyShort>
      </div>
      <Button as="a" href={loginHref(pathname)} size="small" variant="secondary" icon={<EnterIcon aria-hidden />}>
        Logg inn
      </Button>
    </div>
  );
}
