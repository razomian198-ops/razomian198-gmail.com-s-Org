/**
 * Keeps <title>, description, canonical and social tags in sync with the current
 * page while the user navigates inside the single-page app. The server injects the
 * same values into the first HTML response so crawlers see them without running JS.
 */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function metaByName(name: string, content: string) {
  setTag(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  }, 'content', content);
}

function metaByProperty(property: string, content: string) {
  setTag(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    return m;
  }, 'content', content);
}

export function applyPageMeta(title: string, description: string, path: string) {
  if (typeof document === 'undefined') return;
  const url = `${window.location.origin}${path}`;
  document.title = title;
  metaByName('description', description);
  metaByProperty('og:title', title);
  metaByProperty('og:description', description);
  metaByProperty('og:url', url);
  metaByName('twitter:title', title);
  metaByName('twitter:description', description);
  setTag('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  }, 'href', url);
}
