function loadImg(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(url);
    i.onerror = () => rej(new Error('免 Key 端點載入失敗(可能已需要 Key 或被限流)。請到 enter.pollinations.ai 申請 Key 後填入。'));
    i.src = url;
  });
}

export async function generateImage({ provider, key, model, prompt, seed, signal }) {
  if (provider === 'openai') {
    if (!key) throw new Error('請先輸入 OpenAI API Key');
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      // gpt-image-1 系列:不要傳 response_format,永遠回傳 base64
      body: JSON.stringify({ model, prompt, size: '1536x1024', quality: 'low', n: 1 }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error?.message || `OpenAI 錯誤 ${res.status}`);
    return `data:image/png;base64,${j.data[0].b64_json}`;
  }
  const q = `width=1024&height=640&seed=${seed}&model=${encodeURIComponent(model)}&nologo=true`;
  if (key) {
    const res = await fetch(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}`, {
      signal, headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`Pollinations 錯誤 ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
    return URL.createObjectURL(await res.blob());
  }
  return loadImg(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`); // 舊端點,可能已失效
}