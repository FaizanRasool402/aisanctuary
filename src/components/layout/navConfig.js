export const navByRole = {
  founder: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/students', label: 'Students' },
    { to: '/teachers', label: 'Teachers' },
    { to: '/courses', label: 'Courses' },
    { to: '/batches', label: 'Batches' },
    { to: '/enrollments', label: 'Enrollments' },
    { to: '/fees', label: 'Fees' },
    { to: '/attendance', label: 'Attendance' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/students', label: 'Students' },
    { to: '/teachers', label: 'Teachers' },
    { to: '/courses', label: 'Courses' },
    { to: '/batches', label: 'Batches' },
    { to: '/enrollments', label: 'Enrollments' },
    { to: '/enrollment-requests', label: 'Enrollment Requests' },
    { to: '/fees', label: 'Fees' },
    { to: '/attendance', label: 'Attendance' },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/batches', label: 'My Batches' },
    { to: '/enrollments', label: 'My Students' },
    { to: '/attendance', label: "Today's Class" },
  ],
  student: [
    { to: '/dashboard', label: 'My Dashboard' },
    { to: '/apply', label: 'Apply for Course' },
    { to: '/enrollments', label: 'My Courses' },
    { to: '/fees', label: 'My Fees' },
    { to: '/attendance', label: 'My Attendance' },
  ],
};

export const navLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-navy-50 text-navy-600' : 'text-gray-600 hover:bg-navy-50 hover:text-navy-600'
  }`;
