// AulaInfinity Official Visual Identity Assets
// Single source of truth for the official logo and app icon/symbol

export const OFFICIAL_LOGO_PATH = '/brand/logo.jpg?v=2';
export const OFFICIAL_ICON_PATH = '/brand/icon.png?v=2';

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, type: 'full' | 'icon' = 'full') {
    const target = e.currentTarget;

    console.error('DIAGNOSTIC - Image load failed:', {
        src: target.src,
        currentSrc: target.currentSrc,
        complete: target.complete,
        naturalWidth: target.naturalWidth,
        naturalHeight: target.naturalHeight,
        width: target.width,
        height: target.height,
        outerHTML: target.outerHTML,
        visibilityState: document.visibilityState,
        type
    });
}


