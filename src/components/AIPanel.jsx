import { useMemo, useRef, useState } from 'react';
import { buildPrompt } from '../sim/prompt';
import { generateImage } from '../sim/generate';

const DEFAULTS = { pollinations: 'flux', openai: 'gpt-image-1-mini' };

export default function AIPanel({ sp }) {
  const auto = useMemo(() => buildPrompt(sp), [sp]);
  const [custom, setCustom] = useState(null);
  const [provider, setProvider] = useState('pollinations');
  const [model, setModel] = useState(DEFAULTS.pollinations);
  const [keys, setKeys] = useState(() => ({ pollinations: localStorage.getItem('evo.key.pollinations') || '', openai: localStorage.getItem('evo.key.openai') || '' }));
  const [remember, setRemember] = useState(() => !!(localStorage.getItem('evo.key.pollinations') || localStorage.getItem('evo.key.openai')));
  const [img, setImg] = useState(null), [err, setErr] = useState(''), [loading, setLoading] = useState(false);
  const abortRef = useRef(null);
  const prompt = custom ?? auto;

  const setKey = (v) => {
    setKeys((k) => ({ ...k, [provider]: v }));
    if (remember) localStorage.setItem(`evo.key.${provider}`, v);
  };
  const toggleRemember = (on) => {
    setRemember(on);
    if (on) Object.entries(keys).forEach(([p, v]) => localStorage.setItem(`evo.key.${p}`, v));
    else ['pollinations', 'openai'].forEach((p) => localStorage.removeItem(`evo.key.${p}`));
  };
  const run = async () => {
    abortRef.current?.abort(); abortRef.current = new AbortController();
    setLoading(true); setErr('');
    try {
      setImg(await generateImage({ provider, key: keys[provider].trim(), model, prompt, seed: Math.floor(Math.random() * 1e6), signal: abortRef.current.signal }));
    } catch (e) { if (e.name !== 'AbortError') setErr(e.message); }
    setLoading(false);
  };

  return (
    <section className="panel">
      <h3>🖼️ AI 生物照片</h3>
      <div className="row">
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setModel(DEFAULTS[e.target.value]); }}>
          <option value="pollinations">Pollinations</option>
          <option value="openai">OpenAI(gpt-image)</option>
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="模型" />
      </div>
      <input type="password" value={keys[provider]} onChange={(e) => setKey(e.target.value)} placeholder={provider === 'openai' ? 'OpenAI API Key (sk-...)' : 'Pollinations Key(可留空試免 Key)'} />
      <label className="small"><input type="checkbox" checked={remember} onChange={(e) => toggleRemember(e.target.checked)} /> 在此瀏覽器記住 Key(共用電腦請勿勾選)</label>
      <textarea rows={6} value={prompt} onChange={(e) => setCustom(e.target.value)} />
      <div className="row">
        <button onClick={run} disabled={loading}>{loading ? '生成中…' : '生成圖片'}</button>
        {custom !== null && <button className="mini" onClick={() => setCustom(null)}>還原自動 Prompt</button>}
      </div>
      {err && <p className="err">{err}</p>}
      {img && <img className="ai" src={img} alt="AI generated creature" />}
      <p className="small">Key 只存在你的瀏覽器,請求直接從瀏覽器發往服務商。請勿把 Key 寫進程式碼或 commit 到 GitHub。</p>
    </section>
  );
}