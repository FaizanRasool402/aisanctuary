import React from 'react';

const Svg = ({ className = 'h-5 w-5', children }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const make = (paths) => {
  const IconComponent = ({ className }) => <Svg className={className}>{paths}</Svg>;
  return IconComponent;
};

export const HomeIcon = make(
  <>
    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </>
);
export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </>
);
export const UsersIcon = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);
export const UserCheckIcon = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </>
);
export const UserXIcon = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m17 8 5 5M22 8l-5 5" />
  </>
);
export const TeacherIcon = make(
  <>
    <circle cx="12" cy="7" r="4" />
    <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
    <path d="M9 14l3 4 3-4" />
  </>
);
export const BookIcon = make(
  <>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </>
);
export const LayersIcon = make(
  <>
    <path d="m12 2 10 5-10 5L2 7z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </>
);
export const FileTextIcon = make(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </>
);
export const ClipboardIcon = make(
  <>
    <rect x="5" y="4" width="14" height="18" rx="2" />
    <path d="M9 2h6v4H9zM9 12h6M9 16h4" />
  </>
);
export const WalletIcon = make(
  <>
    <rect x="2" y="5" width="20" height="15" rx="2" />
    <path d="M2 10h20M16 15h2" />
  </>
);
export const CalendarIcon = make(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>
);
export const EyeIcon = make(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>
);
export const EditIcon = make(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </>
);
export const TrashIcon = make(
  <>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </>
);
export const PowerIcon = make(
  <>
    <path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10" />
  </>
);
export const DownloadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </>
);
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />);
export const ChevronLeftIcon = make(<path d="m15 18-6-6 6-6" />);
export const ChevronRightIcon = make(<path d="m9 18 6-6-6-6" />);
export const ResetIcon = make(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </>
);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const PlayIcon = make(<path d="M7 4v16l13-8z" />);
export const PauseIcon = make(<path d="M8 5v14M16 5v14" />);
export const CheckCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </>
);
export const XCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-6 6M9 9l6 6" />
  </>
);
export const AwardIcon = make(
  <>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
  </>
);
export const ChartIcon = make(<path d="M6 20V14M12 20V8M18 20V4" />);
export const BuildingIcon = make(
  <>
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </>
);
export const GraduationIcon = make(
  <>
    <path d="m22 10-10-5-10 5 10 5z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </>
);
export const SettingsIcon = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>
);
export const SaveIcon = make(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </>
);
export const CardIcon = make(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>
);
export const LogoutIcon = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </>
);
export const MenuIcon = make(<path d="M4 6h16M4 12h16M4 18h16" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />);
export const VideoIcon = make(
  <>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="m22 8-6 4 6 4z" />
  </>
);
export const LanguageIcon = make(
  <>
    <path d="M4 5h8M8 3v2M6 5c0 4 3 7 6 8M10 5c0 4-3 7-6 8" />
    <path d="m13 21 4-10 4 10M14.5 17h5" />
  </>
);
export const MonitorIcon = make(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>
);
export const CodeIcon = make(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />);
export const BarsIcon = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
