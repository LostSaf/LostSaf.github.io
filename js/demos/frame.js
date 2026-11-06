// Shared by the demos that run a real project's own page inside a frame.
export function frame(host, src, { allow = '', title = '' } = {}) {
  host.style.touchAction = 'auto';
  const f = document.createElement('iframe');
  f.src = src;
  f.title = title;
  if (allow) f.allow = allow;
  f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff';
  host.appendChild(f);
  return () => { f.src = 'about:blank'; f.remove(); };
}
