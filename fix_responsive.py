import os

def add_overflow_auto(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find list or table containers and add overflow-x-auto
    content = content.replace('className="divide-y', 'className="divide-y overflow-x-auto')
    content = content.replace('overflow-hidden"', 'overflow-hidden overflow-x-auto"')
    
    with open(filepath, 'w') as f:
        f.write(content)

add_overflow_auto('src/components/TeacherDashboard.tsx')
add_overflow_auto('src/components/TeacherStudentsPage.tsx')
add_overflow_auto('src/components/TeacherScheduleManager.tsx')

