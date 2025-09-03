@echo off
echo Creating portable Sideo package...

REM Create release directory if it doesn't exist
if not exist "release" mkdir "release"

REM Create temporary directory for packaging
if exist "temp_package" rmdir /s /q "temp_package"
mkdir "temp_package"

REM Copy Electron base files
echo Copying Electron base...
xcopy /E /I /Y "node_modules\electron\dist" "temp_package\Sideo"

REM Copy our built application
echo Copying application files...
xcopy /E /I /Y "dist" "temp_package\Sideo\resources\app\dist"

REM Copy package.json
copy "package.json" "temp_package\Sideo\resources\app\"

REM Copy licenses
xcopy /E /I /Y "assets\licenses" "temp_package\Sideo\resources\app\assets\licenses"

REM Copy FFmpeg if it exists
if exist "assets\ffmpeg\ffmpeg.exe" (
    echo Copying FFmpeg...
    copy "assets\ffmpeg\ffmpeg.exe" "temp_package\Sideo\ffmpeg.exe"
)

REM Rename electron.exe to Sideo.exe
if exist "temp_package\Sideo\electron.exe" (
    ren "temp_package\Sideo\electron.exe" "Sideo.exe"
)

REM Create ZIP file
echo Creating ZIP archive...
powershell -Command "Compress-Archive -Path 'temp_package\Sideo' -DestinationPath 'release\Sideo-0.1.0-portable.zip' -Force"

REM Clean up
rmdir /s /q "temp_package"

echo Done! Portable package created at release\Sideo-0.1.0-portable.zip
pause