// Admin panel functionality
document.addEventListener('DOMContentLoaded', function() {
    // Admin password (in production, this should be more secure)
    const ADMIN_PASSWORD = 'educon123';
    
    // DOM elements
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    // Tab content elements
    const tabs = {
        courses: document.getElementById('coursesTab'),
        groups: document.getElementById('groupsTab'),
        students: document.getElementById('studentsTab'),
        sessions: document.getElementById('sessionsTab'),
        attendance: document.getElementById('attendanceTab')
    };
    
    // Form elements
    const courseForm = document.getElementById('courseForm');
    const groupForm = document.getElementById('groupForm');
    const studentForm = document.getElementById('studentForm');
    const sessionForm = document.getElementById('sessionForm');
    
    // Initialize data storage
    initializeDataStorage();
    
    // Login functionality
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            if (password === ADMIN_PASSWORD) {
                loginSection.style.display = 'none';
                adminDashboard.style.display = 'block';
                loadCourses(); // Load initial data
            } else {
                alert('كلمة المرور غير صحيحة!');
            }
        });
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
                adminDashboard.style.display = 'none';
                loginSection.style.display = 'flex';
                document.getElementById('password').value = '';
            }
        });
    }
    
    // Navigation functionality
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active button
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected tab
            Object.values(tabs).forEach(tab => {
                tab.style.display = 'none';
            });
            tabs[tabName].style.display = 'block';
            
            // Load data for the selected tab
            switch(tabName) {
                case 'courses':
                    loadCourses();
                    break;
                case 'groups':
                    loadGroups();
                    break;
                case 'students':
                    loadStudents();
                    break;
                case 'sessions':
                    loadSessions();
                    break;
                case 'attendance':
                    loadAttendanceRecords();
                    loadStudentSummary();
                    break;
            }
        });
    });
    
    // Course management
    document.getElementById('addCourseBtn').addEventListener('click', function() {
        document.getElementById('courseId').value = '';
        document.getElementById('courseName').value = '';
        document.getElementById('courseDescription').value = '';
        courseForm.style.display = 'block';
    });
    
    document.getElementById('cancelCourseBtn').addEventListener('click', function() {
        courseForm.style.display = 'none';
    });
    
    document.getElementById('courseFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const courseId = document.getElementById('courseId').value;
        const courseName = document.getElementById('courseName').value;
        const courseDescription = document.getElementById('courseDescription').value;
        
        if (!courseName) {
            alert('الرجاء إدخال اسم الكورس');
            return;
        }
        
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = {
            id: courseId || Date.now().toString(),
            name: courseName,
            description: courseDescription
        };
        
        if (courseId) {
            // Update existing course
            const index = courses.findIndex(c => c.id === courseId);
            if (index !== -1) {
                courses[index] = course;
            }
        } else {
            // Add new course
            courses.push(course);
        }
        
        localStorage.setItem('courses', JSON.stringify(courses));
        courseForm.style.display = 'none';
        loadCourses();
    });
    
    // Group management
    document.getElementById('addGroupBtn').addEventListener('click', function() {
        document.getElementById('groupId').value = '';
        document.getElementById('groupName').value = '';
        document.getElementById('groupCourse').value = '';
        loadCoursesForSelect(document.getElementById('groupCourse'));
        groupForm.style.display = 'block';
    });
    
    document.getElementById('cancelGroupBtn').addEventListener('click', function() {
        groupForm.style.display = 'none';
    });
    
    document.getElementById('groupFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const groupId = document.getElementById('groupId').value;
        const groupName = document.getElementById('groupName').value;
        const course = document.getElementById('groupCourse').value;
        
        if (!groupName || !course) {
            alert('الرجاء تعبئة جميع الحقول');
            return;
        }
        
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const group = {
            id: groupId || Date.now().toString(),
            name: groupName,
            courseId: course
        };
        
        if (groupId) {
            // Update existing group
            const index = groups.findIndex(g => g.id === groupId);
            if (index !== -1) {
                groups[index] = group;
            }
        } else {
            // Add new group
            groups.push(group);
        }
        
        localStorage.setItem('groups', JSON.stringify(groups));
        groupForm.style.display = 'none';
        loadGroups();
    });
    
    // Student management
    document.getElementById('addStudentBtn').addEventListener('click', function() {
        document.getElementById('studentId').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('studentPhone').value = '';
        document.getElementById('studentGroup').value = '';
        loadGroupsForSelect(document.getElementById('studentGroup'));
        studentForm.style.display = 'block';
    });
    
    document.getElementById('cancelStudentBtn').addEventListener('click', function() {
        studentForm.style.display = 'none';
    });
    
    document.getElementById('studentFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentId').value;
        const studentName = document.getElementById('studentName').value;
        const studentPhone = document.getElementById('studentPhone').value;
        const studentGroup = document.getElementById('studentGroup').value;
        
        if (!studentName || !studentPhone || !studentGroup) {
            alert('الرجاء تعبئة جميع الحقول');
            return;
        }
        
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const existingStudent = students.find(s => s.phone === studentPhone);
        
        if (existingStudent && existingStudent.id !== studentId) {
            alert('هناك طالب مسجل مسبقًا بهذا الرقم');
            return;
        }
        
        const student = {
            id: studentId || Date.now().toString(),
            name: studentName,
            phone: studentPhone,
            groupId: studentGroup
        };
        
        if (studentId) {
            // Update existing student
            const index = students.findIndex(s => s.id === studentId);
            if (index !== -1) {
                students[index] = student;
            }
        } else {
            // Add new student
            students.push(student);
        }
        
        localStorage.setItem('students', JSON.stringify(students));
        studentForm.style.display = 'none';
        loadStudents();
    });
    
    // Session management
    document.getElementById('addSessionBtn').addEventListener('click', function() {
        document.getElementById('sessionId').value = '';
        document.getElementById('sessionGroup').value = '';
        document.getElementById('sessionDate').value = '';
        document.getElementById('sessionTime').value = '';
        loadGroupsForSelect(document.getElementById('sessionGroup'));
        sessionForm.style.display = 'block';
    });
    
    document.getElementById('cancelSessionBtn').addEventListener('click', function() {
        sessionForm.style.display = 'none';
    });
    
    document.getElementById('sessionFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const sessionId = document.getElementById('sessionId').value;
        const sessionGroup = document.getElementById('sessionGroup').value;
        const sessionDate = document.getElementById('sessionDate').value;
        const sessionTime = document.getElementById('sessionTime').value;
        
        if (!sessionGroup || !sessionDate || !sessionTime) {
            alert('الرجاء تعبئة جميع الحقول');
            return;
        }
        
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const session = {
            id: sessionId || Date.now().toString(),
            groupId: sessionGroup,
            date: sessionDate,
            time: sessionTime,
            createdAt: new Date().toISOString()
        };
        
        if (sessionId) {
            // Update existing session
            const index = sessions.findIndex(s => s.id === sessionId);
            if (index !== -1) {
                sessions[index] = session;
            }
        } else {
            // Add new session
            sessions.push(session);
        }
        
        localStorage.setItem('sessions', JSON.stringify(sessions));
        sessionForm.style.display = 'none';
        loadSessions();
    });
    
    // Initialize data storage if not exists
    function initializeDataStorage() {
        if (!localStorage.getItem('courses')) {
            // Predefined courses
            const predefinedCourses = [
                {id: '1', name: 'English A1', description: 'الدورة الأساسية في اللغة الإنجليزية'},
                {id: '2', name: 'German A1-1', description: 'الدورة الأساسية في اللغة الألمانية'},
                {id: '3', name: 'ICDL', description: 'رخصة قيادة الحاسب الدولية'},
                {id: '4', name: 'Photoshop', description: 'دورة أدوبي فوتوشوب'},
                {id: '5', name: 'Premiere', description: 'دورة أدوبي بريميير'},
                {id: '6', name: 'Motion Graphic L1', description: 'الجرافيك الحركي المستوى الأول'},
                {id: '7', name: 'Motion Graphic L2', description: 'الجرافيك الحركي المستوى الثاني'},
                {id: '8', name: 'AI', description: 'مقدمة في الذكاء الاصطناعي'},
                {id: '9', name: 'HTML + CSS', description: 'أساسيات HTML و CSS'},
                {id: '10', name: 'Canva + Whiteboard', description: 'أدوات كانفا و ويت بورد'}
            ];
            localStorage.setItem('courses', JSON.stringify(predefinedCourses));
        }
        if (!localStorage.getItem('groups')) {
            localStorage.setItem('groups', JSON.stringify([]));
        }
        if (!localStorage.getItem('students')) {
            localStorage.setItem('students', JSON.stringify([]));
        }
        if (!localStorage.getItem('sessions')) {
            localStorage.setItem('sessions', JSON.stringify([]));
        }
        if (!localStorage.getItem('attendance')) {
            localStorage.setItem('attendance', JSON.stringify([]));
        }
    }
    
    // Load courses
    function loadCourses() {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = '';
        
        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.id}</td>
                <td>${course.name}</td>
                <td>${course.description || ''}</td>
                <td>
                    <button onclick="editCourse('${course.id}')" class="btn btn-primary">تعديل</button>
                    <button onclick="deleteCourse('${course.id}')" class="btn btn-danger">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Load groups
    function loadGroups() {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const tbody = document.getElementById('groupsTableBody');
        tbody.innerHTML = '';
        
        groups.forEach(group => {
            const course = getCourseById(group.courseId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${group.id}</td>
                <td>${group.name}</td>
                <td>${course ? course.name : 'غير متوفر'}</td>
                <td>
                    <button onclick="editGroup('${group.id}')" class="btn btn-primary">تعديل</button>
                    <button onclick="deleteGroup('${group.id}')" class="btn btn-danger">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Load students
    function loadStudents() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';
        
        students.forEach(student => {
            const group = getGroupById(student.groupId);
            const course = group ? getCourseById(group.courseId) : null;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.phone}</td>
                <td>${group ? group.name : 'غير متوفر'} (${course ? course.name : 'غير متوفر'})</td>
                <td>
                    <button onclick="editStudent('${student.id}')" class="btn btn-primary">تعديل</button>
                    <button onclick="deleteStudent('${student.id}')" class="btn btn-danger">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Load sessions
    function loadSessions() {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const tbody = document.getElementById('sessionsTableBody');
        tbody.innerHTML = '';
        
        sessions.forEach(session => {
            const group = getGroupById(session.groupId);
            const course = group ? getCourseById(group.courseId) : null;
            
            // Generate QR code for session
            const qrCodeUrl = `${window.location.origin}/attendance.html?session=${session.id}&course=${course?.id || ''}&group=${group?.id || ''}`;
            const qrCodeHtml = `<div class="qr-container"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrCodeUrl)}" alt="رمز QR" width="100" height="100"></div>`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.id}</td>
                <td>${group ? group.name : 'غير متوفر'} (${course ? course.name : 'غير متوفر'})</td>
                <td>${formatDate(session.date)}</td>
                <td>${session.time}</td>
                <td>${qrCodeHtml}</td>
                <td>
                    <button onclick="editSession('${session.id}')" class="btn btn-primary">تعديل</button>
                    <button onclick="deleteSession('${session.id}')" class="btn btn-danger">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Load attendance records
    function loadAttendanceRecords() {
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';
        
        attendance.forEach(record => {
            const session = getSessionById(record.sessionId);
            const student = getStudentById(record.studentId);
            const group = student ? getGroupById(student.groupId) : null;
            const course = group ? getCourseById(group.courseId) : null;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session ? formatDate(session.date) + ' ' + session.time : 'غير متوفر'}</td>
                <td>${student ? student.name : 'غير متوفر'}</td>
                <td>${group ? group.name : 'غير متوفر'} (${course ? course.name : 'غير متوفر'})</td>
                <td>${formatDate(record.timestamp.split('T')[0])}</td>
                <td><span class="status attended">حاضر</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Load student attendance summary
    function loadStudentSummary() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const tbody = document.getElementById('studentSummaryTableBody');
        tbody.innerHTML = '';
        
        students.forEach(student => {
            const group = getGroupById(student.groupId);
            const course = group ? getCourseById(group.courseId) : null;
            
            // Count total sessions for this student's group
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const studentGroupSessions = sessions.filter(s => s.groupId === student.groupId);
            
            // Count attended sessions for this student
            const attendedSessions = attendance.filter(a => 
                a.studentId === student.id && 
                studentGroupSessions.some(s => s.id === a.sessionId)
            );
            
            const attendanceRate = studentGroupSessions.length > 0 
                ? Math.round((attendedSessions.length / studentGroupSessions.length) * 100) 
                : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${group ? group.name : 'غير متوفر'} (${course ? course.name : 'غير متوفر'})</td>
                <td>${studentGroupSessions.length}</td>
                <td>${attendedSessions.length}</td>
                <td>${attendanceRate}%</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Helper functions
    function getCourseById(id) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        return courses.find(c => c.id === id);
    }
    
    function getGroupById(id) {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        return groups.find(g => g.id === id);
    }
    
    function getStudentById(id) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        return students.find(s => s.id === id);
    }
    
    function getSessionById(id) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        return sessions.find(s => s.id === id);
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }
    
    function loadCoursesForSelect(selectElement) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        selectElement.innerHTML = '<option value="">اختر كورس</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            selectElement.appendChild(option);
        });
    }
    
    function loadGroupsForSelect(selectElement) {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        selectElement.innerHTML = '<option value="">اختر مجموعة</option>';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            selectElement.appendChild(option);
        });
    }
    
    // Global functions for edit/delete operations
    window.editCourse = function(id) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = courses.find(c => c.id === id);
        
        if (course) {
            document.getElementById('courseId').value = course.id;
            document.getElementById('courseName').value = course.name;
            document.getElementById('courseDescription').value = course.description || '';
            courseForm.style.display = 'block';
        }
    };
    
    window.deleteCourse = function(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا الكورس؟')) {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const filteredCourses = courses.filter(c => c.id !== id);
            localStorage.setItem('courses', JSON.stringify(filteredCourses));
            loadCourses();
        }
    };
    
    window.editGroup = function(id) {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const group = groups.find(g => g.id === id);
        
        if (group) {
            loadCoursesForSelect(document.getElementById('groupCourse'));
            document.getElementById('groupId').value = group.id;
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupCourse').value = group.courseId;
            groupForm.style.display = 'block';
        }
    };
    
    window.deleteGroup = function(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذه المجموعة؟')) {
            const groups = JSON.parse(localStorage.getItem('groups') || '[]');
            const filteredGroups = groups.filter(g => g.id !== id);
            localStorage.setItem('groups', JSON.stringify(filteredGroups));
            loadGroups();
        }
    };
    
    window.editStudent = function(id) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.id === id);
        
        if (student) {
            loadGroupsForSelect(document.getElementById('studentGroup'));
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentPhone').value = student.phone;
            document.getElementById('studentGroup').value = student.groupId;
            studentForm.style.display = 'block';
        }
    };
    
    window.deleteStudent = function(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا الطالب؟')) {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const filteredStudents = students.filter(s => s.id !== id);
            localStorage.setItem('students', JSON.stringify(filteredStudents));
            loadStudents();
        }
    };
    
    window.editSession = function(id) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const session = sessions.find(s => s.id === id);
        
        if (session) {
            loadGroupsForSelect(document.getElementById('sessionGroup'));
            document.getElementById('sessionId').value = session.id;
            document.getElementById('sessionGroup').value = session.groupId;
            document.getElementById('sessionDate').value = session.date;
            document.getElementById('sessionTime').value = session.time;
            sessionForm.style.display = 'block';
        }
    };
    
    window.deleteSession = function(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذه الجلسة؟')) {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const filteredSessions = sessions.filter(s => s.id !== id);
            localStorage.setItem('sessions', JSON.stringify(filteredSessions));
            loadSessions();
        }
    };
    
    // Initialize with courses tab active
    document.querySelector('.nav-btn[data-tab="courses"]').click();
});