import os
import subprocess

try:
    status = subprocess.check_output(['git', 'status'], text=True)
    remotes = subprocess.check_output(['git', 'remote', '-v'], text=True)
    log = subprocess.check_output(['git', 'log', '-1'], text=True)
    
    with open('c:/hobbybuddy/git_debug_output.txt', 'w') as f:
        f.write("STATUS:\n" + status + "\nREMOTES:\n" + remotes + "\nLOG:\n" + log)
    print("Success writing git debug")
except Exception as e:
    with open('c:/hobbybuddy/git_debug_output.txt', 'w') as f:
        f.write(f"ERROR: {e}")
    print("Failed")
