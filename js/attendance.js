// Attendance functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const attendanceForm = document.getElementById('attendanceForm');
    const newStudentForm = document.getElementById('newStudentForm');
    const attendanceSuccess = document.getElementById('attendanceSuccess');
    const invalidSession = document.getElementById('invalidSession');
    const phoneForm = document.getElementById('phoneForm');
    const registrationForm = document.getElementById('registrationForm');
    const backToPhoneBtn = document.getElementById('backToPhoneBtn');
    const surpriseMessageDiv = document.getElementById('surpriseMessage');
    
    // Get session ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const courseId = urlParams.get('course');
    const groupId = urlParams.get('group');
    
    // Check if session is valid
    if (!sessionId) {
        showInvalidSession();
        return;
    }
    
    // Verify session exists
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        showInvalidSession();
        return;
    }
    
    // Phone form submission
    phoneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('studentPhone').value.trim();
        
        if (!phone) {
            alert('الرجاء إدخال رقم هاتفك');
            return;
        }
        
        // Check if student exists
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.phone === phone);
        
        if (student) {
            // Student exists, ask for confirmation
            if (confirm(`هل أنت ${student.name}؟`)) {
                // Record attendance
                recordAttendance(student, session);
            } else {
                alert('الرجاء التأكد من هويتك');
            }
        } else {
            // Student doesn't exist, show registration form
            document.getElementById('newStudentPhone').value = phone;
            loadCoursesForSelectMultiple(document.getElementById('studentGroup'));
            showNewStudentForm();
        }
    });
    
    // Registration form submission
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('newStudentName').value.trim();
        const phone = document.getElementById('newStudentPhone').value.trim();
        const selectedGroups = Array.from(document.getElementById('studentGroup').selectedOptions).map(option => option.value);
        
        if (!name || !phone || selectedGroups.length === 0) {
            alert('الرجاء تعبئة جميع الحقول');
            return;
        }
        
        // Check if phone number already exists
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const existingStudent = students.find(s => s.phone === phone);
        
        if (existingStudent) {
            alert('هناك طالب مسجل مسبقًا بهذا الرقم');
            return;
        }
        
        // Create new student for each selected group
        selectedGroups.forEach(groupId => {
            const newStudent = {
                id: Date.now().toString(),
                name: name,
                phone: phone,
                groupId: groupId
            };
            
            students.push(newStudent);
        });
        
        localStorage.setItem('students', JSON.stringify(students));
        
        // Find the student associated with the current session's group
        const sessionGroupStudent = students.find(s => s.groupId === session.groupId && s.phone === phone);
        
        if (sessionGroupStudent) {
            // Record attendance for the new student
            recordAttendance(sessionGroupStudent, session);
        }
    });
    
    // Back button functionality
    if (backToPhoneBtn) {
        backToPhoneBtn.addEventListener('click', function() {
            showPhoneForm();
        });
    }
    
    // Function to record attendance
    function recordAttendance(student, session) {
        // Check if attendance already recorded for this session
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const existingRecord = attendance.find(a => 
            a.studentId === student.id && a.sessionId === session.id
        );
        
        if (existingRecord) {
            alert('تم تسجيل حضورك مسبقًا لهذه الجلسة');
            showAttendanceSuccess(student);
            return;
        }
        
        // Create attendance record
        const attendanceRecord = {
            id: Date.now().toString(),
            studentId: student.id,
            sessionId: session.id,
            timestamp: new Date().toISOString()
        };
        
        attendance.push(attendanceRecord);
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        // Show success message
        showAttendanceSuccess(student);
    }
    
    // Function to show phone form
    function showPhoneForm() {
        attendanceForm.style.display = 'block';
        newStudentForm.style.display = 'none';
        attendanceSuccess.style.display = 'none';
        invalidSession.style.display = 'none';
    }
    
    // Function to show new student form
    function showNewStudentForm() {
        attendanceForm.style.display = 'none';
        newStudentForm.style.display = 'block';
        attendanceSuccess.style.display = 'none';
        invalidSession.style.display = 'none';
    }
    
    // Function to show attendance success
    function showAttendanceSuccess(student) {
        // Get student's attendance summary
        const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        
        // Count total sessions for this student's group
        const studentGroupSessions = sessions.filter(s => s.groupId === student.groupId);
        
        // Count attended sessions for this student
        const attendedSessions = attendance.filter(a => 
            a.studentId === student.id && 
            studentGroupSessions.some(s => s.id === a.sessionId)
        );
        
        // Update success screen
        document.getElementById('studentNameDisplay').textContent = student.name;
        document.getElementById('attendedCount').textContent = attendedSessions.length;
        
        // Check for 5 sessions milestone
        if (attendedSessions.length === 5) {
            document.getElementById('surpriseMessage').innerHTML = '<div class="surprise-message">🎉 سبرايز! مبروك، حضرت 5 جلسات!</div>';
        } else {
            document.getElementById('surpriseMessage').innerHTML = '';
        }
        
        // Show success screen
        attendanceForm.style.display = 'none';
        newStudentForm.style.display = 'none';
        attendanceSuccess.style.display = 'block';
        invalidSession.style.display = 'none';
    }
    
    // Function to show invalid session
    function showInvalidSession() {
        attendanceForm.style.display = 'none';
        newStudentForm.style.display = 'none';
        attendanceSuccess.style.display = 'none';
        invalidSession.style.display = 'block';
    }
    
    // Helper function to load courses for multi-select
    function loadCoursesForSelectMultiple(selectElement) {
        const groups = JSON.parse(localStorage.getItem('groups') || '[]');
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        
        selectElement.innerHTML = '<option value="">اختر كورسات</option>';
        
        groups.forEach(group => {
            const course = courses.find(c => c.id === group.courseId);
            if (course) {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = `${group.name} (${course.name})`;
                selectElement.appendChild(option);
            }
        });
    }
    
    // Initialize with phone form
    showPhoneForm();
});