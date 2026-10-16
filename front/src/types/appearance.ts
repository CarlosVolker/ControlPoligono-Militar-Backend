export const DESIGN_SYSTEM_THEME = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export const DESIGN_SYSTEM_ACCENT = {
  VIOLET: "violet",
  GREEN: "green",
  AMBER: "amber",
  BLUE: "blue",
  PINK: "pink",
  TEAL: "teal",
  ORANGE: "orange",
  RED: "red",
  CYAN: "cyan",
  LIME: "lime",
  INDIGO: "indigo",
  FUCHSIA: "fuchsia",
  SKY: "sky",
  ROSE: "rose",
  EMERALD: "emerald",
  GOLD: "gold",
  OLIVE: "olive",
  SIGNAL: "signal",
  STEEL: "steel",
  MINT: "mint",
  COPPER: "copper",
  NVG: "nvg",
  KHAKI: "khaki",
  GUNMETAL: "gunmetal",
  WRAITH: "wraith",
  SENTINEL: "sentinel",
  SONAR: "sonar",
} as const;

export const DESIGN_SYSTEM_BG = {
  NEUTRAL: "neutral",
  ABYSS: "abyss",
  FERN: "fern",
  EMBER: "ember",
  MIDNIGHT: "midnight",
  WINE: "wine",
  SLATE: "slate",
  SAND: "sand",
  FIELD: "field",
  COMMAND: "command",
  FORGE: "forge",
  GLACIER: "glacier",
  ORCHID: "orchid",
  CLAY: "clay",
  BLACKOUT: "blackout",
  CARBON: "carbon",
  OBSIDIAN: "obsidian",
  BUNKER: "bunker",
  TRENCH: "trench",
  PURE: "pure",
  STONE: "stone",
  ZINC: "zinc",
  MAUVE: "mauve",
  SAGE: "sage",
  MIST: "mist",
  TAUPE: "taupe",
} as const;

export const DESIGN_SYSTEM_FONT = {
  PLAY: "play",
  TITILLIUM: "titillium",
  EXO2: "exo2",
  RAJDHANI: "rajdhani",
  IBM_PLEX: "ibm-plex",
  INTER: "inter",
  MANROPE: "manrope",
  PUBLIC_SANS: "public-sans",
  GEIST: "geist",
} as const;

export const DESIGN_SYSTEM_RADIUS = {
  SOFT: "soft",
  SUBTLE: "subtle",
  SQUARE: "square",
} as const;

export const DESIGN_SYSTEM_ICON_FAMILY = {
  DEFAULT: "default",
  MINGCUTE: "mingcute",
  SOLAR: "solar",
  MDI: "mdi",
  FA7_SOLID: "fa7-solid",
  PHOSPHOR: "phosphor",
  LUCIDE: "lucide",
} as const;

export const DESIGN_SYSTEM_AMBIENT = {
  EMBERS: "embers",
  FIREFLIES: "fireflies",
  RAIN: "rain",
  SEARCHLIGHTS: "searchlights",
  TRACERS: "tracers",
  RICOCHET: "ricochet",
  ASH: "ash",
  OFF: "off",
} as const;

export const DESIGN_SYSTEM_AMBCOLOR = {
  ACCENT: "accent",
  EMBER: "ember",
  GOLD: "gold",
  LIME: "lime",
  MINT: "mint",
  CYAN: "cyan",
  VIOLET: "violet",
} as const;

export type DesignSystemTheme = (typeof DESIGN_SYSTEM_THEME)[keyof typeof DESIGN_SYSTEM_THEME];
export type DesignSystemAccent = (typeof DESIGN_SYSTEM_ACCENT)[keyof typeof DESIGN_SYSTEM_ACCENT];
export type DesignSystemBg = (typeof DESIGN_SYSTEM_BG)[keyof typeof DESIGN_SYSTEM_BG];
export type DesignSystemFont = (typeof DESIGN_SYSTEM_FONT)[keyof typeof DESIGN_SYSTEM_FONT];
export type DesignSystemRadius = (typeof DESIGN_SYSTEM_RADIUS)[keyof typeof DESIGN_SYSTEM_RADIUS];
export type DesignSystemIconFamily =
  (typeof DESIGN_SYSTEM_ICON_FAMILY)[keyof typeof DESIGN_SYSTEM_ICON_FAMILY];
export type DesignSystemAmbient =
  (typeof DESIGN_SYSTEM_AMBIENT)[keyof typeof DESIGN_SYSTEM_AMBIENT];
export type DesignSystemAmbcolor =
  (typeof DESIGN_SYSTEM_AMBCOLOR)[keyof typeof DESIGN_SYSTEM_AMBCOLOR];

export interface DesignSystemAppearanceOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
  readonly description?: string;
  readonly accessibleLabel?: string;
  readonly category?: string;
  readonly stylesheetUrl?: string;
  readonly samples?: readonly string[];
  readonly isDefault?: true;
}

