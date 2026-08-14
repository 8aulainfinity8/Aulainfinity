import type { SVGProps, FC } from 'react';
import { MathIcon, PhysicsIcon, ChemistryIcon, BookOpenIcon, ChartBarIcon, BiologyIcon, HistoryIcon, LanguageIcon, ArtIcon, MusicIcon, CodeIcon } from './icons';

// FIX: Changed type to FC<SVGProps<SVGSVGElement>> to match the icon components' type (React.FC).
// React.FC can return null, which was incompatible with the previous `=> JSX.Element` return type.
export const iconMap: { [key: string]: any } = {
    MathIcon,
    PhysicsIcon,
    ChemistryIcon,
    BiologyIcon,
    HistoryIcon,
    LanguageIcon,
    ArtIcon,
    MusicIcon,
    CodeIcon,
    BookOpenIcon,
    ChartBarIcon,
};
