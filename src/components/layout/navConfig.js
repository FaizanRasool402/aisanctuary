import {
  BookIcon,
  CalendarIcon,
  ClipboardIcon,
  FileTextIcon,
  HomeIcon,
  LayersIcon,
  TeacherIcon,
  UsersIcon,
  WalletIcon,
} from '../ui/icons';

export const navByRole = {
  founder: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/students', label: 'Students', icon: UsersIcon },
    { to: '/teachers', label: 'Teachers', icon: TeacherIcon },
    { to: '/courses', label: 'Courses', icon: BookIcon },
    { to: '/batches', label: 'Batches', icon: LayersIcon },
    { to: '/enrollments', label: 'Enrollments', icon: FileTextIcon },
    { to: '/fees', label: 'Fees', icon: WalletIcon },
    { to: '/attendance', label: 'Attendance', icon: CalendarIcon },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/students', label: 'Students', icon: UsersIcon },
    { to: '/teachers', label: 'Teachers', icon: TeacherIcon },
    { to: '/courses', label: 'Courses', icon: BookIcon },
    { to: '/batches', label: 'Batches', icon: LayersIcon },
    { to: '/enrollments', label: 'Enrollments', icon: FileTextIcon },
    { to: '/enrollment-requests', label: 'Enrollment Requests', icon: ClipboardIcon },
    { to: '/fees', label: 'Fees', icon: WalletIcon },
    { to: '/attendance', label: 'Attendance', icon: CalendarIcon },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/batches', label: 'My Batches', icon: LayersIcon },
    { to: '/enrollments', label: 'My Students', icon: UsersIcon },
    { to: '/attendance', label: "Today's Class", icon: CalendarIcon },
  ],
  student: [
    { to: '/dashboard', label: 'My Dashboard', icon: HomeIcon },
    { to: '/apply', label: 'Apply for Course', icon: ClipboardIcon },
    { to: '/enrollments', label: 'My Courses', icon: BookIcon },
    { to: '/fees', label: 'My Fees', icon: WalletIcon },
    { to: '/attendance', label: 'My Attendance', icon: CalendarIcon },
  ],
};

export const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
  }`;
