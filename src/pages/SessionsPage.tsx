import React, { useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Plus, Edit2, Trash2, QrCode, Calendar, Users,
  Download, Copy, ExternalLink, ChevronDown, ChevronUp,
  BookOpen
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { AdminLayout } from '@/components/AdminLayout'
import { Modal } from '@/components/Modal'
import { showToast } from '@/components/Toast'
import { Session } from '@/types'
import { addSession, updateSession, deleteSession, exportToCSV, getStudentsByGroup } from '@/store'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function SessionsPage() {
  const { state, setState } = useApp()
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [viewingSession, setViewingSession] = useState<Session | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    courseId: '',
    groupId: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
  })
  
  // Get groups for selected course in form
  const formGroups = useMemo(() => {
    if (!formData.courseId) return []
    return state.groups.filter((g) => g.courseId === formData.courseId)
  }, [state.groups, formData.courseId])
  
  // Filter groups based on selection
  const filteredGroups = useMemo(() => {
    let groups = state.groups
    if (selectedCourse) {
      groups = groups.filter((g) => g.courseId === selectedCourse)
    }
    if (selectedGroup) {
      groups = groups.filter((g) => g.id === selectedGroup)
    }
    return groups
  }, [state.groups, selectedCourse, selectedGroup])
  
  // Group sessions by group
  const sessionsByGroup = useMemo(() => {
    return filteredGroups.map((group) => {
      const course = state.courses.find((c) => c.id === group.courseId)
      return {
        group,
        course,
        sessions: state.sessions
          .filter((s) => s.groupId === group.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }
    }).filter((g) => g.sessions.length > 0 || (!selectedCourse && !selectedGroup))
  }, [filteredGroups, state.sessions, state.courses, selectedCourse, selectedGroup])
  
  const openAddModal = (groupId?: string) => {
    const group = groupId ? state.groups.find((g) => g.id === groupId) : null
    setEditingSession(null)
    setFormData({
      courseId: group?.courseId || state.courses[0]?.id || '',
      groupId: groupId || '',
      title: `الجلسة ${state.sessions.filter((s) => s.groupId === groupId).length + 1}`,
      date: new Date().toISOString().split('T')[0],
    })
    setIsModalOpen(true)
  }
  
  const openEditModal = (session: Session) => {
    const group = state.groups.find((g) => g.id === session.groupId)
    setEditingSession(session)
    setFormData({
      courseId: group?.courseId || '',
      groupId: session.groupId,
      title: session.title,
      date: session.date.split('T')[0],
    })
    setIsModalOpen(true)
  }
  
  const openQRModal = (session: Session) => {
    setViewingSession(session)
    setIsQRModalOpen(true)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSession) {
      setState(updateSession(state, editingSession.id, {
        groupId: formData.groupId,
        title: formData.title,
        date: formData.date,
      }))
      showToast('تم تحديث الجلسة', 'success')
    } else {
      setState(addSession(state, {
        groupId: formData.groupId,
        title: formData.title,
        date: formData.date,
      }))
      showToast('تم إنشاء الجلسة', 'success')
    }
    
    setIsModalOpen(false)
  }
  
  const handleDelete = (session: Session) => {
    const attendanceCount = state.attendance.filter((a) => a.sessionId === session.id).length
    if (attendanceCount > 0) {
      if (!confirm(`هذه الجلسة تحتوي على ${attendanceCount} سجل حضور. هل تريد الحذف؟`)) {
        return
      }
    } else if (!confirm(`هل أنت متأكد من حذف "${session.title}"؟`)) {
      return
    }
    
    setState(deleteSession(state, session.id))
    showToast('تم حذف الجلسة', 'success')
  }
  
  const getQRUrl = (session: Session) => {
    return `${window.location.origin}/attend/${session.qrToken}`
  }
  
  const copyQRUrl = (session: Session) => {
    navigator.clipboard.writeText(getQRUrl(session))
    showToast('تم نسخ الرابط', 'success')
  }
  
  const downloadQR = (session: Session) => {
    const svg = document.getElementById(`qr-${session.id}`)
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `qr-${session.title}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    showToast('جاري تحميل الصورة...', 'info')
  }
  
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }
  
  const exportGroupData = (groupId: string) => {
    const group = state.groups.find((g) => g.id === groupId)
    const course = group ? state.courses.find((c) => c.id === group.courseId) : null
    const sessions = state.sessions.filter((s) => s.groupId === groupId)
    const students = getStudentsByGroup(state, groupId)
    
    const data = students.map((student) => {
      const row: Record<string, unknown> = {
        'الاسم': student.fullName,
        'رقم الهاتف': student.phoneNumber,
        'جديد/قديم': student.isNew ? 'جديد' : 'قديم',
        'رسوم الشهادة': student.certificateFeePaid ? '✓' : '✗',
        'القسط الأول': student.firstInstallmentPaid ? '✓' : '✗',
        'القسط الثاني': student.secondInstallmentPaid ? '✓' : '✗',
      }
      
      sessions.forEach((session, index) => {
        const attended = state.attendance.some(
          (a) => a.studentId === student.id && a.sessionId === session.id
        )
        row[`جلسة ${index + 1}`] = attended ? '✓' : '✗'
      })
      
      return row
    })
    
    const filename = `${course?.name || 'course'}-${group?.name || 'group'}-${new Date().toISOString().split('T')[0]}`
    exportToCSV(data, filename)
    showToast('تم تصدير البيانات', 'success')
  }
  
  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, courseId, groupId: '' })
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">الجلسات</h1>
            <p className="text-muted-foreground mt-1">{state.sessions.length} جلسة</p>
          </div>
          <button onClick={() => openAddModal()} className="btn-primary btn-md">
            <Plus className="h-4 w-4" />
            جلسة جديدة
          </button>
        </div>
        
        {/* Filters */}
        <div className="card p-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">الكورس</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSelectedGroup('')
                }}
                className="input"
              >
                <option value="">جميع الكورسات</option>
                {state.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.icon} {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المجموعة</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input"
                disabled={!selectedCourse}
              >
                <option value="">جميع المجموعات</option>
                {selectedCourse && state.groups
                  .filter((g) => g.courseId === selectedCourse)
                  .map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>
        
        {/* Sessions by Group */}
        <div className="space-y-4">
          {sessionsByGroup.length === 0 ? (
            <div className="empty-state">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">لا توجد جلسات</h3>
              <p className="text-muted-foreground mt-1">
                {state.groups.length === 0 
                  ? 'قم بإنشاء مجموعة أولاً'
                  : 'ابدأ بإنشاء جلسة جديدة'
                }
              </p>
            </div>
          ) : (
            sessionsByGroup.map(({ group, course, sessions }) => {
              const isExpanded = expandedGroups.includes(group.id) || sessions.length <= 5
              const displaySessions = isExpanded ? sessions : sessions.slice(0, 3)
              const studentsInGroup = getStudentsByGroup(state, group.id)
              
              return (
                <div key={group.id} className="card overflow-hidden">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border-b border-border gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold">
                          {course && <span className="text-muted-foreground">{course.icon} </span>}
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {sessions.length} جلسة • {studentsInGroup.length} طالب
                          {group.instructorName && ` • ${group.instructorName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => exportGroupData(group.id)}
                        className="btn-ghost btn-sm"
                        title="تصدير"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openAddModal(group.id)}
                        className="btn-outline btn-sm"
                      >
                        <Plus className="h-4 w-4" />
                        جلسة
                      </button>
                    </div>
                  </div>
                  
                  {/* Sessions List - Mobile Cards */}
                  {sessions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      لا توجد جلسات لهذه المجموعة
                    </div>
                  ) : (
                    <>
                      {/* Mobile View - Cards */}
                      <div className="md:hidden divide-y divide-border">
                        {displaySessions.map((session) => {
                          const attendanceCount = state.attendance.filter(
                            (a) => a.sessionId === session.id
                          ).length
                          
                          return (
                            <div key={session.id} className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium">{session.title}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate(session.date)}</p>
                                </div>
                                <span className="badge-success">
                                  {attendanceCount}/{studentsInGroup.length}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openQRModal(session)}
                                  className="btn-primary btn-sm flex-1"
                                >
                                  <QrCode className="h-4 w-4" />
                                  QR Code
                                </button>
                                <button
                                  onClick={() => copyQRUrl(session)}
                                  className="btn-outline btn-sm"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(session)}
                                  className="btn-ghost btn-sm"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(session)}
                                  className="btn-ghost btn-sm text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Desktop View - Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>الجلسة</th>
                              <th>التاريخ</th>
                              <th>الحضور</th>
                              <th>QR Code</th>
                              <th>إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displaySessions.map((session) => {
                              const attendanceCount = state.attendance.filter(
                                (a) => a.sessionId === session.id
                              ).length
                              
                              return (
                                <tr key={session.id}>
                                  <td className="font-medium">{session.title}</td>
                                  <td>{formatDate(session.date)}</td>
                                  <td>
                                    <span className="badge-success">
                                      {attendanceCount} / {studentsInGroup.length}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => openQRModal(session)}
                                      className="btn-outline btn-sm"
                                    >
                                      <QrCode className="h-4 w-4" />
                                      عرض
                                    </button>
                                  </td>
                                  <td>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => copyQRUrl(session)}
                                        className="btn-ghost btn-icon rounded-lg"
                                        title="نسخ الرابط"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openEditModal(session)}
                                        className="btn-ghost btn-icon rounded-lg"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(session)}
                                        className="btn-ghost btn-icon rounded-lg text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {sessions.length > 5 && (
                        <button
                          onClick={() => toggleGroupExpand(group.id)}
                          className="w-full p-3 text-center text-sm text-primary hover:bg-muted/50 border-t border-border flex items-center justify-center gap-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              عرض أقل
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              عرض الكل ({sessions.length - 3} جلسة أخرى)
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
      
      {/* Add/Edit Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'تعديل الجلسة' : 'إنشاء جلسة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">الكورس *</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="input"
              required
            >
              <option value="">اختر الكورس</option>
              {state.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.icon} {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">المجموعة *</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="input"
              required
              disabled={!formData.courseId}
            >
              <option value="">اختر المجموعة</option>
              {formGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            {formData.courseId && formGroups.length === 0 && (
              <p className="text-sm text-warning mt-1">لا توجد مجموعات في هذا الكورس</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">عنوان الجلسة *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="مثال: الجلسة 1"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">التاريخ *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="btn-primary btn-md flex-1"
              disabled={!formData.groupId}
            >
              {editingSession ? 'حفظ التعديلات' : 'إنشاء الجلسة'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn-outline btn-md"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title={viewingSession?.title || 'QR Code'}
        className="max-w-md"
      >
        {viewingSession && (
          <div className="text-center space-y-6">
            <div className="qr-container mx-auto">
              <QRCodeSVG
                id={`qr-${viewingSession.id}`}
                value={getQRUrl(viewingSession)}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">رابط التسجيل:</p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all text-start" dir="ltr">
                  {getQRUrl(viewingSession)}
                </code>
                <button
                  onClick={() => copyQRUrl(viewingSession)}
                  className="btn-ghost btn-icon rounded-lg shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => downloadQR(viewingSession)}
                className="btn-primary btn-md flex-1"
              >
                <Download className="h-4 w-4" />
                تحميل الصورة
              </button>
              <a
                href={getQRUrl(viewingSession)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-md"
              >
                <ExternalLink className="h-4 w-4" />
                فتح
              </a>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
