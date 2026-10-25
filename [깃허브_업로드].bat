@echo off
chcp 65001 >nul
cls
echo ============================================================
echo   👶 [둥글이 스튜디오] 깃허브(GitHub) 원클릭 업로더
echo ============================================================
echo.

:: Git 실행 파일 위치 탐색
set "GIT_EXE=git"
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd\git.exe" (
        set "GIT_EXE=C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd\git.exe"
    ) else if exist "C:\Program Files\Git\cmd\git.exe" (
        set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo [오류] 시스템에서 Git을 찾을 수 없습니다.
        pause
        exit /b 1
    )
)

cd /d "%~dp0"

echo [1/3] 로컬 변경사항 최신 커밋 확인 중...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "feat: 둥글이 1인 AI 방송국 & 숏폼 SaaS 업데이트" >nul 2>nul
"%GIT_EXE%" branch -M main

echo.
echo [안내] GitHub(https://github.com/new)에서 생성하신 
echo        저장소 주소(URL)를 복사한 뒤 여기에 붙여넣어 주세요.
echo        예: https://github.com/내아이디/doongle-ai-studio.git
echo.
set /p REPO_URL="👉 GitHub 저장소 URL 입력: "

if "%REPO_URL%"=="" (
    echo.
    echo [취소] 저장소 URL이 입력되지 않아 작업을 중단합니다.
    pause
    exit /b 0
)

echo.
echo [2/3] 원격 저장소(origin) 연결 중...
"%GIT_EXE%" remote remove origin >nul 2>nul
"%GIT_EXE%" remote add origin %REPO_URL%

echo.
echo [3/3] GitHub로 소스코드 푸시(Push) 중...
echo (처음 실행 시 GitHub 로그인 창이 브라우저로 뜰 수 있습니다)
echo.
"%GIT_EXE%" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   🎉 둥글이 스튜디오가 GitHub에 성공적으로 업로드되었습니다!
    echo   👉 확인 주소: %REPO_URL%
    echo ============================================================
) else (
    echo.
    echo [알림] 업로드 중 문제가 발생했습니다. 
    echo 저장소 URL 또는 GitHub 계정 권한을 확인해 주세요.
)

echo.
pause
