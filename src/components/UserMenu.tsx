import { ActionMenu, Skeleton } from "@navikt/ds-react";
import { ChevronUpDownIcon, EnterIcon, FilesIcon, LeaveIcon, PersonIcon } from "@navikt/aksel-icons";
import { displayName, initials, type UserState } from "../lib/user";
import { usePathname } from "../lib/router";
import { ThemeToggle } from "./ThemeToggle";

function loginHref(pathname: string): string {
  return `/oauth2/login?${new URLSearchParams({ redirect: pathname || "/" }).toString()}`;
}

/** Bottom-of-sidebar profile area: who is logged in, account actions and theme. */
export function UserMenu({ state }: { state: UserState }) {
  const pathname = usePathname();

  return (
    <div className="ep-user">
      {state.status === "loading" && (
        <div className="ep-user__card" aria-busy="true">
          <Skeleton variant="circle" width={32} height={32} />
          <div className="ep-user__text">
            <Skeleton variant="text" width="7rem" />
            <Skeleton variant="text" width="4rem" />
          </div>
        </div>
      )}

      {state.status === "anonymous" && (
        <a className="ep-user__card ep-user__card--interactive" href={loginHref(pathname)}>
          <span className="ep-user__avatar ep-user__avatar--empty" aria-hidden>
            <PersonIcon />
          </span>
          <span className="ep-user__text">
            <span className="ep-user__name">Logg inn</span>
            <span className="ep-user__meta">Nav-ansatt (Entra ID)</span>
          </span>
          <EnterIcon aria-hidden className="ep-user__chevron" />
        </a>
      )}

      {state.status === "authenticated" && (
        <ActionMenu>
          <ActionMenu.Trigger>
            <button
              type="button"
              className="ep-user__card ep-user__card--interactive"
              aria-label={`Innlogget som ${displayName(state.user.name)}. Åpne brukermeny`}
            >
              <span className="ep-user__avatar" aria-hidden>
                {initials(state.user.name)}
              </span>
              <span className="ep-user__text">
                <span className="ep-user__name">{displayName(state.user.name)}</span>
                <span className="ep-user__meta">
                  {state.user.navIdent ?? state.user.email ?? "Innlogget"}
                  {state.user.local && " · lokal"}
                </span>
              </span>
              <ChevronUpDownIcon aria-hidden className="ep-user__chevron" />
            </button>
          </ActionMenu.Trigger>
          <ActionMenu.Content align="start">
            <ActionMenu.Label>
              {displayName(state.user.name)}
              {state.user.email && <span className="ep-user__menu-email">{state.user.email}</span>}
            </ActionMenu.Label>
            <ActionMenu.Divider />
            {state.user.navIdent && (
              <ActionMenu.Item
                icon={<FilesIcon aria-hidden />}
                onSelect={() => void navigator.clipboard?.writeText(state.user.navIdent ?? "")}
              >
                Kopier NAV-ident ({state.user.navIdent})
              </ActionMenu.Item>
            )}
            <ActionMenu.Item as="a" href="/oauth2/logout" variant="danger" icon={<LeaveIcon aria-hidden />}>
              Logg ut
            </ActionMenu.Item>
          </ActionMenu.Content>
        </ActionMenu>
      )}

      <ThemeToggle />
    </div>
  );
}
