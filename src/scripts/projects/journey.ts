// Horizontal project journey.
// Wide screens: the track is pinned under the nav and vertical scroll moves it sideways ("is-pinned").
// Otherwise the track stays a native swipe carousel (CSS scroll-snap). Both: step tabs + progress + panel reveal.
const root = document.querySelector<HTMLElement>('[data-journey]');
if (root) init(root);

function init(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('.journey-track')!;
  const panels = [...track.children] as HTMLElement[];
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-step-link]')];
  const nav = document.querySelector<HTMLElement>('.site-nav');
  const wide = matchMedia('(min-width: 64rem) and (min-height: 36rem)');
  let pinned = false;
  let dist = 0; // horizontal distance the track travels
  let top = 0; // page Y where pinning starts
  let frame = 0;

  const offset = () => (pinned ? progress() * dist : track.scrollLeft);
  const progress = () => {
    if (!pinned) return track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth);
    return Math.min(1, Math.max(0, (scrollY - top) / Math.max(1, dist)));
  };

  function layout() {
    pinned = wide.matches;
    root.classList.toggle('is-pinned', pinned);
    root.style.setProperty('--journey-top', `${nav?.offsetHeight ?? 0}px`);
    // Never clear the page height before measuring: the browser would clamp the scroll position.
    if (pinned) {
      track.style.height = '';
      dist = Math.max(0, track.scrollWidth - track.clientWidth);
      top = root.getBoundingClientRect().top + scrollY - (nav?.offsetHeight ?? 0);
      root.style.height = `${dist + innerHeight}px`;
    } else {
      track.style.transform = '';
      root.style.height = '';
    }
    update();
  }

  function update() {
    frame = 0;
    const p = progress();
    const x = offset();
    if (pinned) track.style.transform = `translate3d(${-x}px, 0, 0)`;
    root.style.setProperty('--p', String(p));
    let current = panels[0];
    for (const panel of panels) {
      if (panel.offsetLeft <= x + innerWidth * 0.85) panel.classList.add('is-in');
      if (panel.offsetLeft <= x + innerWidth * 0.4) current = panel;
    }
    // Carousel: the strip takes the height of the visible panel, not the tallest one.
    if (!pinned) track.style.height = `${current.offsetHeight}px`;
    for (const link of links) {
      link.toggleAttribute('aria-current', link.dataset.stepLink === current.dataset.step);
    }
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  for (const link of links) {
    link.addEventListener('click', (e) => {
      const target = panels.find((p) => p.dataset.step === link.dataset.stepLink);
      if (!target) return;
      e.preventDefault();
      const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches ? 'smooth' : 'auto';
      if (pinned) scrollTo({ top: top + Math.min(target.offsetLeft, dist), behavior: smooth });
      else track.scrollTo({ left: target.offsetLeft, behavior: smooth });
    });
  }

  root.classList.add('is-live');
  addEventListener('scroll', schedule, { passive: true });
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  // Diagram and images change the panel widths once they load.
  const resize = new ResizeObserver(() => layout());
  for (const panel of panels) resize.observe(panel);
  layout();
}
