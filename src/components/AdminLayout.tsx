import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar,
  LogOut,
  Menu,
  X,
  Rocket
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'لوحة التحكم', labelEn: 'Dashboard' },
  { path: '/admin/courses', icon: BookOpen, label: 'الكورسات', labelEn: 'Courses' },
  { path: '/admin/students', icon: Users, label: 'الطلاب', labelEn: 'Students' },
  { path: '/admin/sessions', icon: Calendar, label: 'الجلسات', labelEn: 'Sessions' },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">مبادرة زات</span>
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost btn-icon">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'sidebar md:translate-x-0 md:w-64',
        sidebarOpen ? 'sidebar-open' : 'sidebar-closed md:sidebar-open'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
                  <Rocket className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">مبادرة زات</h1>
                  <p className="text-xs text-muted-foreground">ZAT Initiative</p>
                </div>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="btn-ghost btn-icon md:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-elegant' 
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="md:mr-64 pb-20 md:pb-8">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('mobile-nav-item', isActive && 'active')}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
