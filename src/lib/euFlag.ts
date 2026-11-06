/** SVG path for an upright five-point star centred on 0,0. */
export function starPath(outer: number): string {
  const inner = outer * 0.382;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  });
  return `M${pts.join(" L")}Z`;
}

/** Centres of the twelve stars of the EU flag, starting at twelve o'clock. */
export function starRing(radius: number, cx = 0, cy = 0): [number, number][] {
  return Array.from({ length: 12 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    return [+(cx + Math.cos(a) * radius).toFixed(2), +(cy + Math.sin(a) * radius).toFixed(2)];
  });
}
