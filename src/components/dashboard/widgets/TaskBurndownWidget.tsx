import type { WidgetProps } from "../widgetRegistry";

export function TaskBurndownWidget(_props: WidgetProps) {
  // Static SVG chart skeleton — will be replaced with real data
  const w = 280;
  const h = 120;
  const pad = { t: 10, r: 10, b: 24, l: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  // Ideal burn line (straight diagonal)
  const ideal = `M0,0 L${cw},${ch}`;

  // Sample actual burn (slightly below ideal, then plateaus)
  const actual = `M0,0 C${cw * 0.2},${ch * 0.15} ${cw * 0.5},${ch * 0.45} ${cw * 0.65},${ch * 0.55}`;

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map((t) => ({
    y: ch * t,
    x: cw * t,
  }));

  return (
    <div className="flex flex-col h-full px-3 pt-1 pb-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full flex-1"
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${pad.l},${pad.t})`}>
          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={0} y1={g.y} x2={cw} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <line x1={g.x} y1={0} x2={g.x} y2={ch} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            </g>
          ))}
          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={ch} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <line x1={0} y1={ch} x2={cw} y2={ch} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          {/* Ideal line */}
          <path
            d={ideal}
            fill="none"
            stroke="rgba(46,187,204,0.25)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {/* Actual line */}
          <path
            d={actual}
            fill="none"
            stroke="rgba(46,187,204,0.7)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Axis labels */}
          <text x={0} y={ch + 16} fill="rgba(255,255,255,0.25)" fontSize={8} textAnchor="start">
            Sprint start
          </text>
          <text x={cw} y={ch + 16} fill="rgba(255,255,255,0.25)" fontSize={8} textAnchor="end">
            Sprint end
          </text>
        </g>
      </svg>
      <div className="flex items-center gap-3 justify-end text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-px w-3 border-t border-dashed border-primary/40 inline-block" />
          Ideal
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded bg-primary/70 inline-block" />
          Actual
        </span>
      </div>
    </div>
  );
}
