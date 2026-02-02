import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, BookOpen, Calendar, UserCheck, TrendingUp, 
  Clock, ChevronLeft, AlertCircle, CheckCircle
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { AdminLayout } from '@/components/AdminLayout'
import { getCourseStats, getGroupStudentCount, isGroupFull } from '@/store'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { state } = useApp()
  
  // Calculate stats
  const totalStudents = state.students.length
  const totalCourses = state.courses.length
  const totalGroups = state.groups.length
  const totalSessions = state.sessions.length
  const unassignedStudents = state.students.filter(s => !s.groupId).length
  
  const stats = [
    {
      label: 'إجمالي الطلاب',
      value: totalStudents,
      icon: Users,
      color: 'from-red-500 to-red-600',
      link: '/admin/students',
    },
    {
      label: 'الكورسات',
      value: totalCourses,
      icon: BookOpen,
      color: 'from-rose-500 to-rose-600',
      link: '/admin/courses',
    },
    {
      label: 'المجموعات',
      value: totalGroups,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      link: '/admin/courses',
    },
    {
      label: 'الجلسات',
      value: totalSessions,
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      link: '/admin/sessions',
    },
  ]
  
  // Get recent sessions
  const recentSessions = [...state.sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  
  // Get courses with stats
  const coursesWithStats = state.courses.map((course) => ({
    course,
    ...getCourseStats(state, course.id),
  })).sort((a, b) => b.studentCount - a.studentCount)
  
  // Get groups that are almost full or full
  const groupsStatus = state.groups
    .filter(g => g.maxCapacity)
    .map(group => {
      const count = getGroupStudentCount(state, group.id)
      const course = state.courses.find(c => c.id === group.courseId)
      return {
        group,
        course,
        count,
        isFull: isGroupFull(state, group.id),
        percentage: group.maxCapacity ? (count / group.maxCapacity) * 100 : 0,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
  
  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">مرحباً بك في نظام إدارة مبادرة زات</p>
        </div>
        
        {/* Alert for unassigned students */}
        {unassignedStudents > 0 && (
          <div className="card p-4 border-warning bg-warning/5 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">
              يوجد <strong>{unassignedStudents}</strong> طالب غير موزع على مجموعات
            </p>
            <Link to="/admin/students" className="btn-outline btn-sm mr-auto">
              عرض
            </Link>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.link} className="card-interactive p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Courses Overview */}
          <div className="card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                الكورسات
              </h2>
              <Link to="/admin/courses" className="text-sm text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            
            {coursesWithStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد كورسات بعد</p>
            ) : (
              <div className="space-y-3">
                {coursesWithStats.slice(0, 5).map(({ course, studentCount, groupCount }) => (
                  <Link
                    key={course.id}
                    to={`/admin/courses/${course.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{course.icon}</span>
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {groupCount} مجموعة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-primary">{studentCount} طالب</span>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Groups Capacity */}
          <div className="card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                حالة المجموعات
              </h2>
            </div>
            
            {groupsStatus.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد مجموعات بحد أقصى</p>
            ) : (
              <div className="space-y-4">
                {groupsStatus.map(({ group, course, count, isFull, percentage }) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{group.name}</span>
                        {course && (
                          <span className="text-muted-foreground"> - {course.name}</span>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        isFull ? 'text-destructive' : percentage >= 80 ? 'text-warning' : 'text-success'
                      )}>
                        {count} / {group.maxCapacity}
                        {isFull && ' (مكتمل)'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isFull ? 'bg-destructive' : percentage >= 80 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Sessions */}
          <div className="card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                آخر الجلسات
              </h2>
              <Link to="/admin/sessions" className="text-sm text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            
            {recentSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد جلسات بعد</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const group = state.groups.find((g) => g.id === session.groupId)
                  const course = group ? state.courses.find((c) => c.id === group.courseId) : null
                  const attendanceCount = state.attendance.filter((a) => a.sessionId === session.id).length
                  
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course?.name} {group && `- ${group.name}`}
                        </p>
                      </div>
                      <span className="badge-success">{attendanceCount} حضور</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/students" className="btn-outline btn-md justify-center">
                <Users className="h-4 w-4" />
                إضافة طالب
              </Link>
              <Link to="/admin/courses" className="btn-outline btn-md justify-center">
                <BookOpen className="h-4 w-4" />
                إضافة كورس
              </Link>
              <Link to="/admin/sessions" className="btn-outline btn-md justify-center">
                <Calendar className="h-4 w-4" />
                إنشاء جلسة
              </Link>
              <Link to="/admin/sessions" className="btn-primary btn-md justify-center">
                <UserCheck className="h-4 w-4" />
                تسجيل حضور
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
