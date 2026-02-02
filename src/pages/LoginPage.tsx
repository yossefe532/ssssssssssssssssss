import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { showToast } from '@/components/Toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500))
    
    const success = login(email, password)
    setLoading(false)
    
    if (success) {
      showToast('تم تسجيل الدخول بنجاح', 'success')
      navigate('/admin')
    } else {
      showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error')
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="hero-gradient text-primary-foreground py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
            <Rocket className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">مبادرة زات</h1>
          <p className="text-primary-foreground/80">ZAT Initiative</p>
          <p className="mt-4 text-sm text-primary-foreground/70">
            نظام إدارة الطلاب والحضور
          </p>
        </div>
      </div>
      
      {/* Login Form */}
      <div className="flex-1 flex items-start justify-center p-4 -mt-8">
        <div className="card w-full max-w-md p-8 animate-slide-up">
          <h2 className="text-2xl font-bold mb-6 text-center">تسجيل دخول المسؤول</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pr-12"
                  placeholder="admin@zat.org"
                  required
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input px-12"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  جاري التحقق...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium">للتجربة:</span>
              <br />
              <span dir="ltr">admin@zat.org</span>
              <br />
              <span dir="ltr">zat2024</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
