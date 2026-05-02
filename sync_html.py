import os
import shutil

html_files = [
    r'c:\hobbybuddy\frontend\index.html',
    r'c:\hobbybuddy\frontend\login.html',
    r'c:\hobbybuddy\frontend\register.html',
    r'c:\hobbybuddy\frontend\quiz.html',
    r'c:\hobbybuddy\frontend\dashboard.html'
]

blobs_html = '<div class="hero-blobs"><div class="hero-blob blob-1"></div><div class="hero-blob blob-2"></div></div>'

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('v=11', 'v=12')
    content = content.replace('94% Match', 'Top Match 🔥')
    
    if '<section class="hero">' in content and 'hero-blobs' not in content:
        content = content.replace('<section class="hero">', '<section class="hero">\n        ' + blobs_html)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

# Now copy files
frontend_dir = r'c:\hobbybuddy\frontend'
static_dir = r'c:\hobbybuddy\hobbybuddy-platform\src\main\resources\static'
templates_dir = r'c:\hobbybuddy\hobbybuddy-platform\src\main\resources\templates'

# Copy CSS and JS
shutil.copy(os.path.join(frontend_dir, 'css', 'hobbybuddy.css'), os.path.join(static_dir, 'css', 'hobbybuddy.css'))
shutil.copy(os.path.join(frontend_dir, 'js', 'hobbybuddy.js'), os.path.join(static_dir, 'js', 'hobbybuddy.js'))

# Copy HTML to Static and Templates
for f in html_files:
    basename = os.path.basename(f)
    shutil.copy(f, os.path.join(static_dir, basename))
    
    # special handling for index.html -> home.html in templates
    if basename == 'index.html':
        shutil.copy(f, os.path.join(templates_dir, 'home.html'))
    else:
        shutil.copy(f, os.path.join(templates_dir, basename))

print('Done updating and syncing files!')
