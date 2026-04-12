import re
import os

files = [
    r"c:\hobbybuddy\frontend\js\hobbybuddy.js",
    r"c:\hobbybuddy\hobbybuddy-platform\src\main\resources\static\js\hobbybuddy.js"
]

token_functions = """// ============================
// TOKEN STORAGE
// ============================
window._authToken = null;
function saveToken(token) {
    window._authToken = token;
    try { localStorage.setItem('jwt', token); } catch(e) {}
}
function getToken() {
    if (window._authToken) return window._authToken;
    try { 
        const t = localStorage.getItem('jwt'); 
        if (t) window._authToken = t; 
        return t; 
    } catch(e) { return null; }
}
function removeToken() {
    window._authToken = null;
    try { localStorage.removeItem('jwt'); } catch(e) {}
}

"""

for f in files:
    if not os.path.exists(f):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Prerequisite check so we don't apply twice
    if "function saveToken" not in content:
        content = content.replace("// ============================\n// PWA: SERVICE WORKER REGISTRATION", token_functions + "// ============================\n// PWA: SERVICE WORKER REGISTRATION")

    content = content.replace("localStorage.getItem('jwt')", "getToken()")
    content = content.replace("localStorage.setItem('jwt', data.token)", "saveToken(data.token)")
    content = content.replace("localStorage.setItem('jwt', token)", "saveToken(token)")
    content = content.replace("localStorage.removeItem('jwt')", "removeToken()")

    # IPIP BIG-FIVE QUIZ block replacement
    # We want to wrap `if (quizCard) { ... }` in DOMContentLoaded and add auth check
    quiz_pattern = re.compile(r'// ============================\n// IPIP BIG-FIVE QUIZ — Tinder-style\n// ============================\nconst quizCard = document\.getElementById\(\'quiz-card\'\);\nif \(quizCard\) \{')
    quiz_match = quiz_pattern.search(content)
    
    if quiz_match and "DOMContentLoaded" not in content[quiz_match.start()-100:quiz_match.start()]:
        # we found the start of quiz block
        replacement = """// ============================
// IPIP BIG-FIVE QUIZ — Tinder-style
// ============================
document.addEventListener('DOMContentLoaded', () => {
const quizCard = document.getElementById('quiz-card');
if (quizCard) {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }"""
        content = content[:quiz_match.start()] + replacement + content[quiz_match.end():]
        
        # we need to close `});` at the end of the quiz block. It ends before LOGIN block.
        login_block = "\n// ============================\n// LOGIN"
        content = content.replace("    });\n\n}\n" + login_block, "    });\n\n}\n});\n" + login_block)
        content = content.replace("    });\n\n}\n\n" + login_block, "    });\n\n}\n});\n" + login_block)
        content = content.replace("    });\n\n}\n\n\n" + login_block, "    });\n\n}\n});\n" + login_block)
        content = content.replace("    });\n\n}\n\n\n\n" + login_block, "    });\n\n}\n});\n" + login_block)

    # DASHBOARD block replacement
    # We want to wrap `if (btnFindBuddy) { ... }` in DOMContentLoaded and add auth check
    dashboard_pattern = re.compile(r'// ============================\n// DASHBOARD & SOCIAL FEED\n// ============================\nconst btnFindBuddy = document\.getElementById\(\'btn-find-buddy\'\);\nif \(btnFindBuddy\) \{')
    dash_match = dashboard_pattern.search(content)
    if dash_match and "DOMContentLoaded" not in content[dash_match.start()-100:dash_match.start()]:
        replacement = """// ============================
// DASHBOARD & SOCIAL FEED
// ============================
document.addEventListener('DOMContentLoaded', () => {
const btnFindBuddy = document.getElementById('btn-find-buddy');
if (btnFindBuddy) {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }"""
        content = content[:dash_match.start()] + replacement + content[dash_match.end():]
        
        # Close `});` at the end of file
        if not content.strip().endswith("});"):
            content = content.rstrip() + "\n});\n"

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("JS updated")
