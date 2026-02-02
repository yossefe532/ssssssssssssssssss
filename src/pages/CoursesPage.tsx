import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Plus, Edit2, Trash2, Users, ChevronLeft, 
  UserPlus, Settings, GraduationCap, ArrowRight,
  Search, MoreVertical, User
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { AdminLayout } from '@/components/AdminLayout'
import { Modal } from '@/components/Modal'
import { showToast } from '@/components/Toast'
import { Course, Group } from '@/types'
import { 
  addCourse, updateCourse, deleteCourse,
  addGroup, updateGroup, deleteGroup,
  getGroupsByCourse, getStudentsByCourse, getGroupStudentCount, isGroupFull,
  getCourseStats
} from '@/store'
import { cn } from '@/lib/utils'

export function CoursesPage() {
  const { state, setState } = useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [search, setSearch] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    icon: '📚',
  })
  
  const filteredCourses = useMemo(() => {
    if (!search) return state.courses
    return state.courses.filter((c) => 
      c.name.includes(search) || c.nameEn.toLowerCase().includes(search.toLowerCase())
    )
  }, [state.courses, search])
  
  const openAddModal = () => {
    setEditingCourse(null)
    setFormData({ name: '', nameEn: '', description: '', icon: '📚' })
    setIsModalOpen(true)
  }
  
  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      nameEn: course.nameEn,
      description: course.description,
      icon: course.icon,
    })
    setIsModalOpen(true)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCourse) {
      setState(updateCourse(state, editingCourse.id, formData))
      showToast('تم تحديث الكورس', 'success')
    } else {
      setState(addCourse(state, formData))
      showToast('تم إضافة الكورس', 'success')
    }
    
    setIsModalOpen(false)
  }
  
  const handleDelete = (course: Course) => {
    const stats = getCourseStats(state, course.id)
    if (stats.studentCount > 0) {
      if (!confirm(`هذا الكورس يحتوي على ${stats.studentCount} طالب. هل تريد الحذف؟`)) {
        return
      }
    } else if (!confirm(`هل أنت متأكد من حذف "${course.name}"؟`)) {
      return
    }
    
    setState(deleteCourse(state, course.id))
    showToast('تم حذف الكورس', 'success')
  }
  
  const emojiOptions = ['📚', '🇬🇧', '🇩🇪', '💻', '🎨', '🤖', '👨‍💻', '🎬', '✨', '🖼️', '📊', '🎯']
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">الكورسات</h1>
            <p className="text-muted-foreground mt-1">{state.courses.length} كورس</p>
          </div>
          <button onClick={openAddModal} className="btn-primary btn-md">
            <Plus className="h-4 w-4" />
            إضافة كورس
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الكورسات..."
            className="search-input w-full"
          />
        </div>
        
        {/* Courses Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const stats = getCourseStats(state, course.id)
            
            return (
              <Link
                key={course.id}
                to={`/admin/courses/${course.id}`}
                className="card-interactive p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                      {course.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{course.nameEn}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openEditModal(course)
                    }}
                    className="btn-ghost btn-icon rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
                
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {stats.studentCount} طالب
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {stats.groupCount} مجموعة
                    </span>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
        
        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">
              {search ? 'لا توجد نتائج' : 'لا توجد كورسات'}
            </h3>
            <p className="text-muted-foreground mt-1">
              {search ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة كورس جديد'}
            </p>
          </div>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'تعديل الكورس' : 'إضافة كورس جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={cn(
                    'w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all',
                    formData.icon === emoji 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">اسم الكورس بالعربية *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="مثال: البرمجة"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">اسم الكورس بالإنجليزية</label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="input"
              placeholder="e.g., Programming"
              dir="ltr"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="وصف مختصر للكورس..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary btn-md flex-1">
              {editingCourse ? 'حفظ التعديلات' : 'إضافة الكورس'}
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
    </AdminLayout>
  )
}

// Course Detail Page
export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { state, setState } = useApp()
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [showStudents, setShowStudents] = useState<string | null>(null)
  
  const [groupForm, setGroupForm] = useState({
    name: '',
    instructorName: '',
    maxCapacity: '',
  })
  
  const course = state.courses.find((c) => c.id === courseId)
  const groups = useMemo(() => 
    courseId ? getGroupsByCourse(state, courseId) : [],
    [state, courseId]
  )
  const students = useMemo(() => 
    courseId ? getStudentsByCourse(state, courseId) : [],
    [state, courseId]
  )
  
  if (!course) {
    return (
      <AdminLayout>
        <div className="empty-state">
          <h3 className="text-lg font-medium">الكورس غير موجود</h3>
          <button onClick={() => navigate('/admin/courses')} className="btn-primary btn-md mt-4">
            العودة للكورسات
          </button>
        </div>
      </AdminLayout>
    )
  }
  
  const openAddGroupModal = () => {
    setEditingGroup(null)
    setGroupForm({ name: '', instructorName: '', maxCapacity: '' })
    setIsGroupModalOpen(true)
  }
  
  const openEditGroupModal = (group: Group) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      instructorName: group.instructorName,
      maxCapacity: group.maxCapacity?.toString() || '',
    })
    setIsGroupModalOpen(true)
  }
  
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const groupData = {
      courseId: course.id,
      name: groupForm.name,
      instructorName: groupForm.instructorName,
      maxCapacity: groupForm.maxCapacity ? parseInt(groupForm.maxCapacity) : null,
    }
    
    if (editingGroup) {
      setState(updateGroup(state, editingGroup.id, groupData))
      showToast('تم تحديث المجموعة', 'success')
    } else {
      setState(addGroup(state, groupData))
      showToast('تم إضافة المجموعة', 'success')
    }
    
    setIsGroupModalOpen(false)
  }
  
  const handleDeleteGroup = (group: Group) => {
    const studentCount = getGroupStudentCount(state, group.id)
    if (studentCount > 0) {
      if (!confirm(`هذه المجموعة تحتوي على ${studentCount} طالب. هل تريد الحذف؟`)) {
        return
      }
    } else if (!confirm(`هل أنت متأكد من حذف "${group.name}"؟`)) {
      return
    }
    
    setState(deleteGroup(state, group.id))
    showToast('تم حذف المجموعة', 'success')
  }
  
  const getGroupStudents = (groupId: string) => {
    return students.filter((s) => s.groupId === groupId)
  }
  
  const unassignedStudents = students.filter((s) => !s.groupId)
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/courses')}
            className="btn-ghost btn-icon rounded-xl"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{course.icon}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{course.name}</h1>
                <p className="text-muted-foreground">{course.nameEn}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{students.length}</p>
            <p className="text-sm text-muted-foreground">طالب</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{groups.length}</p>
            <p className="text-sm text-muted-foreground">مجموعة</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-primary">{unassignedStudents.length}</p>
            <p className="text-sm text-muted-foreground">غير موزع</p>
          </div>
        </div>
        
        {/* Groups Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">المجموعات</h2>
          <button onClick={openAddGroupModal} className="btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            مجموعة جديدة
          </button>
        </div>
        
        {groups.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground">لا توجد مجموعات بعد</p>
            <button onClick={openAddGroupModal} className="btn-outline btn-md mt-4">
              <Plus className="h-4 w-4" />
              إضافة أول مجموعة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const studentCount = getGroupStudentCount(state, group.id)
              const isFull = isGroupFull(state, group.id)
              const groupStudents = getGroupStudents(group.id)
              const isExpanded = showStudents === group.id
              
              return (
                <div key={group.id} className="card overflow-hidden">
                  {/* Group Header */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setShowStudents(isExpanded ? null : group.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        isFull ? 'bg-destructive/10' : 'bg-primary/10'
                      )}>
                        <Users className={cn('h-6 w-6', isFull ? 'text-destructive' : 'text-primary')} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{group.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {group.instructorName && (
                            <span className="badge-secondary text-xs">
                              <User className="h-3 w-3 ml-1" />
                              {group.instructorName}
                            </span>
                          )}
                          <span className={cn(
                            'badge text-xs',
                            isFull ? 'badge-destructive' : 'badge-success'
                          )}>
                            {studentCount}
                            {group.maxCapacity && ` / ${group.maxCapacity}`}
                            {' '}طالب
                            {isFull && ' (مكتمل)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditGroupModal(group)
                        }}
                        className="btn-ghost btn-icon rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group)
                        }}
                        className="btn-ghost btn-icon rounded-lg text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronLeft className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-90'
                      )} />
                    </div>
                  </div>
                  
                  {/* Students List (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {groupStudents.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">
                          لا يوجد طلاب في هذه المجموعة
                        </p>
                      ) : (
                        <div className="divide-y divide-border">
                          {groupStudents.map((student) => (
                            <div key={student.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                              <div>
                                <p className="font-medium">{student.fullName}</p>
                                <p className="text-sm text-muted-foreground" dir="ltr">{student.phoneNumber}</p>
                              </div>
                              <span className={student.isNew ? 'badge-primary' : 'badge-secondary'}>
                                {student.isNew ? 'جديد' : 'قديم'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Unassigned Students */}
        {unassignedStudents.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-warning">طلاب غير موزعين ({unassignedStudents.length})</h2>
            <div className="card">
              <div className="divide-y divide-border">
                {unassignedStudents.map((student) => (
                  <div key={student.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">{student.phoneNumber}</p>
                    </div>
                    <Link 
                      to={`/admin/students?edit=${student.id}`}
                      className="btn-outline btn-sm"
                    >
                      تعيين مجموعة
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Add/Edit Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
      >
        <form onSubmit={handleGroupSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">اسم المجموعة *</label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              className="input"
              placeholder="مثال: المجموعة أ"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">اسم المدرب / الدكتور</label>
            <input
              type="text"
              value={groupForm.instructorName}
              onChange={(e) => setGroupForm({ ...groupForm, instructorName: e.target.value })}
              className="input"
              placeholder="اسم المدرب المسؤول"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">الحد الأقصى للطلاب (اختياري)</label>
            <input
              type="number"
              value={groupForm.maxCapacity}
              onChange={(e) => setGroupForm({ ...groupForm, maxCapacity: e.target.value })}
              className="input"
              placeholder="مثال: 25"
              min="1"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary btn-md flex-1">
              {editingGroup ? 'حفظ التعديلات' : 'إضافة المجموعة'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsGroupModalOpen(false)}
              className="btn-outline btn-md"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
