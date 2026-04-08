@echo off
echo ==== AVVIO DOCKER ====
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

:wait_docker
docker ps >nul 2>&1
if errorlevel 1 (
    echo Attendiamo avvio Docker Engine...
    ping 127.0.0.1 -n 6 >nul
    goto wait_docker
)

echo ==== DOCKER PRONTO ====
echo ==== COMPILAZIONE MAVEN ====
cd C:\hobbybuddy\hobbybuddy-platform
call mvnw.cmd clean package -DskipTests

echo ==== RIPARTENZA CONTAINERS ====
cd C:\hobbybuddy
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

echo ==== IN ATTESA DEL DATABASE ====
:wait_db
docker exec -i hobbybuddy-mysql mysqladmin ping -h localhost -uroot -proot >nul 2>&1
if errorlevel 1 (
    ping 127.0.0.1 -n 6 >nul
    goto wait_db
)

echo ==== POPOLANDO DATABASE ====
ping 127.0.0.1 -n 5 >nul
docker exec -i hobbybuddy-mysql mysql -uhobbybuddy -ppassword hobbybuddy_db < seed.sql
echo ==== CONCLUSO CON SUCCESSO ====
