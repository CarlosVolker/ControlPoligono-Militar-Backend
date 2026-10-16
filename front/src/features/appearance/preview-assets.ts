/**
 * Preview assets for SCREEN-PERSONALIZER.
 *
 * Literal copy of the external Inume Design System mechanism
 * (assets/js/theme-customizer.js): the nine catalog font stylesheets are
 * preloaded for the panel previews, and the two in-project Iconify
 * collections (ph-arms / lucide-arms) are registered so the Phosphor and
 * Lucide sample cards can render their custom weapon glyphs.
 *
 * The source is read-only reference; nothing here is imported from it.
 */

export interface IconifyIconDefinition {
  readonly body: string;
}

export interface IconifyCollection {
  readonly prefix: string;
  readonly icons: Readonly<Record<string, IconifyIconDefinition>>;
  readonly width: number;
  readonly height: number;
}

// Literal of theme-customizer.js FONT_URLS (lines 84-94).
export const PREVIEW_FONT_STYLESHEETS: Readonly<Record<string, string>> = {
  play: 'https://fonts.googleapis.com/css2?family=Play:wght@400;700&display=swap',
  titillium:
    'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;500;600;700&display=swap',
  exo2: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&display=swap',
  rajdhani:
    'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',
  'ibm-plex':
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  manrope: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap',
  'public-sans':
    'https://fonts.googleapis.com/css2?family=Public+Sans:wght@100..900&display=swap',
  geist: 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap',
} as const;

// Literal of theme-customizer.js registerArmsCollection (lines 612-630).
export const PH_ARMS_COLLECTION: IconifyCollection = {
  prefix: 'ph-arms',
  icons: {
    gun: {
      body: '<g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M56 68h144a24 24 0 0 1 0 48H56a24 24 0 0 1 0-48Z"/><path d="M88 116l-12 72h46l14-72"/><path d="M164 116v6a18 18 0 0 1-18 18h-16"/></g>',
    },
    rifle: {
      body: '<g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M24 108h216"/><path d="M80 116L52 156H24l20-40"/><path d="M140 116l-6 32h22l6-32"/></g>',
    },
    shotgun: {
      body: '<g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M88 104h152"/><path d="M88 136h152"/><path d="M88 120L56 164H28l22-44"/><path d="M168 100v40"/></g>',
    },
    bullet: {
      body: '<g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M128 36c-26 24-38 50-38 82v26h76v-26c0-32-12-58-38-82Z"/><path d="M90 144v58a14 14 0 0 0 14 14h48a14 14 0 0 0 14-14v-58"/><path d="M90 168h76"/></g>',
    },
  },
  width: 256,
  height: 256,
};

// Literal of theme-customizer.js registerLucideArmsCollection (lines 664-682).
export const LUCIDE_ARMS_COLLECTION: IconifyCollection = {
  prefix: 'lucide-arms',
  icons: {
    gun: {
      body: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h12a2 2 0 0 1 2 2 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2Z"/><path d="M8 11l-2 8h4.5l2-8"/><path d="M15 11v1a3 3 0 0 1-3 3h-.5"/></g>',
    },
    rifle: {
      body: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h20"/><path d="M7.5 11 5 15H2l2.5-4"/><path d="M13 11l-1.5 5h4l1.5-5"/></g>',
    },
    shotgun: {
      body: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9h14"/><path d="M8 13h14"/><path d="M8 11 5 16H2l3-5"/><path d="M16 8v6"/></g>',
    },
    bullet: {
      body: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2 2.5-3 5.5-3 8.5V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7.5c0-3-1-6-3-8.5Z"/><path d="M9 15h6"/></g>',
    },
  },
  width: 24,
  height: 24,
};

const FONT_LINK_ID_PREFIX = 'tcfFont-';

/**
 * Preloads every catalog font stylesheet so the panel previews render their
 * own typeface instead of a shared fallback. Idempotent: deduplicated by id
 * and by the href of stylesheets already present (including the selected
 * font's link added elsewhere). Never changes the selected font or saves state.
 */
export function ensurePreviewFontLinks(): void {
  if (typeof document === 'undefined' || !document.head) return;
  const head = document.head;
  const existingHrefs = new Set<string>();
  for (const link of head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')) {
    existingHrefs.add(link.href);
  }
  for (const [font, url] of Object.entries(PREVIEW_FONT_STYLESHEETS)) {
    if (document.getElementById(FONT_LINK_ID_PREFIX + font)) continue;
    let actualUrl = url;
    try {
      actualUrl = new URL(url, document.baseURI).href;
    } catch {
      actualUrl = url;
    }
    if (existingHrefs.has(actualUrl)) continue;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID_PREFIX + font;
    link.rel = 'stylesheet';
    link.href = url;
    head.appendChild(link);
    existingHrefs.add(actualUrl);
  }
}

interface IconifyRegistry {
  addCollection?: (collection: IconifyCollection) => void;
}

let iconCollectionsRegistered = false;

function resolveIconifyRegistry(): IconifyRegistry | null {
  if (typeof window === 'undefined') return null;
  const element = window.customElements?.get('iconify-icon') as unknown as IconifyRegistry | undefined;
  if (element && typeof element.addCollection === 'function') return element;
  const globalRegistry = (window as unknown as { Iconify?: IconifyRegistry }).Iconify;
  if (globalRegistry && typeof globalRegistry.addCollection === 'function') return globalRegistry;
  return null;
}

function register(registry: IconifyRegistry): void {
  registry.addCollection?.(PH_ARMS_COLLECTION);
  registry.addCollection?.(LUCIDE_ARMS_COLLECTION);
  iconCollectionsRegistered = true;
}

/**
 * Registers the two in-project Iconify collections exactly as the DS does,
 * resolving the API off the `iconify-icon` custom element (with the
 * `window.Iconify` fallback). Idempotent and never throws: if the registry is
 * not ready it defers to `customElements.whenDefined`, so a failed visual
 * resource never blocks application startup.
 */
export function registerPreviewIconCollections(): void {
  if (iconCollectionsRegistered) return;
  const registry = resolveIconifyRegistry();
  if (registry) {
    register(registry);
    return;
  }
  if (typeof window !== 'undefined' && window.customElements?.whenDefined) {
    window.customElements
      .whenDefined('iconify-icon')
      .then(() => {
        const defined = resolveIconifyRegistry();
        if (defined) register(defined);
      })
      .catch(() => {
        /* visual-only asset: absence degrades to upstream families */
      });
  }
}
