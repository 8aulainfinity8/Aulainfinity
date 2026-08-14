import React, { memo, SVGProps } from 'react';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Sun,
  Moon,
  ExternalLink,
  Play,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart2,
  GraduationCap,
  Lock,
  CreditCard,
  Sparkles,
  Video,
  Eye,
  EyeOff,
  HelpCircle,
  FileDown,
  Lightbulb,
  Send,
  User,
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  Wifi,
  MessageSquare,
  LineChart,
  PlusCircle,
  FolderPlus,
  Calendar,
  Trash2,
  Pencil,
  Quote,
  Paperclip,
  Beaker,
  Trophy,
  Dna,
  History as HistoryLucide,
  Languages,
  Palette,
  Music,
  Code,
  Info,
  AlertTriangle,
  Filter,
  Home,
  Share2,
  Download,
  Camera,
  Maximize2,
  Minimize2,
  List,
  Mail,
  Zap,
  UserCircle,
  Clock,
  Upload,
} from 'lucide-react';

// Unified icon wrapping utility
const createIcon = (LucideIcon: React.ComponentType<any>) => memo((props: SVGProps<SVGSVGElement>) => {
  return <LucideIcon {...(props as any)} />;
});

// General Icons
export const MenuIcon = createIcon(Menu);
export const CloseIcon = createIcon(X);
export const ChevronLeftIcon = createIcon(ChevronLeft);
export const ChevronRightIcon = createIcon(ChevronRight);
export const SearchIcon = createIcon(Search);
export const SunIcon = createIcon(Sun);
export const MoonIcon = createIcon(Moon);
export const ExternalLinkIcon = createIcon(ExternalLink);

// Subject Icons
export const PhysicsIcon = createIcon(Zap);
export const BiologyIcon = createIcon(Dna);
export const ChemistryIcon = createIcon(Beaker);
export const MathIcon = createIcon(GraduationCap);
export const HistoryIcon = createIcon(HistoryLucide);
export const LanguageIcon = createIcon(Languages);
export const ArtIcon = createIcon(Palette);
export const MusicIcon = createIcon(Music);
export const CodeIcon = createIcon(Code);

// UI & Feature Icons
export const PlayIcon = createIcon(Play);
export const CheckCircleIcon = createIcon(CheckCircle);
export const XCircleIcon = createIcon(XCircle);
export const BookOpenIcon = createIcon(BookOpen);
export const ChartBarIcon = createIcon(BarChart2);
export const AcademicCapIcon = createIcon(GraduationCap);
export const LockClosedIcon = createIcon(Lock);
export const CreditCardIcon = createIcon(CreditCard);
export const SparklesIcon = createIcon(Sparkles);
export const VideoCameraIcon = createIcon(Video);
export const EyeIcon = createIcon(Eye);
export const EyeSlashIcon = createIcon(EyeOff);
export const QuestionMarkCircleIcon = createIcon(HelpCircle);
export const DocumentDownloadIcon = createIcon(FileDown);
export const LightBulbIcon = createIcon(Lightbulb);
export const PaperAirplaneIcon = createIcon(Send);
export const UserCircleIcon = createIcon(UserCircle);
export const AtSymbolIcon = createIcon(Mail);
export const UserIcon = createIcon(User);

// Admin Icons
export const DashboardIcon = createIcon(LayoutDashboard);
export const UsersIcon = createIcon(Users);
export const FolderOpenIcon = createIcon(FolderOpen);
export const CogIcon = createIcon(Settings);
export const LogoutIcon = createIcon(LogOut);
export const WifiIcon = createIcon(Wifi);
export const ChatBubbleLeftRightIcon = createIcon(MessageSquare);
export const ChartLineIcon = createIcon(LineChart);
export const ChartBarSquareIcon = createIcon(BarChart2);
export const PlusCircleIcon = createIcon(PlusCircle);
export const FolderPlusIcon = createIcon(FolderPlus);
export const CalendarIcon = createIcon(Calendar);
export const UserGroupIcon = createIcon(Users);
export const TrashIcon = createIcon(Trash2);
export const PencilIcon = createIcon(Pencil);
export const TestimonialQuoteIcon = createIcon(Quote);
export const PaperclipIcon = createIcon(Paperclip);
export const TrophyIcon = createIcon(Trophy);
export const ClockIcon = createIcon(Clock);

export const YouTubeIcon = memo((props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="currentColor">
    <path d="M27.5 7.28a3.5 3.5 0 0 0-2.47-2.47C22.5 4 14 4 14 4s-8.5 0-11.03.81a3.5 3.5 0 0 0-2.47 2.47C0 9.81 0 14 0 14s0 4.19.5 6.72a3.5 3.5 0 0 0 2.47 2.47C5.5 24 14 24 14 24s8.5 0 11.03-.81a3.5 3.5 0 0 0 2.47-2.47C28 18.19 28 14 28 14s0-4.19-.5-6.72zM11.2 18.4V9.6L18.6 14l-7.4 4.4z" />
  </svg>
));

// UI Icons
export const InfoIcon = createIcon(Info);
export const ExclamationTriangleIcon = createIcon(AlertTriangle);
export const FilterIcon = createIcon(Filter);
export const HomeIcon = createIcon(Home);
export const ShareIcon = createIcon(Share2);
export const DownloadIcon = createIcon(Download);
export const CameraIcon = createIcon(Camera);
export const ArrowsPointingOutIcon = createIcon(Maximize2);
export const ArrowsPointingInIcon = createIcon(Minimize2);
export const ListBulletIcon = createIcon(List);
export const CloudArrowUpIcon = createIcon(Upload);

