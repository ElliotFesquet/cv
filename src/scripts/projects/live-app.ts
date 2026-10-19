// Live app card (e.g. the DEM2 Streamlit dashboard): the iframe is only created on click, because the app
// downloads its whole Python runtime. The site's colour tokens and scheme are passed in the query string.
for (const card of document.querySelectorAll<HTMLElement>('[data-live-app]')) {
  card.querySelector('[data-live-app-start]')?.addEventListener('click', () => {
    const css = getComputedStyle(document.documentElement);
    const url = new URL(card.dataset.liveApp!, location.href);
    url.searchParams.set('base', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    for (const [key, token] of [['bg', '--color-bg'], ['text', '--color-text'], ['accent', '--color-accent']]) {
      url.searchParams.set(key, css.getPropertyValue(token).trim());
    }
    const frame = document.createElement('iframe');
    frame.src = url.href;
    frame.title = card.querySelector('.dash-app-title')?.textContent ?? 'Dashboard';
    frame.className = 'dash-app-frame';
    card.classList.add('is-running');
    card.replaceChildren(frame);
  }, { once: true });
}