export const DESIGN_SYSTEM_THEME_OPTIONS = [
  { value: DESIGN_SYSTEM_THEME.DARK, label: "dark", isDefault: true },
  { value: DESIGN_SYSTEM_THEME.LIGHT, label: "light" },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemTheme>[];

export const DESIGN_SYSTEM_ACCENT_OPTIONS = [
  {
    value: DESIGN_SYSTEM_ACCENT.VIOLET,
    label: "Violet",
    accessibleLabel: "Violet (default)",
  },
  { value: DESIGN_SYSTEM_ACCENT.GREEN, label: "Green", accessibleLabel: "Green" },
  { value: DESIGN_SYSTEM_ACCENT.AMBER, label: "Amber", accessibleLabel: "Amber" },
  { value: DESIGN_SYSTEM_ACCENT.BLUE, label: "Blue", accessibleLabel: "Blue" },
  { value: DESIGN_SYSTEM_ACCENT.PINK, label: "Pink", accessibleLabel: "Pink" },
  { value: DESIGN_SYSTEM_ACCENT.TEAL, label: "Teal", accessibleLabel: "Teal" },
  { value: DESIGN_SYSTEM_ACCENT.ORANGE, label: "Orange", accessibleLabel: "Orange" },
  { value: DESIGN_SYSTEM_ACCENT.RED, label: "Red", accessibleLabel: "Red" },
  { value: DESIGN_SYSTEM_ACCENT.CYAN, label: "Cyan", accessibleLabel: "Cyan" },
  { value: DESIGN_SYSTEM_ACCENT.LIME, label: "Lime", accessibleLabel: "Lime" },
  { value: DESIGN_SYSTEM_ACCENT.INDIGO, label: "Indigo", accessibleLabel: "Indigo" },
  { value: DESIGN_SYSTEM_ACCENT.FUCHSIA, label: "Fuchsia", accessibleLabel: "Fuchsia" },
  { value: DESIGN_SYSTEM_ACCENT.SKY, label: "Sky", accessibleLabel: "Sky" },
  { value: DESIGN_SYSTEM_ACCENT.ROSE, label: "Rose", accessibleLabel: "Rose" },
  { value: DESIGN_SYSTEM_ACCENT.EMERALD, label: "Emerald", accessibleLabel: "Emerald" },
  { value: DESIGN_SYSTEM_ACCENT.GOLD, label: "Gold", accessibleLabel: "Gold" },
  { value: DESIGN_SYSTEM_ACCENT.OLIVE, label: "Olive", accessibleLabel: "Olive" },
  { value: DESIGN_SYSTEM_ACCENT.SIGNAL, label: "Signal", accessibleLabel: "Signal" },
  { value: DESIGN_SYSTEM_ACCENT.STEEL, label: "Steel", accessibleLabel: "Steel" },
  { value: DESIGN_SYSTEM_ACCENT.MINT, label: "Mint", accessibleLabel: "Mint", isDefault: true },
  { value: DESIGN_SYSTEM_ACCENT.COPPER, label: "Copper", accessibleLabel: "Copper" },
  { value: DESIGN_SYSTEM_ACCENT.NVG, label: "NVG", accessibleLabel: "NVG" },
  { value: DESIGN_SYSTEM_ACCENT.KHAKI, label: "Khaki", accessibleLabel: "Khaki" },
  { value: DESIGN_SYSTEM_ACCENT.GUNMETAL, label: "Gunmetal", accessibleLabel: "Gunmetal" },
  { value: DESIGN_SYSTEM_ACCENT.WRAITH, label: "Wraith", accessibleLabel: "Wraith" },
  { value: DESIGN_SYSTEM_ACCENT.SENTINEL, label: "Sentinel", accessibleLabel: "Sentinel" },
  { value: DESIGN_SYSTEM_ACCENT.SONAR, label: "Sonar", accessibleLabel: "Sonar" },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemAccent>[];

export const DESIGN_SYSTEM_BG_OPTIONS = [
  {
    value: DESIGN_SYSTEM_BG.NEUTRAL,
    label: "Neutral",
    accessibleLabel: "Neutral background (default)",
  },
  {
    value: DESIGN_SYSTEM_BG.ABYSS,
    label: "Abyss",
    accessibleLabel: "Abyss background, deep blue tint",
  },
  {
    value: DESIGN_SYSTEM_BG.FERN,
    label: "Fern",
    accessibleLabel: "Fern background, deep green tint",
  },
  {
    value: DESIGN_SYSTEM_BG.EMBER,
    label: "Ember",
    accessibleLabel: "Ember background, warm tint",
  },
  {
    value: DESIGN_SYSTEM_BG.MIDNIGHT,
    label: "Midnight",
    accessibleLabel: "Midnight background, deep indigo tint",
  },
  {
    value: DESIGN_SYSTEM_BG.WINE,
    label: "Wine",
    accessibleLabel: "Wine background, deep burgundy tint",
  },
  {
    value: DESIGN_SYSTEM_BG.SLATE,
    label: "Slate",
    accessibleLabel: "Slate background, blue graphite tint",
  },
  {
    value: DESIGN_SYSTEM_BG.SAND,
    label: "Sand",
    accessibleLabel: "Sand background, warm tint",
  },
  {
    value: DESIGN_SYSTEM_BG.FIELD,
    label: "Field",
    accessibleLabel: "Field background, tactical olive tint",
  },
  {
    value: DESIGN_SYSTEM_BG.COMMAND,
    label: "Command",
    accessibleLabel: "Command background, steel indigo tint",
    isDefault: true,
  },
  {
    value: DESIGN_SYSTEM_BG.FORGE,
    label: "Forge",
    accessibleLabel: "Forge background, warm copper tint",
  },
  {
    value: DESIGN_SYSTEM_BG.GLACIER,
    label: "Glacier",
    accessibleLabel: "Glacier background, cool cyan tint",
  },
  {
    value: DESIGN_SYSTEM_BG.ORCHID,
    label: "Orchid",
    accessibleLabel: "Orchid background, pink-violet tint",
  },
  {
    value: DESIGN_SYSTEM_BG.CLAY,
    label: "Clay",
    accessibleLabel: "Clay background, warm earth tint",
  },
  {
    value: DESIGN_SYSTEM_BG.BLACKOUT,
    label: "Blackout",
    accessibleLabel: "Blackout background, near-absolute black",
  },
  {
    value: DESIGN_SYSTEM_BG.CARBON,
    label: "Carbon",
    accessibleLabel: "Carbon fiber background, hard neutral black",
  },
  {
    value: DESIGN_SYSTEM_BG.OBSIDIAN,
    label: "Obsidian",
    accessibleLabel: "Obsidian glass background, deep violet-black",
  },
  {
    value: DESIGN_SYSTEM_BG.BUNKER,
    label: "Bunker",
    accessibleLabel: "Bunker concrete background, dark gray-green",
  },
  {
    value: DESIGN_SYSTEM_BG.TRENCH,
    label: "Trench",
    accessibleLabel: "Trench earth background, dark warm soil",
  },
  {
    value: DESIGN_SYSTEM_BG.PURE,
    label: "Pure",
    accessibleLabel: "Pure background, shadcn neutral, zero-tint gray",
  },
  {
    value: DESIGN_SYSTEM_BG.STONE,
    label: "Stone",
    accessibleLabel: "Stone background, shadcn warm gray tint",
  },
  {
    value: DESIGN_SYSTEM_BG.ZINC,
    label: "Zinc",
    accessibleLabel: "Zinc background, shadcn cool blue-gray tint",
  },
  {
    value: DESIGN_SYSTEM_BG.MAUVE,
    label: "Mauve",
    accessibleLabel: "Mauve background, shadcn purple-gray tint",
  },
  {
    value: DESIGN_SYSTEM_BG.SAGE,
    label: "Sage",
    accessibleLabel: "Sage background, shadcn olive green-gray tint",
  },
  {
    value: DESIGN_SYSTEM_BG.MIST,
    label: "Mist",
    accessibleLabel: "Mist background, shadcn steel blue-gray tint",
  },
  {
    value: DESIGN_SYSTEM_BG.TAUPE,
    label: "Taupe",
    accessibleLabel: "Taupe background, shadcn brown-gray tint",
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemBg>[];

export const DESIGN_SYSTEM_FONT_OPTIONS = [
  {
    value: DESIGN_SYSTEM_FONT.PLAY,
    label: "Play",
    category: "Technical",
    accessibleLabel: "Play font",
    stylesheetUrl: "https://fonts.googleapis.com/css2?family=Play:wght@400;700&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.TITILLIUM,
    label: "Titillium Web",
    category: "Aero · Geometric",
    accessibleLabel: "Titillium Web font",
    stylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;500;600;700&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.EXO2,
    label: "Exo 2",
    category: "Futuristic · Dynamic",
    accessibleLabel: "Exo 2 font",
    stylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.RAJDHANI,
    label: "Rajdhani",
    category: "Industrial · Condensed",
    accessibleLabel: "Rajdhani font",
    stylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.IBM_PLEX,
    label: "IBM Plex Sans",
    category: "Institutional · Default",
    accessibleLabel: "IBM Plex Sans font (default)",
    stylesheetUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    isDefault: true,
  },
  {
    value: DESIGN_SYSTEM_FONT.INTER,
    label: "Inter",
    category: "UI · Neutral",
    accessibleLabel: "Inter font",
    stylesheetUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.MANROPE,
    label: "Manrope",
    category: "UI · Geometric",
    accessibleLabel: "Manrope font",
    stylesheetUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.PUBLIC_SANS,
    label: "Public Sans",
    category: "UI · Institutional",
    accessibleLabel: "Public Sans font",
    stylesheetUrl:
      "https://fonts.googleapis.com/css2?family=Public+Sans:wght@100..900&display=swap",
  },
  {
    value: DESIGN_SYSTEM_FONT.GEIST,
    label: "Geist",
    category: "UI · shadcn default",
    accessibleLabel: "Geist font",
    stylesheetUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemFont>[];

export const DESIGN_SYSTEM_RADIUS_OPTIONS = [
  {
    value: DESIGN_SYSTEM_RADIUS.SQUARE,
    label: "Square",
    description: "0px corners",
    isDefault: true,
  },
  { value: DESIGN_SYSTEM_RADIUS.SUBTLE, label: "Subtle", description: "2px corners" },
  {
    value: DESIGN_SYSTEM_RADIUS.SOFT,
    label: "Soft",
    description: "Default",
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemRadius>[];

export const DESIGN_SYSTEM_ICON_FAMILY_OPTIONS = [
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.DEFAULT,
    label: "Default",
    description: "Current mix, no remap",
    accessibleLabel: "Default icon family, current Mingcute and Solar mix",
    samples: ["mingcute:home-3-line", "solar:bell-outline", "mingcute:chart-bar-line"],
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.MINGCUTE,
    label: "Mingcute",
    description: "Line icons",
    accessibleLabel: "Mingcute icon family",
    samples: ["mingcute:home-3-line", "mingcute:bell-ringing-line", "mingcute:chart-bar-line"],
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.SOLAR,
    label: "Solar",
    description: "Outline icons",
    accessibleLabel: "Solar icon family",
    samples: ["solar:home-outline", "solar:bell-outline", "solar:chart-2-outline"],
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.MDI,
    label: "Material Design Icons",
    description: "Apache 2.0",
    accessibleLabel: "Material Design Icons family, Apache 2.0",
    samples: ["mdi:home", "mdi:bell", "mdi:chart-bar"],
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.FA7_SOLID,
    label: "Font Awesome 7 Solid",
    description: "CC BY 4.0",
    accessibleLabel: "Font Awesome 7 Solid family, CC BY 4.0",
    samples: ["fa7-solid:house", "fa7-solid:bell", "fa7-solid:chart-column"],
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.PHOSPHOR,
    label: "Phosphor",
    description: "Clean · Geometric",
    accessibleLabel: "Phosphor icon family, MIT",
    samples: ["ph:house", "ph:bell", "ph-arms:gun"],
    isDefault: true,
  },
  {
    value: DESIGN_SYSTEM_ICON_FAMILY.LUCIDE,
    label: "Lucide",
    description: "Clean · 24px grid",
    accessibleLabel: "Lucide icon family, ISC",
    samples: ["lucide:house", "lucide:bell", "lucide-arms:gun"],
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemIconFamily>[];

export const DESIGN_SYSTEM_ICON_FAMILY_ATTRIBUTION =
  "Font Awesome 7 Solid icons by Fonticons, Inc. - licensed under CC BY 4.0." as const;

export const DESIGN_SYSTEM_AMBIENT_OPTIONS = [
  {
    value: DESIGN_SYSTEM_AMBIENT.EMBERS,
    label: "Embers",
    description: "Rising warm sparks",
    accessibleLabel: "Embers ambient background (default)",
    isDefault: true,
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.FIREFLIES,
    label: "Fireflies",
    description: "Slow blinking drift",
    accessibleLabel: "Fireflies ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.RAIN,
    label: "Night Rain",
    description: "Two-plane rainfall",
    accessibleLabel: "Night rain ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.SEARCHLIGHTS,
    label: "Searchlights",
    description: "Sweeping beams",
    accessibleLabel: "Searchlights ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.TRACERS,
    label: "Tracers",
    description: "Ballistic light trails",
    accessibleLabel: "Tracers ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.RICOCHET,
    label: "Ricochet",
    description: "Sparse spark bursts",
    accessibleLabel: "Ricochet ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.ASH,
    label: "Ash",
    description: "Falling embers drift",
    accessibleLabel: "Ash ambient background",
  },
  {
    value: DESIGN_SYSTEM_AMBIENT.OFF,
    label: "Off",
    description: "Static background",
    accessibleLabel: "No ambient background",
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemAmbient>[];

export const DESIGN_SYSTEM_AMBCOLOR_OPTIONS = [
  {
    value: DESIGN_SYSTEM_AMBCOLOR.ACCENT,
    label: "Accent",
    description: "Follows the active accent",
    accessibleLabel: "Ambient color follows the active accent (default)",
    isDefault: true,
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.EMBER,
    label: "Ember",
    description: "Warm orange tint",
    accessibleLabel: "Ember ambient color",
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.GOLD,
    label: "Gold",
    description: "Golden tint",
    accessibleLabel: "Gold ambient color",
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.LIME,
    label: "Lime",
    description: "Electric lime tint",
    accessibleLabel: "Lime ambient color",
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.MINT,
    label: "Mint",
    description: "Cool mint tint",
    accessibleLabel: "Mint ambient color",
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.CYAN,
    label: "Cyan",
    description: "Bright cyan tint",
    accessibleLabel: "Cyan ambient color",
  },
  {
    value: DESIGN_SYSTEM_AMBCOLOR.VIOLET,
    label: "Violet",
    description: "Soft violet tint",
    accessibleLabel: "Violet ambient color",
  },
] as const satisfies readonly DesignSystemAppearanceOption<DesignSystemAmbcolor>[];

export const DESIGN_SYSTEM_APPEARANCE_OPTIONS = {
  theme: DESIGN_SYSTEM_THEME_OPTIONS,
  accent: DESIGN_SYSTEM_ACCENT_OPTIONS,
  bg: DESIGN_SYSTEM_BG_OPTIONS,
  font: DESIGN_SYSTEM_FONT_OPTIONS,
  radius: DESIGN_SYSTEM_RADIUS_OPTIONS,
  iconfam: DESIGN_SYSTEM_ICON_FAMILY_OPTIONS,
  ambient: DESIGN_SYSTEM_AMBIENT_OPTIONS,
  ambcolor: DESIGN_SYSTEM_AMBCOLOR_OPTIONS,
} as const;

export const DESIGN_SYSTEM_APPEARANCE_OPTION_COUNTS = {
  theme: DESIGN_SYSTEM_THEME_OPTIONS.length,
  accent: DESIGN_SYSTEM_ACCENT_OPTIONS.length,
  bg: DESIGN_SYSTEM_BG_OPTIONS.length,
  font: DESIGN_SYSTEM_FONT_OPTIONS.length,
  radius: DESIGN_SYSTEM_RADIUS_OPTIONS.length,
  iconfam: DESIGN_SYSTEM_ICON_FAMILY_OPTIONS.length,
  ambient: DESIGN_SYSTEM_AMBIENT_OPTIONS.length,
  ambcolor: DESIGN_SYSTEM_AMBCOLOR_OPTIONS.length,
} as const;

export interface DesignSystemAppearance {
  theme: DesignSystemTheme;
  accent: DesignSystemAccent;
  bg: DesignSystemBg;
  font: DesignSystemFont;
  radius: DesignSystemRadius;
  iconfam: DesignSystemIconFamily;
  ambient: DesignSystemAmbient;
  ambcolor: DesignSystemAmbcolor;
}

export interface DesignSystemAppearanceDto {
  ds_theme: DesignSystemTheme;
  ds_accent: DesignSystemAccent;
  ds_bg: DesignSystemBg;
  ds_font: DesignSystemFont;
  ds_radius: DesignSystemRadius;
  ds_iconfam: DesignSystemIconFamily;
  ds_ambient: DesignSystemAmbient;
  ds_ambcolor: DesignSystemAmbcolor;
}

export const DEFAULT_DESIGN_SYSTEM_APPEARANCE = {
  theme: DESIGN_SYSTEM_THEME.DARK,
  accent: DESIGN_SYSTEM_ACCENT.MINT,
  bg: DESIGN_SYSTEM_BG.COMMAND,
  font: DESIGN_SYSTEM_FONT.IBM_PLEX,
  radius: DESIGN_SYSTEM_RADIUS.SQUARE,
  iconfam: DESIGN_SYSTEM_ICON_FAMILY.PHOSPHOR,
  ambient: DESIGN_SYSTEM_AMBIENT.EMBERS,
  ambcolor: DESIGN_SYSTEM_AMBCOLOR.ACCENT,
} as const satisfies DesignSystemAppearance;

export const DEFAULT_DESIGN_SYSTEM_APPEARANCE_DTO = {
  ds_theme: DEFAULT_DESIGN_SYSTEM_APPEARANCE.theme,
  ds_accent: DEFAULT_DESIGN_SYSTEM_APPEARANCE.accent,
  ds_bg: DEFAULT_DESIGN_SYSTEM_APPEARANCE.bg,
  ds_font: DEFAULT_DESIGN_SYSTEM_APPEARANCE.font,
  ds_radius: DEFAULT_DESIGN_SYSTEM_APPEARANCE.radius,
  ds_iconfam: DEFAULT_DESIGN_SYSTEM_APPEARANCE.iconfam,
  ds_ambient: DEFAULT_DESIGN_SYSTEM_APPEARANCE.ambient,
  ds_ambcolor: DEFAULT_DESIGN_SYSTEM_APPEARANCE.ambcolor,
} as const satisfies DesignSystemAppearanceDto;

export const DESIGN_SYSTEM_APPEARANCE_API_FIELDS = {
  theme: "ds_theme",
  accent: "ds_accent",
  bg: "ds_bg",
  font: "ds_font",
  radius: "ds_radius",
  iconfam: "ds_iconfam",
  ambient: "ds_ambient",
  ambcolor: "ds_ambcolor",
} as const;

export const DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES = {
  theme: "data-theme",
  accent: "data-accent",
  bg: "data-bg",
  font: "data-font",
  radius: "data-radius",
  iconfam: "data-iconfam",
  ambient: "data-ambient",
  ambcolor: "data-ambcolor",
} as const;

export const DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES = {
  bg: DESIGN_SYSTEM_BG.NEUTRAL,
  font: DESIGN_SYSTEM_FONT.PLAY,
  radius: DESIGN_SYSTEM_RADIUS.SOFT,
  iconfam: DESIGN_SYSTEM_ICON_FAMILY.DEFAULT,
  ambcolor: DESIGN_SYSTEM_AMBCOLOR.ACCENT,
} as const;

export interface DesignSystemAppearanceDomAttributeValues {
  "data-theme": DesignSystemTheme;
  "data-accent": DesignSystemAccent;
  "data-bg": DesignSystemBg | undefined;
  "data-font": DesignSystemFont | undefined;
  "data-radius": DesignSystemRadius | undefined;
  "data-iconfam": DesignSystemIconFamily | undefined;
  "data-ambient": DesignSystemAmbient;
  "data-ambcolor": DesignSystemAmbcolor | undefined;
}

export function getDesignSystemAppearanceDomAttributeValues(
  appearance: DesignSystemAppearance,
): DesignSystemAppearanceDomAttributeValues {
  return {
    "data-theme": appearance.theme,
    "data-accent": appearance.accent,
    "data-bg":
      appearance.bg === DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES.bg
        ? undefined
        : appearance.bg,
    "data-font":
      appearance.font === DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES.font
        ? undefined
        : appearance.font,
    "data-radius":
      appearance.radius === DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES.radius
        ? undefined
        : appearance.radius,
    "data-iconfam":
      appearance.iconfam === DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES.iconfam
        ? undefined
        : appearance.iconfam,
    "data-ambient": appearance.ambient,
    "data-ambcolor":
      appearance.ambcolor === DESIGN_SYSTEM_APPEARANCE_ATTRIBUTE_OMISSION_VALUES.ambcolor
        ? undefined
        : appearance.ambcolor,
  };
}

const DESIGN_SYSTEM_APPEARANCE_FIELDS = [
  "theme",
  "accent",
  "bg",
  "font",
  "radius",
  "iconfam",
  "ambient",
  "ambcolor",
] as const;

const DESIGN_SYSTEM_APPEARANCE_DTO_FIELDS = [
  "ds_theme",
  "ds_accent",
  "ds_bg",
  "ds_font",
  "ds_radius",
  "ds_iconfam",
  "ds_ambient",
  "ds_ambcolor",
] as const;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: object, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && keys.every((key) => expectedKeys.includes(key));
}

function isOptionValue<Options extends readonly DesignSystemAppearanceOption<string>[]>(
  value: unknown,
  options: Options,
): value is Options[number]["value"] {
  return typeof value === "string" && options.some((option) => option.value === value);
}

export function isDesignSystemTheme(value: unknown): value is DesignSystemTheme {
  return isOptionValue(value, DESIGN_SYSTEM_THEME_OPTIONS);
}

export function isDesignSystemAccent(value: unknown): value is DesignSystemAccent {
  return isOptionValue(value, DESIGN_SYSTEM_ACCENT_OPTIONS);
}

export function isDesignSystemBg(value: unknown): value is DesignSystemBg {
  return isOptionValue(value, DESIGN_SYSTEM_BG_OPTIONS);
}

export function isDesignSystemFont(value: unknown): value is DesignSystemFont {
  return isOptionValue(value, DESIGN_SYSTEM_FONT_OPTIONS);
}

export function isDesignSystemRadius(value: unknown): value is DesignSystemRadius {
  return isOptionValue(value, DESIGN_SYSTEM_RADIUS_OPTIONS);
}

export function isDesignSystemIconFamily(value: unknown): value is DesignSystemIconFamily {
  return isOptionValue(value, DESIGN_SYSTEM_ICON_FAMILY_OPTIONS);
}

export function isDesignSystemAmbient(value: unknown): value is DesignSystemAmbient {
  return isOptionValue(value, DESIGN_SYSTEM_AMBIENT_OPTIONS);
}

export function isDesignSystemAmbcolor(value: unknown): value is DesignSystemAmbcolor {
  return isOptionValue(value, DESIGN_SYSTEM_AMBCOLOR_OPTIONS);
}

export function isDesignSystemAppearance(value: unknown): value is DesignSystemAppearance {
  if (!isObjectRecord(value) || !hasExactKeys(value, DESIGN_SYSTEM_APPEARANCE_FIELDS)) {
    return false;
  }

  return (
    isDesignSystemTheme(value.theme) &&
    isDesignSystemAccent(value.accent) &&
    isDesignSystemBg(value.bg) &&
    isDesignSystemFont(value.font) &&
    isDesignSystemRadius(value.radius) &&
    isDesignSystemIconFamily(value.iconfam) &&
    isDesignSystemAmbient(value.ambient) &&
    isDesignSystemAmbcolor(value.ambcolor)
  );
}

export function isDesignSystemAppearanceDto(value: unknown): value is DesignSystemAppearanceDto {
  if (!isObjectRecord(value) || !hasExactKeys(value, DESIGN_SYSTEM_APPEARANCE_DTO_FIELDS)) {
    return false;
  }

  return (
    isDesignSystemTheme(value.ds_theme) &&
    isDesignSystemAccent(value.ds_accent) &&
    isDesignSystemBg(value.ds_bg) &&
    isDesignSystemFont(value.ds_font) &&
    isDesignSystemRadius(value.ds_radius) &&
    isDesignSystemIconFamily(value.ds_iconfam) &&
    isDesignSystemAmbient(value.ds_ambient) &&
    isDesignSystemAmbcolor(value.ds_ambcolor)
  );
}

export function toDesignSystemAppearanceDto(
  appearance: DesignSystemAppearance,
): DesignSystemAppearanceDto {
  return {
    ds_theme: appearance.theme,
    ds_accent: appearance.accent,
    ds_bg: appearance.bg,
    ds_font: appearance.font,
    ds_radius: appearance.radius,
    ds_iconfam: appearance.iconfam,
    ds_ambient: appearance.ambient,
    ds_ambcolor: appearance.ambcolor,
  };
}

export function fromDesignSystemAppearanceDto(
  dto: DesignSystemAppearanceDto,
): DesignSystemAppearance {
  return {
    theme: dto.ds_theme,
    accent: dto.ds_accent,
    bg: dto.ds_bg,
    font: dto.ds_font,
    radius: dto.ds_radius,
    iconfam: dto.ds_iconfam,
    ambient: dto.ds_ambient,
    ambcolor: dto.ds_ambcolor,
  };
}

export const DESIGN_SYSTEM_ICON_CONCEPTS = [
  "caret-down",
  "close",
  "menu-user",
  "table",
  "menu",
  "map",
  "leaf",
  "layout",
  "home",
  "dribbble",
  "close-circle",
  "chart-bar",
  "bug",
  "box",
  "palette",
  "arrow-right",
  "arrow-down",
  "user",
  "sun",
  "moon",
  "search",
  "hamburger",
  "settings",
  "logout",
  "bell",
  "wallet",
  "users-group",
  "pie-chart",
  "lock",
  "help",
  "globe",
  "cart",
  "check-double",
  "bx-user",
  "bx-home",
  "envelope",
  "info-circle",
  "badge-check",
  "x-circle",
  "user-voice",
  "heart",
  "cloud-upload",
  "cloud",
  "check-shield",
] as const;

export type DesignSystemIconConcept = (typeof DESIGN_SYSTEM_ICON_CONCEPTS)[number];
export type DesignSystemIconFamilyMap = Readonly<Record<DesignSystemIconFamily, string>>;

export const DESIGN_SYSTEM_ICON_FAMILY_MAP = {
  "caret-down": {
    default: "mingcute:down-line",
    mingcute: "mingcute:down-line",
    solar: "solar:alt-arrow-down-outline",
    mdi: "mdi:chevron-down",
    "fa7-solid": "fa7-solid:chevron-down",
    phosphor: "ph:caret-down",
    lucide: "lucide:chevron-down",
  },
  close: {
    default: "mingcute:close-line",
    mingcute: "mingcute:close-line",
    solar: "solar:close-circle-outline",
    mdi: "mdi:close",
    "fa7-solid": "fa7-solid:xmark",
    phosphor: "ph:x",
    lucide: "lucide:x",
  },
  "menu-user": {
    default: "mingcute:user-3-line",
    mingcute: "mingcute:user-3-line",
    solar: "solar:user-outline",
    mdi: "mdi:account",
    "fa7-solid": "fa7-solid:user",
    phosphor: "ph:user",
    lucide: "lucide:user",
  },
  table: {
    default: "mingcute:table-line",
    mingcute: "mingcute:table-line",
    solar: "solar:widget-2-outline",
    mdi: "mdi:table",
    "fa7-solid": "fa7-solid:table",
    phosphor: "ph:table",
    lucide: "lucide:table",
  },
  menu: {
    default: "mingcute:menu-line",
    mingcute: "mingcute:menu-line",
    solar: "solar:hamburger-menu-outline",
    mdi: "mdi:menu",
    "fa7-solid": "fa7-solid:bars",
    phosphor: "ph:list",
    lucide: "lucide:menu",
  },
  map: {
    default: "mingcute:map-line",
    mingcute: "mingcute:map-line",
    solar: "solar:map-outline",
    mdi: "mdi:map-outline",
    "fa7-solid": "fa7-solid:map",
    phosphor: "ph:map-trifold",
    lucide: "lucide:map",
  },
  leaf: {
    default: "mingcute:leaf-line",
    mingcute: "mingcute:leaf-line",
    solar: "solar:leaf-outline",
    mdi: "mdi:leaf",
    "fa7-solid": "fa7-solid:leaf",
    phosphor: "ph:leaf",
    lucide: "lucide:leaf",
  },
  layout: {
    default: "mingcute:layout-line",
    mingcute: "mingcute:layout-line",
    solar: "solar:widget-2-outline",
    mdi: "mdi:view-dashboard-outline",
    "fa7-solid": "fa7-solid:table-cells",
    phosphor: "ph:layout",
    lucide: "lucide:layout-dashboard",
  },
  home: {
    default: "mingcute:home-3-line",
    mingcute: "mingcute:home-3-line",
    solar: "solar:home-outline",
    mdi: "mdi:home",
    "fa7-solid": "fa7-solid:house",
    phosphor: "ph:house",
    lucide: "lucide:house",
  },
  dribbble: {
    default: "mingcute:dribbble-line",
    mingcute: "mingcute:dribbble-line",
    solar: "solar:widget-2-outline",
    mdi: "mdi:dribbble",
    "fa7-solid": "fa7-solid:table-cells",
    phosphor: "ph:dribbble-logo",
    lucide: "lucide:dribbble",
  },
  "close-circle": {
    default: "mingcute:close-circle-line",
    mingcute: "mingcute:close-circle-line",
    solar: "solar:close-circle-outline",
    mdi: "mdi:close-circle",
    "fa7-solid": "fa7-solid:circle-xmark",
    phosphor: "ph:x-circle",
    lucide: "lucide:circle-x",
  },
  "chart-bar": {
    default: "mingcute:chart-bar-line",
    mingcute: "mingcute:chart-bar-line",
    solar: "solar:chart-2-outline",
    mdi: "mdi:chart-bar",
    "fa7-solid": "fa7-solid:chart-column",
    phosphor: "ph:chart-bar",
    lucide: "lucide:chart-column",
  },
  bug: {
    default: "mingcute:bug-line",
    mingcute: "mingcute:bug-line",
    solar: "solar:bug-outline",
    mdi: "mdi:bug",
    "fa7-solid": "fa7-solid:bug",
    phosphor: "ph:bug",
    lucide: "lucide:bug",
  },
  box: {
    default: "mingcute:box-line",
    mingcute: "mingcute:box-line",
    solar: "solar:box-outline",
    mdi: "mdi:package-variant",
    "fa7-solid": "fa7-solid:box",
    phosphor: "ph:package",
    lucide: "lucide:box",
  },
  palette: {
    default: "solar:palette-outline",
    mingcute: "mingcute:palette-line",
    solar: "solar:palette-outline",
    mdi: "mdi:palette-swatch-outline",
    "fa7-solid": "fa7-solid:palette",
    phosphor: "ph:palette",
    lucide: "lucide:palette",
  },
  "arrow-right": {
    default: "solar:alt-arrow-right-outline",
    mingcute: "mingcute:right-line",
    solar: "solar:alt-arrow-right-outline",
    mdi: "mdi:arrow-right",
    "fa7-solid": "fa7-solid:arrow-right",
    phosphor: "ph:arrow-right",
    lucide: "lucide:arrow-right",
  },
  "arrow-down": {
    default: "mingcute:down-line",
    mingcute: "mingcute:down-line",
    solar: "solar:alt-arrow-down-outline",
    mdi: "mdi:arrow-down",
    "fa7-solid": "fa7-solid:arrow-down",
    phosphor: "ph:arrow-down",
    lucide: "lucide:arrow-down",
  },
  user: {
    default: "solar:user-outline",
    mingcute: "mingcute:user-3-line",
    solar: "solar:user-outline",
    mdi: "mdi:account",
    "fa7-solid": "fa7-solid:user",
    phosphor: "ph:user",
    lucide: "lucide:user",
  },
  sun: {
    default: "solar:sun-2-outline",
    mingcute: "mingcute:sun-line",
    solar: "solar:sun-2-outline",
    mdi: "mdi:white-balance-sunny",
    "fa7-solid": "fa7-solid:sun",
    phosphor: "ph:sun",
    lucide: "lucide:sun",
  },
  moon: {
    default: "solar:moon-outline",
    mingcute: "mingcute:moon-line",
    solar: "solar:moon-outline",
    mdi: "mdi:weather-night",
    "fa7-solid": "fa7-solid:moon",
    phosphor: "ph:moon",
    lucide: "lucide:moon",
  },
  search: {
    default: "solar:magnifer-outline",
    mingcute: "mingcute:search-line",
    solar: "solar:magnifer-outline",
    mdi: "mdi:magnify",
    "fa7-solid": "fa7-solid:magnifying-glass",
    phosphor: "ph:magnifying-glass",
    lucide: "lucide:search",
  },
  hamburger: {
    default: "solar:hamburger-menu-outline",
    mingcute: "mingcute:menu-line",
    solar: "solar:hamburger-menu-outline",
    mdi: "mdi:menu",
    "fa7-solid": "fa7-solid:bars",
    phosphor: "ph:list",
    lucide: "lucide:menu",
  },
  settings: {
    default: "solar:settings-outline",
    mingcute: "mingcute:settings-3-line",
    solar: "solar:settings-outline",
    mdi: "mdi:cog",
    "fa7-solid": "fa7-solid:gear",
    phosphor: "ph:gear-six",
    lucide: "lucide:settings",
  },
  logout: {
    default: "solar:logout-2-outline",
    mingcute: "mingcute:exit-line",
    solar: "solar:logout-2-outline",
    mdi: "mdi:logout",
    "fa7-solid": "fa7-solid:right-from-bracket",
    phosphor: "ph:sign-out",
    lucide: "lucide:log-out",
  },
  bell: {
    default: "solar:bell-outline",
    mingcute: "mingcute:bell-ringing-line",
    solar: "solar:bell-outline",
    mdi: "mdi:bell",
    "fa7-solid": "fa7-solid:bell",
    phosphor: "ph:bell",
    lucide: "lucide:bell",
  },
  wallet: {
    default: "solar:wallet-outline",
    mingcute: "mingcute:wallet-line",
    solar: "solar:wallet-outline",
    mdi: "mdi:wallet-outline",
    "fa7-solid": "fa7-solid:wallet",
    phosphor: "ph:wallet",
    lucide: "lucide:wallet",
  },
  "users-group": {
    default: "solar:users-group-two-rounded-broken",
    mingcute: "mingcute:group-line",
    solar: "solar:users-group-two-rounded-broken",
    mdi: "mdi:account-group",
    "fa7-solid": "fa7-solid:users",
    phosphor: "ph:users-three",
    lucide: "lucide:users",
  },
  "pie-chart": {
    default: "solar:pie-chart-2-broken",
    mingcute: "mingcute:chart-pie-line",
    solar: "solar:pie-chart-2-broken",
    mdi: "mdi:chart-pie",
    "fa7-solid": "fa7-solid:chart-pie",
    phosphor: "ph:chart-pie-slice",
    lucide: "lucide:chart-pie",
  },
  lock: {
    default: "solar:lock-keyhole-outline",
    mingcute: "mingcute:lock-line",
    solar: "solar:lock-keyhole-outline",
    mdi: "mdi:lock",
    "fa7-solid": "fa7-solid:lock",
    phosphor: "ph:lock-key",
    lucide: "lucide:lock",
  },
  help: {
    default: "solar:help-outline",
    mingcute: "mingcute:question-line",
    solar: "solar:help-outline",
    mdi: "mdi:help-circle",
    "fa7-solid": "fa7-solid:circle-question",
    phosphor: "ph:question",
    lucide: "lucide:circle-question-mark",
  },
  globe: {
    default: "solar:globus-outline",
    mingcute: "mingcute:globe-line",
    solar: "solar:globus-outline",
    mdi: "mdi:earth",
    "fa7-solid": "fa7-solid:globe",
    phosphor: "ph:globe-hemisphere-west",
    lucide: "lucide:globe",
  },
  cart: {
    default: "solar:cart-5-broken",
    mingcute: "mingcute:shopping-cart-1-line",
    solar: "solar:cart-5-broken",
    mdi: "mdi:shopping",
    "fa7-solid": "fa7-solid:cart-shopping",
    phosphor: "ph:shopping-cart",
    lucide: "lucide:shopping-cart",
  },
  "check-double": {
    default: "bx:check-double",
    mingcute: "mingcute:check-circle-line",
    solar: "solar:verified-check-outline",
    mdi: "mdi:check",
    "fa7-solid": "fa7-solid:check-double",
    phosphor: "ph:checks",
    lucide: "lucide:check-check",
  },
  "bx-user": {
    default: "bx:user",
    mingcute: "mingcute:user-3-line",
    solar: "solar:user-outline",
    mdi: "mdi:account",
    "fa7-solid": "fa7-solid:user",
    phosphor: "ph:user",
    lucide: "lucide:user",
  },
  "bx-home": {
    default: "bx:home",
    mingcute: "mingcute:home-3-line",
    solar: "solar:home-outline",
    mdi: "mdi:home",
    "fa7-solid": "fa7-solid:house",
    phosphor: "ph:house",
    lucide: "lucide:house",
  },
  envelope: {
    default: "bx:envelope",
    mingcute: "mingcute:mail-line",
    solar: "solar:mailbox-linear",
    mdi: "mdi:email",
    "fa7-solid": "fa7-solid:envelope",
    phosphor: "ph:envelope-simple",
    lucide: "lucide:mail",
  },
  "info-circle": {
    default: "bx:info-circle",
    mingcute: "mingcute:information-line",
    solar: "solar:info-circle-outline",
    mdi: "mdi:information",
    "fa7-solid": "fa7-solid:circle-info",
    phosphor: "ph:info",
    lucide: "lucide:info",
  },
  "badge-check": {
    default: "bx:bxs-badge-check",
    mingcute: "mingcute:shield-line",
    solar: "solar:verified-check-outline",
    mdi: "mdi:shield-star",
    "fa7-solid": "fa7-solid:circle-check",
    phosphor: "ph:seal-check",
    lucide: "lucide:badge-check",
  },
  "x-circle": {
    default: "bx:x-circle",
    mingcute: "mingcute:close-circle-line",
    solar: "solar:close-circle-outline",
    mdi: "mdi:close-circle",
    "fa7-solid": "fa7-solid:circle-xmark",
    phosphor: "ph:x-circle",
    lucide: "lucide:circle-x",
  },
  "user-voice": {
    default: "bx:user-voice",
    mingcute: "mingcute:mic-line",
    solar: "solar:microphone-outline",
    mdi: "mdi:microphone",
    "fa7-solid": "fa7-solid:microphone",
    phosphor: "ph:microphone",
    lucide: "lucide:mic",
  },
  heart: {
    default: "bx:heart",
    mingcute: "mingcute:heart-line",
    solar: "solar:heart-outline",
    mdi: "mdi:heart",
    "fa7-solid": "fa7-solid:heart",
    phosphor: "ph:heart",
    lucide: "lucide:heart",
  },
  "cloud-upload": {
    default: "bx:cloud-upload",
    mingcute: "mingcute:upload-line",
    solar: "solar:cloud-upload-outline",
    mdi: "mdi:cloud-upload",
    "fa7-solid": "fa7-solid:cloud-arrow-up",
    phosphor: "ph:cloud-arrow-up",
    lucide: "lucide:cloud-upload",
  },
  cloud: {
    default: "bx:cloud",
    mingcute: "mingcute:cloud-line",
    solar: "solar:cloud-outline",
    mdi: "mdi:cloud",
    "fa7-solid": "fa7-solid:cloud",
    phosphor: "ph:cloud",
    lucide: "lucide:cloud",
  },
  "check-shield": {
    default: "bx:check-shield",
    mingcute: "mingcute:shield-line",
    solar: "solar:shield-check-bold",
    mdi: "mdi:shield-check",
    "fa7-solid": "fa7-solid:shield-halved",
    phosphor: "ph:shield-check",
    lucide: "lucide:shield-check",
  },
} as const satisfies Readonly<
  Record<DesignSystemIconConcept, Readonly<Record<DesignSystemIconFamily, string>>>
>;
