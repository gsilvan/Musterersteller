import { useEffect, useState, type RefObject } from 'react';
import type { Position, Viewport } from './viewport';

const thickness = 24;
const format = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

function ticks(origin: number, scale: number, length: number) {
  // Keep centimetre labels readable at every zoom level.
  const target = 60 / scale;
  const power = 10 ** Math.floor(Math.log10(target));
  const major = ([1, 2, 5, 10].find((n) => n * power >= target) ?? 10) * power;
  const step = major / 5;
  const result = [];
  for (let i = Math.ceil(-origin / scale / step); i <= (length - origin) / scale / step; i++) {
    result.push({
      position: origin + i * step * scale,
      label: i % 5 === 0 ? format.format((i * step) / 10 || 0) : null,
    });
  }
  return result;
}

export function Rulers({
  host,
  view,
  width,
  height,
}: {
  host: RefObject<HTMLDivElement | null>;
  view: Viewport;
  width: number;
  height: number;
}) {
  const [pointer, setPointer] = useState<Position | null>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left,
        y = event.clientY - rect.top;
      setPointer(x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null);
    };
    const leave = () => setPointer(null);
    element.addEventListener('pointermove', move, true);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('pointercancel', leave);
    return () => {
      element.removeEventListener('pointermove', move, true);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('pointercancel', leave);
    };
  }, [host]);
  return (
    <>
      <svg
        className="ruler rulerTop"
        width={width}
        height={thickness}
        aria-label="Horizontales Lineal in Zentimetern"
      >
        {ticks(view.x, view.scale, width).map(({ position, label }) => (
          <g key={position}>
            <line x1={position} x2={position} y1={label === null ? 19 : 15} y2={24} />
            {label !== null && (
              <text x={position + 3} y={11}>
                {label}
              </text>
            )}
          </g>
        ))}
        {pointer && <line className="rulerPointer" x1={pointer.x} x2={pointer.x} y1={0} y2={24} />}
      </svg>
      <span className="rulerCorner" aria-hidden="true">
        cm
      </span>
      <svg
        className="ruler rulerRight"
        width={thickness}
        height={height}
        aria-label="Vertikales Lineal in Zentimetern"
      >
        {ticks(view.y, view.scale, height).map(({ position, label }) => (
          <g key={position}>
            <line x1={0} x2={label === null ? 5 : 9} y1={position} y2={position} />
            {label !== null && (
              <text transform={`translate(13 ${position + 3}) rotate(90)`}>{label}</text>
            )}
          </g>
        ))}
        {pointer && <line className="rulerPointer" x1={0} x2={24} y1={pointer.y} y2={pointer.y} />}
      </svg>
    </>
  );
}
