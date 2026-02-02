import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Search, Plus, Edit2, Trash2, Phone, User, 
  CheckCircle, XCircle, Filter, Download, BookOpen, Users
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { AdminLayout } from '@/components/AdminLayout'
import { Modal } from '@/components/Modal'
import { showToast } from '@/components/Toast'
import { Student } from '@/types'
import { addStudent, updateStudent, deleteStudent, exportToCSV, getGroupsByCourse } from '@/store'
import { cn } from '@/lib/utils'

export function StudentsPage() {
  const { state, setState } = useApp()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState<string>('')
  const [filterGroup, setFilterGroup] = useState<string>('')
  const [filterPayment, setFilterPayment] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    isNew: true,
    certificateFeePaid: false,
    firstInstallmentPaid: false,
    secondInstallmentPaid: false,
    courseId: '' as string | null,
    groupId: '' as string | null,
  })
  
  // Get available groups for selected course
  const availableGroups = useMemo(() => {
    if (!formData.courseId) return []
    return getGroupsByCourse(state, formData.courseId)
  }, [state, formData.courseId])
  
  // Filter students
  const filteredStudents = useMemo(() => {
    return state.students.filter((student) => {
      const matchesSearch = search === '' || 
        student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        student.phoneNumber.includes(search)
      
      const matchesCourse = filterCourse === '' || student.courseId === filterCourse
      const matchesGroup = filterGroup === '' || student.groupId === filterGroup
      
      let matchesPayment = true
      if (filterPayment === 'paid') {
        matchesPayment = student.certificateFeePaid && 
          student.firstInstallmentPaid && 
          student.secondInstallmentPaid
      } else if (filterPayment === 'partial') {
        matchesPayment = (student.certificateFeePaid || 
          student.firstInstallmentPaid || 
          student.secondInstallmentPaid) &&
          !(student.certificateFeePaid && 
            student.firstInstallmentPaid && 
            student.secondInstallmentPaid)
      } else if (filterPayment === 'unpaid') {
        matchesPayment = !student.certificateFeePaid && 
          !student.firstInstallmentPaid && 
          !student.secondInstallmentPaid
      }
      
      return matchesSearch && matchesCourse && matchesGroup && matchesPayment
    })
  }, [state.students, search, filterCourse, filterGroup, filterPayment])
  
  // Check for edit param
  React.useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const student = state.students.find((s) => s.id === editId)
      if (student) {
        openEditModal(student)
      }
    }
  }, [searchParams, state.students])
  
  const openAddModal = () => {
    setEditingStudent(null)
    setFormData({
      fullName: '',
      phoneNumber: '',
      isNew: true,
      certificateFeePaid: false,
      firstInstallmentPaid: false,
      secondInstallmentPaid: false,
      courseId: null,
      groupId: null,
    })
    setIsModalOpen(true)
  }
  
  const openEditModal = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      fullName: student.fullName,
      phoneNumber: student.phoneNumber,
      isNew: student.isNew,
      certificateFeePaid: student.certificateFeePaid,
      firstInstallmentPaid: student.firstInstallmentPaid,
      secondInstallmentPaid: student.secondInstallmentPaid,
      courseId: student.courseId,
      groupId: student.groupId,
    })
    setIsModalOpen(true)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const existingStudent = state.students.find(
      (s) => s.phoneNumber === formData.phoneNumber && s.id !== editingStudent?.id
    )
    if (existingStudent) {
      showToast('رقم الهاتف مسجل مسبقاً', 'error')
      return
    }
    
    const studentData = {
      ...formData,
      courseId: formData.courseId || null,
      groupId: formData.groupId || null,
    }
    
    if (editingStudent) {
      setState(updateStudent(state, editingStudent.id, studentData))
      showToast('تم تحديث بيانات الطالب', 'success')
    } else {
      setState(addStudent(state, studentData))
      showToast('تم إضافة الطالب بنجاح', 'success')
    }
    
    setIsModalOpen(false)
  }
  
  const handleDelete = (student: Student) => {
    if (confirm(`هل أنت متأكد من حذف الطالب "${student.fullName}"؟`)) {
      setState(deleteStudent(state, student.id))
      showToast('تم حذف الطالب', 'success')
    }
  }
  
  const handleExport = () => {
    const data = filteredStudents.map((s) => {
      const course = state.courses.find((c) => c.id === s.courseId)
      const group = state.groups.find((g) => g.id === s.groupId)
      return {
        'الاسم': s.fullName,
        'رقم الهاتف': s.phoneNumber,
        'نوع الطالب': s.isNew ? 'جديد' : 'قديم',
        'الكورس': course?.name || '-',
        'المجموعة': group?.name || '-',
        'رسوم الشهادة': s.certificateFeePaid ? 'مدفوع' : 'غير مدفوع',
        'القسط الأول': s.firstInstallmentPaid ? 'مدفوع' : 'غير مدفوع',
        'القسط الثاني': s.secondInstallmentPaid ? 'مدفوع' : 'غير مدفوع',
      }
    })
    exportToCSV(data, `students-${new Date().toISOString().split('T')[0]}`)
    showToast('تم تصدير البيانات', 'success')
  }
  
  const handleCourseChange = (courseId: string) => {
    setFormData({ 
      ...formData, 
      courseId: courseId || null, 
      groupId: null 
    })
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">الطلاب</h1>
            <p className="text-muted-foreground mt-1">{state.students.length} طالب مسجل</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-outline btn-md">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
            <button onClick={openAddModal} className="btn-primary btn-md">
              <Plus className="h-4 w-4" />
              إضافة طالب
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="card p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="search-input w-full"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn('btn-outline btn-md', showFilters && 'bg-primary text-primary-foreground')}
            >
              <Filter className="h-4 w-4" />
            </button>
            {/* View Toggle - Hidden on mobile */}
            <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={cn('px-3 py-2', viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                بطاقات
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn('px-3 py-2', viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                جدول
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border animate-fade-in">
              <div className="form-group">
                <label className="form-label">الكورس</label>
                <select
                  value={filterCourse}
                  onChange={(e) => {
                    setFilterCourse(e.target.value)
                    setFilterGroup('')
                  }}
                  className="input"
                >
                  <option value="">جميع الكورسات</option>
                  {state.courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المجموعة</label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="input"
                  disabled={!filterCourse}
                >
                  <option value="">جميع المجموعات</option>
                  {filterCourse && getGroupsByCourse(state, filterCourse).map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">حالة الدفع</label>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="input"
                >
                  <option value="">جميع الحالات</option>
                  <option value="paid">مدفوع بالكامل</option>
                  <option value="partial">مدفوع جزئياً</option>
                  <option value="unpaid">غير مدفوع</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Students List - Card View (Mobile Friendly) */}
        <div className={cn('md:hidden space-y-3', viewMode === 'table' && 'hidden')}>
          {filteredStudents.length === 0 ? (
            <div className="card p-8 text-center text-muted-foreground">
              {search || filterCourse || filterPayment 
                ? 'لا توجد نتائج مطابقة للبحث'
                : 'لا يوجد طلاب مسجلين بعد'
              }
            </div>
          ) : (
            filteredStudents.map((student) => {
              const course = state.courses.find((c) => c.id === student.courseId)
              const group = state.groups.find((g) => g.id === student.groupId)
              
              return (
                <div key={student.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{student.fullName}</h3>
                      <p className="text-sm text-muted-foreground" dir="ltr">{student.phoneNumber}</p>
                    </div>
                    <span className={student.isNew ? 'badge-primary' : 'badge-secondary'}>
                      {student.isNew ? 'جديد' : 'قديم'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {course && (
                      <span className="badge-secondary text-xs">
                        <BookOpen className="h-3 w-3 ml-1" />
                        {course.name}
                      </span>
                    )}
                    {group && (
                      <span className="badge-secondary text-xs">
                        <Users className="h-3 w-3 ml-1" />
                        {group.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      {student.certificateFeePaid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      شهادة
                    </span>
                    <span className="flex items-center gap-1">
                      {student.firstInstallmentPaid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      قسط 1
                    </span>
                    <span className="flex items-center gap-1">
                      {student.secondInstallmentPaid ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      قسط 2
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => openEditModal(student)}
                      className="btn-outline btn-sm flex-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="btn-ghost btn-sm text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* Students Table - Desktop View */}
        <div className={cn('hidden md:block', viewMode === 'cards' && 'md:hidden')}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الهاتف</th>
                  <th>النوع</th>
                  <th>الكورس</th>
                  <th>المجموعة</th>
                  <th>شهادة</th>
                  <th>قسط 1</th>
                  <th>قسط 2</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      {search || filterCourse || filterPayment 
                        ? 'لا توجد نتائج مطابقة للبحث'
                        : 'لا يوجد طلاب مسجلين بعد'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const course = state.courses.find((c) => c.id === student.courseId)
                    const group = state.groups.find((g) => g.id === student.groupId)
                    
                    return (
                      <tr key={student.id}>
                        <td className="font-medium">{student.fullName}</td>
                        <td dir="ltr" className="text-right">{student.phoneNumber}</td>
                        <td>
                          <span className={student.isNew ? 'badge-primary' : 'badge-secondary'}>
                            {student.isNew ? 'جديد' : 'قديم'}
                          </span>
                        </td>
                        <td>{course?.name || '-'}</td>
                        <td>{group?.name || '-'}</td>
                        <td>
                          {student.certificateFeePaid ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </td>
                        <td>
                          {student.firstInstallmentPaid ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </td>
                        <td>
                          {student.secondInstallmentPaid ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(student)}
                              className="btn-ghost btn-icon rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(student)}
                              className="btn-ghost btn-icon rounded-lg text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Desktop Card View */}
        <div className={cn('hidden', viewMode === 'cards' && 'md:grid md:grid-cols-2 lg:grid-cols-3 gap-4')}>
          {filteredStudents.map((student) => {
            const course = state.courses.find((c) => c.id === student.courseId)
            const group = state.groups.find((g) => g.id === student.groupId)
            
            return (
              <div key={student.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{student.fullName}</h3>
                    <p className="text-sm text-muted-foreground" dir="ltr">{student.phoneNumber}</p>
                  </div>
                  <span className={student.isNew ? 'badge-primary' : 'badge-secondary'}>
                    {student.isNew ? 'جديد' : 'قديم'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {course && (
                    <span className="badge-secondary text-xs">{course.name}</span>
                  )}
                  {group && (
                    <span className="badge-secondary text-xs">{group.name}</span>
                  )}
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={() => openEditModal(student)} className="btn-outline btn-sm flex-1">
                    <Edit2 className="h-4 w-4" />
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(student)} className="btn-ghost btn-sm text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">الاسم الكامل *</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input pr-12"
                placeholder="أدخل اسم الطالب"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">رقم الهاتف *</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input pr-12"
                placeholder="01xxxxxxxxx"
                required
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">الكورس</label>
              <select
                value={formData.courseId || ''}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="input"
              >
                <option value="">اختر الكورس</option>
                {state.courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">المجموعة</label>
              <select
                value={formData.groupId || ''}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value || null })}
                className="input"
                disabled={!formData.courseId}
              >
                <option value="">اختر المجموعة</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">نوع الطالب</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isNew}
                  onChange={() => setFormData({ ...formData, isNew: true })}
                  className="checkbox"
                />
                <span>طالب جديد</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.isNew}
                  onChange={() => setFormData({ ...formData, isNew: false })}
                  className="checkbox"
                />
                <span>طالب قديم</span>
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">حالة الدفع</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.certificateFeePaid}
                  onChange={(e) => setFormData({ ...formData, certificateFeePaid: e.target.checked })}
                  className="checkbox"
                />
                <span>رسوم الشهادة</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.firstInstallmentPaid}
                  onChange={(e) => setFormData({ ...formData, firstInstallmentPaid: e.target.checked })}
                  className="checkbox"
                />
                <span>القسط الأول</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.secondInstallmentPaid}
                  onChange={(e) => setFormData({ ...formData, secondInstallmentPaid: e.target.checked })}
                  className="checkbox"
                />
                <span>القسط الثاني</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary btn-md flex-1">
              {editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
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
