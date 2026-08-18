import re

def check_aria(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find buttons without aria-label and without text (only icons)
    # Simple regex to find <button ... > <Icon /> </button>
    pattern = r'<button([^>]*)>\s*<[A-Z][a-zA-Z0-9]*[^>]*/>\s*</button>'
    matches = re.finditer(pattern, content)
    for m in matches:
        if 'aria-label' not in m.group(1):
            print(f"File {filepath}: Button without text and without aria-label found: {m.group(0)}")

check_aria('src/components/TeacherDashboard.tsx')
check_aria('src/components/TeacherStudentsPage.tsx')
check_aria('src/components/TeacherScheduleManager.tsx')

