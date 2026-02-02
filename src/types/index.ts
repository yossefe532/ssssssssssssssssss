// Types for ZAT Initiative Management System

export interface Student {
  id: string
  fullName: string
  phoneNumber: string
  isNew: boolean
  certificateFeePaid: boolean
  firstInstallmentPaid: boolean
  secondInstallmentPaid: boolean
  courseId: string | null
  groupId: string | null
  createdAt: string
}

export interface Course {
  id: string
  name: string
  nameEn: string
  description: string
  icon: string
  createdAt: string
}

export interface Group {
  id: string
  courseId: string
  name: string
  instructorName: string
  maxCapacity: number | null
  createdAt: string
}

export interface Session {
  id: string
  groupId: string
  title: string
  date: string
  qrToken: string
  createdAt: string
}

export interface Attendance {
  id: string
  studentId: string
  sessionId: string
  attendedAt: string
}

export interface Admin {
  email: string
  password: string
}

export interface AppState {
  isAuthenticated: boolean
  students: Student[]
  courses: Course[]
  groups: Group[]
  sessions: Session[]
  attendance: Attendance[]
}

// Default courses to pre-create
export const DEFAULT_COURSES: Omit<Course, 'id' | 'createdAt'>[] = [
  { name: 'اللغة الإنجليزية', nameEn: 'English', description: 'دورات اللغة الإنجليزية', icon: '🇬🇧' },
  { name: 'اللغة الألمانية', nameEn: 'German', description: 'دورات اللغة الألمانية', icon: '🇩🇪' },
  { name: 'ICDL', nameEn: 'ICDL', description: 'الرخصة الدولية لقيادة الحاسوب', icon: '💻' },
  { name: 'فوتوشوب', nameEn: 'Photoshop', description: 'تصميم الجرافيك', icon: '🎨' },
  { name: 'الذكاء الاصطناعي', nameEn: 'AI', description: 'دورات الذكاء الاصطناعي', icon: '🤖' },
  { name: 'البرمجة', nameEn: 'Programming', description: 'HTML + CSS + JavaScript', icon: '👨‍💻' },
  { name: 'تحرير الفيديو', nameEn: 'Video Editing', description: 'Premiere Pro', icon: '🎬' },
  { name: 'موشن جرافيك', nameEn: 'Motion Graphics', description: 'After Effects', icon: '✨' },
  { name: 'كانفا', nameEn: 'Canva', description: 'Canva + Whiteboard', icon: '🖼️' },
]

// Default groups for each course
export const DEFAULT_GROUPS: Omit<Group, 'id' | 'createdAt'>[] = []
