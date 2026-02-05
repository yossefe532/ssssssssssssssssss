import { v4 as uuidv4 } from 'uuid'
import { Student, Course, Group, Session, Attendance, DEFAULT_COURSES, AppState } from '@/types'
import { generateToken } from '@/lib/utils'

const STORAGE_KEY = 'zat_initiative_data_v2'
const AUTH_KEY = 'zat_initiative_auth'

// Admin credentials (in production, this would be in a secure backend)
const ADMIN_EMAIL = 'admin@zat.org'
const ADMIN_PASSWORD = 'zat2024'

// Initialize default courses
function initializeCourses(): Course[] {
  return DEFAULT_COURSES.map((c) => ({
    id: uuidv4(),
    name: c.name,
    nameEn: c.nameEn,
    description: c.description,
    icon: c.icon,
    createdAt: new Date().toISOString(),
  }))
}

// Load state from localStorage
export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      
      // Initialize courses if not present
      const courses = parsed.courses || initializeCourses()
      
      // Migrate groups from old format to new format
      const migratedGroups = (parsed.groups || []).map((g: any) => ({
        id: g.id,
        courseId: g.courseId || courses[0]?.id || '',
        name: g.name || g.nameEn || 'مجموعة',
        instructorName: g.instructorName || '',
        maxCapacity: g.maxCapacity || null,
        createdAt: g.createdAt || new Date().toISOString(),
      }))
      
      // Migrate students from old format (groupIds) to new format (courseId, groupId)
      const migratedStudents = (parsed.students || []).map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        phoneNumber: s.phoneNumber,
        isNew: s.isNew ?? true,
        certificateFeePaid: s.certificateFeePaid ?? false,
        firstInstallmentPaid: s.firstInstallmentPaid ?? false,
        secondInstallmentPaid: s.secondInstallmentPaid ?? false,
        courseId: s.courseId !== undefined ? s.courseId : null,
        groupId: s.groupId !== undefined ? s.groupId : (s.groupIds?.[0] || null),
        createdAt: s.createdAt || new Date().toISOString(),
      }))
      
      return {
        isAuthenticated: localStorage.getItem(AUTH_KEY) === 'true',
        students: migratedStudents,
        courses: courses,
        groups: migratedGroups,
        sessions: parsed.sessions || [],
        attendance: parsed.attendance || [],
      }
    }
  } catch (e) {
    console.error('Error loading state:', e)
  }
  
  // Return initial state with default courses
  const initialState: AppState = {
    isAuthenticated: false,
    students: [],
    courses: initializeCourses(),
    groups: [],
    sessions: [],
    attendance: [],
  }
  
  saveState(initialState)
  return initialState
}

// Save state to localStorage
export function saveState(state: AppState): void {
  try {
    const { isAuthenticated, ...dataToSave } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    localStorage.setItem(AUTH_KEY, String(isAuthenticated))
  } catch (e) {
    console.error('Error saving state:', e)
  }
}

