import { useEffect, useState } from 'react';
import { ENV_DEFS, HABITATS, TRAIT_LABELS, DIET_LABELS, MAX_SPECIES, ISOLATION_THRESHOLD, CLADES, MODE_ICON } from './sim/data';
import { createWorld, advance, splitNode, leavesOf, analyze, computeTargets, distance, lineage } from './sim/engine';
import TreeView from './components/TreeView';
import CreatureCanvas from './components/CreatureCanvas';
import AIPanel from './components/AIPanel';

function Bar({ label, v, target }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="track"><i style={{ width: `${v}%` }} /><b style={{ left: `${target}%` }} title={`環境目標 ${target.toFixed(0)}`} /></div>
      <em>{v.toFixed(0)}</em>
    </div>
  );
}

export default function App() {
  const [world, setWorld] = useState(() => createWorld());
  const [sel, setSel] = useState(1);
  const [strength, setStrength] = useState(0.015);
  const [auto, setAuto] = useState(false);
  const [newHab, setNewHab] = useState('desert');
  const mutate = (fn) => setWorld((w) => { const c = structuredClone(w); fn(c); return c; });

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => mutate((w) => advance(w, 5, strength)), 120);
    return () => clearInterval(id);
  }, [auto, strength]);

  const sp = world.nodes[sel] ?? world.nodes[world.rootId];
  const editable = !sp.children.length;
  const info = analyze(sp), tg = computeTargets(sp);
  const nLeaves = leavesOf(world).length;
  const parent = sp.parent ? world.nodes[sp.parent] : null;
  const sister = parent ? world.nodes[parent.children.find((c) => c !== sp.id)] : null;
  const dist = sister && !sister.children.length ? distance(sp, sister) : null;
  const events = lineage(world, sp.id).flatMap((n) => n.log.map((l) => ({ ...l, id: n.id }))).sort((a, b) => a.gen - b.gen).slice(-14);
  const fl = info.flight;

  const doSplit = () => { mutate((w) => splitNode(w, sp.id, newHab)); };
  const reset = () => { setAuto(false); setWorld(createWorld()); setSel(1); };
  const setEnv = (k, v) => mutate((w) => { w.nodes[sp.id].env[k] = v; });
  const setHab = (h) => mutate((w) => { const n = w.nodes[sp.id]; n.habitat = h; n.env = { ...HABITATS[h].env }; });
  const syncAll = () => mutate((w) => { leavesOf(w).forEach((n) => { n.env = { ...sp.env }; n.habitat = sp.habitat; }); });

  return (
    <div className="app">
      <header>
        <h1>🧬 物種形成模擬器</h1>
        <span>第 {world.gen} 代 · 物種 {nLeaves}/{MAX_SPECIES}</span>
      </header>

      {/* 左:演化樹 + 控制 */}
      <section className="panel col1">
        <h3>🌳 演化樹(點擊選取)</h3>
        <TreeView world={world} selectedId={sel} onSelect={setSel} />
        <div className="row wrap">
          {[10, 100, 500].map((n) => <button key={n} onClick={() => mutate((w) => advance(w, n, strength))}>+{n} 代</button>)}
          <button className={auto ? 'on' : ''} onClick={() => setAuto(!auto)}>{auto ? '⏸ 暫停' : '▶ 自動演化'}</button>
          <button className="mini" onClick={reset}>重設</button>
        </div>
        <label className="small">演化強度 {strength.toFixed(3)}(預設 0.015)
          <input type="range" min="0.005" max="0.05" step="0.001" value={strength} onChange={(e) => setStrength(+e.target.value)} />
        </label>
        <div className="row wrap">
          <button disabled={!editable || nLeaves >= MAX_SPECIES} onClick={doSplit}>🔀 分支此物種</button>
          <span className="small">新族群遷往</span>
          <select value={newHab} onChange={(e) => setNewHab(e.target.value)}>
            {Object.entries(HABITATS).map(([k, h]) => <option key={k} value={k}>{h.icon} {h.label}</option>)}
          </select>
        </div>
        <p className="small">💡 兩個姊妹族群若留在<b>同一棲地</b>,基因流會把它們拉回一起,不會分化;遷往<b>不同棲地</b>(地理隔離)才會各自演化。遺傳距離 ≥ {ISOLATION_THRESHOLD} 即生殖隔離,成為新物種。</p>
        <h3>📜 演化事件(此譜系)</h3>
        <ul className="log">{events.map((e, i) => <li key={i}><b>G{e.gen}</b> #{e.id} {e.text}</li>)}</ul>
      </section>

      {/* 中:生物 */}
      <section className="panel col2">
        <h3>{CLADES[sp.clade].icon} #{sp.id} {info.zh}{!editable && '(祖先,只讀)'}</h3>
        <CreatureCanvas sp={sp} />
        <div className="chips">
          <span style={{ background: CLADES[sp.clade].color }}>{CLADES[sp.clade].zh}</span>
          <span>{MODE_ICON[info.mode]} {{ aquatic: '水生', flying: '飛行', gliding: '滑翔/短飛', land: '陸行' }[info.mode]}</span>
          <span>🍽️ {info.diet.zh}</span>
          <span>{HABITATS[sp.habitat].icon} {HABITATS[sp.habitat].label}</span>
        </div>
        {sp.wing > 0 || sp.traits.wing > 10 ? (
          <p className="small">✈️ 升力 {fl.lift.toFixed(0)} vs 負重 {fl.load.toFixed(0)} → {fl.canFly ? '升力足夠,能飛' : '升力不足(或翅膀未夠大),不能持續飛行'}</p>
        ) : null}
        {sister && (
          <p className="small">
            姊妹 #{sister.id}:{dist !== null ? <>遺傳距離 <b>{dist.toFixed(1)}</b>/{ISOLATION_THRESHOLD}</> : '已再分支'} —{' '}
            {sp.isolated ? <b className="ok">✔ 已生殖隔離(獨立物種)</b> : '仍可交配(同一物種的不同族群)'}
          </p>
        )}
        <h4>性狀(白色刻度=環境要求的目標值)</h4>
        {Object.entries(TRAIT_LABELS).map(([k, l]) => <Bar key={k} label={l} v={sp.traits[k]} target={tg[k]} />)}
        <h4>食性基因</h4>
        {Object.entries(DIET_LABELS).map(([k, l]) => <Bar key={k} label={l} v={sp.diet[k]} target={tg[k]} />)}
      </section>

      {/* 右:環境 + AI */}
      <div className="col3">
        <section className="panel">
          <h3>🌍 環境({editable ? '可調' : '祖先只讀'})</h3>
          <div className="habs">
            {Object.entries(HABITATS).map(([k, h]) => (
              <button key={k} disabled={!editable} className={sp.habitat === k ? 'on' : ''} onClick={() => setHab(k)}>{h.icon}<br />{h.label}</button>
            ))}
          </div>
          {ENV_DEFS.map((d) => (
            <label key={d.key} className="slider" title={d.hint}>
              <span>{d.icon} {d.label} <em>{sp.env[d.key]}</em></span>
              <input type="range" min="0" max="100" disabled={!editable} value={sp.env[d.key]} onChange={(e) => setEnv(d.key, +e.target.value)} />
              <small>{d.hint}</small>
            </label>
          ))}
          <button className="mini" onClick={syncAll}>把此環境套用到所有物種</button>
        </section>
        <AIPanel sp={sp} />
      </div>
    </div>
  );
}