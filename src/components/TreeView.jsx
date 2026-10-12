import { analyze } from '../sim/engine';
import { CLADES, MODE_ICON } from '../sim/data';

export default function TreeView({ world, selectedId, onSelect }) {
  const maxGen = Math.max(world.gen, 1), W = 720, left = 24, right = 200, usable = W - left - right, rowH = 34;
  const xOf = (g) => left + (g / maxGen) * usable;
  let row = 0; const pos = {};
  const layout = (id) => {
    const n = world.nodes[id];
    if (!n.children.length) return (pos[id] = row++);
    const ys = n.children.map(layout);
    return (pos[id] = (ys[0] + ys[ys.length - 1]) / 2);
  };
  layout(world.rootId);
  const H = row * rowH + 30, yOf = (id) => 20 + pos[id] * rowH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tree">
      {Object.values(world.nodes).map((n) => {
        const leaf = !n.children.length, x1 = xOf(n.bornGen), x2 = leaf ? xOf(maxGen) : xOf(n.endGen), y = yOf(n.id);
        const color = CLADES[n.clade].color, sel = n.id === selectedId;
        const info = leaf ? analyze(n) : null;
        return (
          <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={sel ? 5 : 3} strokeLinecap="round" opacity={leaf ? 1 : 0.6} />
            {!leaf && <line x1={x2} y1={yOf(n.children[0])} x2={x2} y2={yOf(n.children[1])} stroke={color} strokeWidth="2" opacity="0.6" />}
            {leaf && (
              <>
                <circle cx={x2} cy={y} r={sel ? 8 : 6} fill={color} stroke={sel ? '#fff' : 'none'} strokeWidth="2" />
                <text x={x2 + 12} y={y + 4} fill="#e6f1ff" fontSize="12">
                  {CLADES[n.clade].icon}{MODE_ICON[info.mode]} #{n.id} {info.zh.replace(/\(.*\)/, '')}{n.isolated ? ' ✔' : ''}
                </text>
              </>
            )}
            {!leaf && sel && <circle cx={x2} cy={y} r="6" fill="none" stroke="#fff" strokeWidth="2" />}
          </g>
        );
      })}
    </svg>
  );
}