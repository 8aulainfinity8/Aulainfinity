// AulaInfinity Official Visual Identity Assets
// Single source of truth for the official logo and app icon/symbol

export const OFFICIAL_LOGO_PATH = '/brand/logo.png';
export const OFFICIAL_ICON_PATH = '/brand/icon.png';

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, type: 'full' | 'icon' = 'full') {
    const target = e.currentTarget;
    const fallback = type === 'icon' ? OFFICIAL_ICON_PATH : OFFICIAL_LOGO_PATH;
    if (target.src !== fallback && !target.src.endsWith(fallback)) {
        target.src = fallback;
    }
}


