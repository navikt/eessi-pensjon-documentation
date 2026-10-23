import { ActionMenu, Button } from "@navikt/ds-react";
import { MonitorIcon, MoonIcon, SunIcon } from "@navikt/aksel-icons";
import { setThemePreference, useThemePreference, type ThemePreference } from "../lib/theme";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Lyst", Icon: SunIcon },
  { value: "dark", label: "Mørkt", Icon: MoonIcon },
  { value: "system", label: "Følg systemet", Icon: MonitorIcon },
];

/** Compact icon button for switching between light, dark and system theme. */
export function ThemeToggle() {
  const preference = useThemePreference();
  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];
  const label = `Fargetema: ${current.label}`;

  return (
    <ActionMenu>
      <ActionMenu.Trigger>
        <Button
          variant="tertiary"
          data-color="neutral"
          size="small"
          aria-label={label}
          title={label}
          icon={<current.Icon aria-hidden />}
        />
      </ActionMenu.Trigger>
      <ActionMenu.Content align="end">
        <ActionMenu.RadioGroup
          label="Fargetema"
          value={preference}
          onValueChange={(value) => setThemePreference(value as ThemePreference)}
        >
          {OPTIONS.map(({ value, label: optionLabel }) => (
            <ActionMenu.RadioItem key={value} value={value}>
              {optionLabel}
            </ActionMenu.RadioItem>
          ))}
        </ActionMenu.RadioGroup>
      </ActionMenu.Content>
    </ActionMenu>
  );
}
