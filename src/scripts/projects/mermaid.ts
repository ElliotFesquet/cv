// Renders [data-mermaid] diagrams with the site's colour tokens. Mermaid is loaded only when a diagram exists.
// Wide screens draw the flowchart left → right; narrow screens switch it to top → bottom.
const figures = [...document.querySelectorAll<HTMLElement>('[data-mermaid]')];
if (figures.length) render();

// Pinned journey: scale the diagram to the panel height (up to 1.15×); its width then sets the panel width.
function fit(canvas: HTMLElement) {
  const svg = canvas.querySelector('svg');
  if (!svg) return;
  const box = svg.viewBox.baseVal;
  if (!canvas.closest('.is-pinned') || !box.height) {
    svg.style.width = svg.style.height = svg.style.maxWidth = '';
    return;
  }
  const h = Math.min(canvas.clientHeight, box.height * 1.15);
  svg.style.height = `${h}px`;
  svg.style.width = `${(h * box.width) / box.height}px`;
  svg.style.maxWidth = 'none';
}

async function render() {
  const { default: mermaid } = await import('mermaid');
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    look: 'classic',
    fontFamily: v('--font-sans'),
    flowchart: { useMaxWidth: false, padding: 12, nodeSpacing: 36, rankSpacing: 56 },
    themeVariables: {
      fontFamily: v('--font-sans'),
      background: v('--color-bg'),
      primaryColor: v('--color-bg'),
      primaryTextColor: v('--color-text'),
      primaryBorderColor: v('--color-border'),
      secondaryColor: v('--color-bg'),
      tertiaryColor: v('--color-bg'),
      textColor: v('--color-text'),
      lineColor: v('--color-accent'),
      clusterBkg: v('--color-bg'),
      clusterBorder: v('--color-border'),
      titleColor: v('--color-muted'),
      edgeLabelBackground: v('--color-bg'),
    },
  });
  const wide = matchMedia('(min-width: 64rem)').matches;
  let registered = false;
  for (const [i, figure] of figures.entries()) {
    if (!registered) {
      mermaid.registerIconPacks([{ name: 'logos', icons: JSON.parse(figure.dataset.icons ?? '{}') }]);
      registered = true;
    }
    let source = figure.dataset.mermaid ?? '';
    if (!wide) source = source.replace(/^(\s*flowchart)\s+LR/m, '$1 TB');
    try {
      const { svg } = await mermaid.render(`arch-${i}`, source);
      const canvas = figure.querySelector<HTMLElement>('.arch-canvas')!;
      canvas.innerHTML = svg;
      figure.classList.add('is-rendered');
      fit(canvas);
      addEventListener('resize', () => fit(canvas));
    } catch (err) {
      console.error('[architecture] mermaid render failed', err);
    }
  }
}
