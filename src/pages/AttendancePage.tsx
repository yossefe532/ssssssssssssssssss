import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Rocket, Phone, User, CheckCircle, XCircle, 
  AlertCircle, ArrowRight, Loader2
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { showToast } from '@/components/Toast'
import { getSessionByToken, getStudentByPhone, addStudent, updateStudent, markAttendance, hasAttended } from '@/store'
import { formatDate, formatTime } from '@/lib/utils'

type Step = 'phone' | 'confirm' | 'new-student-ask' | 'new-student-form' | 'success' | 'already' | 'error' | 'contact-admin'

export function AttendancePage() {
  const { token } = useParams<{ token: string }>()
  const { state, setState } = useApp()
  
  const [step, setStep] = useState<Step>('phone')
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [foundStudent, setFoundStudent] = useState<ReturnType<typeof getStudentByPhone>>(undefined)
  const [isEditingName, setIsEditingName] = useState(false)
  
  // Get session from token
  const session = token ? getSessionByToken(state, token) : undefined
  const group = session ? state.groups.find((g) => g.id === session.groupId) : undefined
  
  // Check if session exists
  useEffect(() => {
    if (token && !session) {
      setStep('error')
    }
  }, [token, session])
  
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    await new Promise((r) => setTimeout(r, 300))
    
    const student = getStudentByPhone(state, phone)
    setFoundStudent(student)
    setLoading(false)
    
    if (student) {
      // Check if already attended
      if (session && hasAttended(state, student.id, session.id)) {
        setStep('already')
        return
      }
      setName(student.fullName)
      setStep('confirm')
    } else {
      setStep('new-student-ask')
    }
  }
  
  const handleConfirmYes = async () => {
    if (!foundStudent || !session) return
    
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    
    // If name was edited, update student
    if (isEditingName && name !== foundStudent.fullName) {
      setState(updateStudent(state, foundStudent.id, { fullName: name }))
    }
    
    // Mark attendance
    setState((prev) => markAttendance(prev, foundStudent.id, session.id))
    setLoading(false)
    setStep('success')
    showToast('تم تسجيل حضورك بنجاح!', 'success')
  }
  
  const handleConfirmNo = () => {
    setIsEditingName(true)
  }
  
  const handleNewStudentYes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !group) return
    
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    
    // Create new student and add to group
    const newState = addStudent(state, {
      fullName: name,
      phoneNumber: phone,
      isNew: true,
      certificateFeePaid: false,
      firstInstallmentPaid: false,
      secondInstallmentPaid: false,
      courseId: group.courseId,
      groupId: group.id,
    })
    
    // Get the new student
    const newStudent = newState.students.find((s) => s.phoneNumber === phone)
    if (newStudent) {
      // Mark attendance
      const finalState = markAttendance(newState, newStudent.id, session.id)
      setState(finalState)
    }
    
    setLoading(false)
    setStep('success')
    showToast('تم تسجيلك وتسجيل حضورك بنجاح!', 'success')
  }
  
  const handleNewStudentNo = () => {
    setStep('contact-admin')
  }
  
  const resetForm = () => {
    setPhone('')
    setName('')
    setFoundStudent(undefined)
    setIsEditingName(false)
    setStep('phone')
  }
  
  // Error state - invalid session
  if (step === 'error') {
    return (
      <AttendanceLayout>
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">رابط غير صالح</h2>
            <p className="text-muted-foreground mt-2">
              هذا الرابط غير صالح أو منتهي الصلاحية.
              <br />
              يرجى التواصل مع المسؤول للحصول على رابط جديد.
            </p>
          </div>
        </div>
      </AttendanceLayout>
    )
  }
  
  return (
    <AttendanceLayout session={session} group={group}>
      {/* Step 1: Enter Phone */}
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-bold">تسجيل الحضور</h2>
            <p className="text-muted-foreground mt-2">أدخل رقم هاتفك لتسجيل حضورك</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-lg pr-14"
                placeholder="01xxxxxxxxx"
                required
                autoFocus
                dir="ltr"
                inputMode="tel"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="btn-primary btn-lg w-full"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                التالي
                <ArrowRight className="h-5 w-5 rotate-180" />
              </>
            )}
          </button>
        </form>
      )}
      
      {/* Step 2a: Confirm Identity (existing student) */}
      {step === 'confirm' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">تأكيد الهوية</h2>
            <p className="text-muted-foreground mt-2">تم العثور على بياناتك</p>
          </div>
          
          {!isEditingName ? (
            <>
              <div className="p-6 bg-muted/50 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">الاسم المسجل</p>
                <p className="text-2xl font-bold">{foundStudent?.fullName}</p>
              </div>
              
              <p className="text-center text-lg">هل أنت صاحب هذا الاسم؟</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleConfirmYes}
                  disabled={loading}
                  className="btn-success btn-lg"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'نعم'}
                </button>
                <button
                  onClick={handleConfirmNo}
                  className="btn-outline btn-lg"
                >
                  لا
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmYes(); }} className="space-y-6">
              <div className="form-group">
                <label className="form-label">أدخل اسمك الصحيح</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-lg pr-14"
                    placeholder="الاسم الكامل"
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-primary btn-lg w-full"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'تسجيل الحضور'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="btn-ghost btn-md w-full"
              >
                رجوع
              </button>
            </form>
          )}
        </div>
      )}
      
      {/* Step 2b: New Student Ask */}
      {step === 'new-student-ask' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold">رقم غير مسجل</h2>
            <p className="text-muted-foreground mt-2">
              لم يتم العثور على هذا الرقم في قاعدة البيانات
            </p>
          </div>
          
          <p className="text-center text-lg">هل أنت طالب جديد؟</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep('new-student-form')}
              className="btn-primary btn-lg"
            >
              نعم
            </button>
            <button
              onClick={handleNewStudentNo}
              className="btn-outline btn-lg"
            >
              لا
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2c: New Student Registration Form */}
      {step === 'new-student-form' && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-bold">تسجيل طالب جديد</h2>
            <p className="text-muted-foreground mt-2">أدخل بياناتك للتسجيل</p>
          </div>
          
          <form onSubmit={handleNewStudentYes} className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-primary font-medium text-center">
                سيتم تسجيلك تلقائياً في مجموعة: {group?.name}
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-lg pr-14"
                  placeholder="أدخل اسمك الكامل"
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                className="input-lg bg-muted/50"
                disabled
                dir="ltr"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary btn-lg w-full"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'تسجيل وتأكيد الحضور'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('new-student-ask')}
              className="btn-ghost btn-md w-full"
            >
              رجوع
            </button>
          </form>
        </div>
      )}
      
      {/* Success State */}
      {step === 'success' && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-14 w-14 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-success">تم تسجيل حضورك!</h2>
            <p className="text-muted-foreground mt-2">
              {name && `مرحباً ${name}`}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              {formatDate(new Date())} - {formatTime(new Date())}
            </p>
          </div>
        </div>
      )}
      
      {/* Already Attended State */}
      {step === 'already' && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-14 w-14 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">تم تسجيل حضورك مسبقاً</h2>
            <p className="text-muted-foreground mt-2">
              أنت مسجل بالفعل في هذه الجلسة
            </p>
          </div>
        </div>
      )}
      
      {/* Contact Admin State */}
      {step === 'contact-admin' && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">تواصل مع المسؤول</h2>
            <p className="text-muted-foreground mt-2">
              يرجى التواصل مع مسؤول الأكاديمية لتسجيلك في النظام
            </p>
          </div>
          
          <button onClick={resetForm} className="btn-outline btn-lg w-full">
            المحاولة مرة أخرى
          </button>
        </div>
      )}
    </AttendanceLayout>
  )
}

// Layout Component
function AttendanceLayout({ 
  children, 
  session, 
  group 
}: { 
  children: React.ReactNode
  session?: ReturnType<typeof getSessionByToken>
  group?: { name: string; instructorName: string }
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="hero-gradient text-primary-foreground py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
            <Rocket className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold">مبادرة زات</h1>
          {session && group && (
            <div className="mt-4 p-3 bg-primary-foreground/10 rounded-xl">
              <p className="font-medium">{group.name}</p>
              <p className="text-sm text-primary-foreground/80 mt-1">{session.title} - {formatDate(session.date)}</p>
              {group.instructorName && (
                <p className="text-xs text-primary-foreground/60 mt-1">المدرب: {group.instructorName}</p>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-4 -mt-6">
        <div className="card w-full max-w-md p-6 md:p-8">
          {children}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>ZAT Initiative © 2026</p>
      </footer>
    </div>
  )
}
