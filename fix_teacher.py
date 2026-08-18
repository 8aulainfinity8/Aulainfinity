import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to replace standard button classes with <Button> and div cards with <Card>
    # Since they might be complex, I'll just refine the existing HTML classes to be more consistent
    # and "premium", using the components where possible without breaking the layout.
    
    # Actually, using Card requires importing it.
    has_ui_imports = "import {" in content and "'../components/ui" in content or "'./ui" in content
    
    if not has_ui_imports:
        if "from 'lucide-react';" in content:
            content = content.replace("from 'lucide-react';", "from 'lucide-react';\nimport { Card, CardTitle, CardDescription, Badge, Button, EmptyState, Skeleton } from './ui';")

    # Let's write the modified content back
    with open(filepath, 'w') as f:
        f.write(content)

process_file('src/components/TeacherDashboard.tsx')
process_file('src/components/TeacherStudentsPage.tsx')
process_file('src/components/TeacherScheduleManager.tsx')

