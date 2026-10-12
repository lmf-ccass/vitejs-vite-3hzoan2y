import { useEffect, useRef } from 'react';
import { drawScene } from '../sim/draw';

export default function CreatureCanvas({ sp }) {
  const ref = useRef(null), spRef = useRef(sp);
  spRef.current = sp;
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d'), t0 = performance.now();
    let raf;
    const loop = (now) => { drawScene(ctx, c.width, c.height, spRef.current, (now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const save = () => { const a = document.createElement('a'); a.href = ref.current.toDataURL('image/png'); a.download = `species-${sp.id}.png`; a.click(); };
  return (
    <div className="canvasWrap">
      <canvas ref={ref} width={640} height={400} />
      <button className="mini" onClick={save}>下載 PNG</button>
    </div>
  );
}