// Auth functions
export function login(email: string, password: string): boolean {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function logout(): void {
  localStorage.setItem(AUTH_KEY, 'false')
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true'
}

// Student CRUD
export function addStudent(state: AppState, student: Omit<Student, 'id' | 'createdAt'>): AppState {
  const newStudent: Student = {
    ...student,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  const newState = {
    ...state,
    students: [...state.students, newStudent],
  }
  saveState(newState)
  return newState
}

export function updateStudent(state: AppState, id: string, updates: Partial<Student>): AppState {
  const newState = {
    ...state,
    students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
  }
  saveState(newState)
  return newState
}

export function deleteStudent(state: AppState, id: string): AppState {
  const newState = {
    ...state,
    students: state.students.filter((s) => s.id !== id),
    attendance: state.attendance.filter((a) => a.studentId !== id),
  }
  saveState(newState)
  return newState
}

export function getStudentByPhone(state: AppState, phone: string): Student | undefined {
  return state.students.find((s) => s.phoneNumber === phone)
}

export function getStudentsByCourse(state: AppState, courseId: string): Student[] {
  return state.students.filter((s) => s.courseId === courseId)
}

export function getStudentsByGroup(state: AppState, groupId: string): Student[] {
  return state.students.filter((s) => s.groupId === groupId)
}

export function moveStudentToGroup(state: AppState, studentId: string, newGroupId: string): AppState {
  const group = state.groups.find((g) => g.id === newGroupId)
  if (!group) return state
  
  const newState = {
    ...state,
    students: state.students.map((s) => 
      s.id === studentId 
        ? { ...s, groupId: newGroupId, courseId: group.courseId } 
        : s
    ),
  }
  saveState(newState)
  return newState
}

// Course CRUD
export function addCourse(state: AppState, course: Omit<Course, 'id' | 'createdAt'>): AppState {
  const newCourse: Course = {
    ...course,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  const newState = {
    ...state,
    courses: [...state.courses, newCourse],
  }
  saveState(newState)
  return newState
}

export function updateCourse(state: AppState, id: string, updates: Partial<Course>): AppState {
  const newState = {
    ...state,
    courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  }
  saveState(newState)
  return newState
}

export function deleteCourse(state: AppState, id: string): AppState {
  // Get groups in this course
  const groupIds = state.groups.filter((g) => g.courseId === id).map((g) => g.id)
  
  const newState = {
    ...state,
    courses: state.courses.filter((c) => c.id !== id),
    groups: state.groups.filter((g) => g.courseId !== id),
    sessions: state.sessions.filter((s) => !groupIds.includes(s.groupId)),
    students: state.students.map((s) => 
      s.courseId === id ? { ...s, courseId: null, groupId: null } : s
    ),
  }
  saveState(newState)
  return newState
}

// Group CRUD
export function addGroup(state: AppState, group: Omit<Group, 'id' | 'createdAt'>): AppState {
  const newGroup: Group = {
    ...group,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  const newState = {
    ...state,
    groups: [...state.groups, newGroup],
  }
  saveState(newState)
  return newState
}

export function updateGroup(state: AppState, id: string, updates: Partial<Group>): AppState {
  const newState = {
    ...state,
    groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
  }
  saveState(newState)
  return newState
}

export function deleteGroup(state: AppState, id: string): AppState {
  const newState = {
    ...state,
    groups: state.groups.filter((g) => g.id !== id),
    sessions: state.sessions.filter((s) => s.groupId !== id),
    students: state.students.map((s) => 
      s.groupId === id ? { ...s, groupId: null } : s
    ),
  }
  saveState(newState)
  return newState
}

export function getGroupsByCourse(state: AppState, courseId: string): Group[] {
  return state.groups.filter((g) => g.courseId === courseId)
}

export function getGroupStudentCount(state: AppState, groupId: string): number {
  return state.students.filter((s) => s.groupId === groupId).length
}

export function isGroupFull(state: AppState, groupId: string): boolean {
  const group = state.groups.find((g) => g.id === groupId)
  if (!group || !group.maxCapacity) return false
  return getGroupStudentCount(state, groupId) >= group.maxCapacity
}

// Session CRUD
export function addSession(state: AppState, session: Omit<Session, 'id' | 'qrToken' | 'createdAt'>): AppState {
  const newSession: Session = {
    ...session,
    id: uuidv4(),
    qrToken: generateToken(),
    createdAt: new Date().toISOString(),
  }
  const newState = {
    ...state,
    sessions: [...state.sessions, newSession],
  }
  saveState(newState)
  return newState
}

export function updateSession(state: AppState, id: string, updates: Partial<Session>): AppState {
  const newState = {
    ...state,
    sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
  }
  saveState(newState)
  return newState
}

export function deleteSession(state: AppState, id: string): AppState {
  const newState = {
    ...state,
    sessions: state.sessions.filter((s) => s.id !== id),
    attendance: state.attendance.filter((a) => a.sessionId !== id),
  }
  saveState(newState)
  return newState
}

export function getSessionByToken(state: AppState, token: string): Session | undefined {
  return state.sessions.find((s) => s.qrToken === token)
}

export function getSessionsByGroup(state: AppState, groupId: string): Session[] {
  return state.sessions.filter((s) => s.groupId === groupId).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// Attendance
export function markAttendance(state: AppState, studentId: string, sessionId: string): AppState {
  const existing = state.attendance.find(
    (a) => a.studentId === studentId && a.sessionId === sessionId
  )
  if (existing) {
    return state
  }
  
  const newAttendance: Attendance = {
    id: uuidv4(),
    studentId,
    sessionId,
    attendedAt: new Date().toISOString(),
  }
  
  const newState = {
    ...state,
    attendance: [...state.attendance, newAttendance],
  }
  saveState(newState)
  return newState
}

export function hasAttended(state: AppState, studentId: string, sessionId: string): boolean {
  return state.attendance.some(
    (a) => a.studentId === studentId && a.sessionId === sessionId
  )
}

export function getAttendanceBySession(state: AppState, sessionId: string): Attendance[] {
  return state.attendance.filter((a) => a.sessionId === sessionId)
}

// Stats helpers
export function getCourseStats(state: AppState, courseId: string) {
  const groups = getGroupsByCourse(state, courseId)
  const students = getStudentsByCourse(state, courseId)
  const sessions = state.sessions.filter((s) => 
    groups.some((g) => g.id === s.groupId)
  )
  
  return {
    groupCount: groups.length,
    studentCount: students.length,
    sessionCount: sessions.length,
  }
}

// Export functions
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
    ),
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}
