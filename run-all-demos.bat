@echo off
REM Run all AI-Tools demos in sequence

echo =====================================
echo Running AI-Tools Demos
echo =====================================

REM Create a directory for all demo outputs
mkdir demo-outputs 2>nul

REM Function to run a demo and handle errors
:run_demo
echo.
echo =====================================
echo Running %~2
echo =====================================

node %~1

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ %~2 completed successfully
) else (
  echo.
  echo ❌ %~2 failed with error code %ERRORLEVEL%
)
goto :eof

REM Run the basic demo
call :run_demo "ai-tools-demo.js" "Basic Demo"

REM Run the advanced demo
call :run_demo "ai-tools-advanced-demo.js" "Advanced Demo"

REM Run the codebase analysis
call :run_demo "analyze-codebase.js" "Codebase Analysis"

REM Run the version utilities demo
call :run_demo "examples/version-utils-demo.js" "Version Utilities Demo"

REM Run the attribution utilities demo
call :run_demo "examples/attribution-utils-demo.js" "Attribution Utilities Demo"

REM Run the console art demo
call :run_demo "examples/console-art-demo.js" "Console Art Demo"

echo.
echo =====================================
echo All demos completed
echo =====================================
echo.
echo Demo outputs can be found in:
echo - test-demo-output/ (Basic Demo)
echo - advanced-demo-output/ (Advanced Demo)
echo - analysis-output/ (Codebase Analysis)
echo - No output files for Version Utilities Demo (console output only)
echo - test-attribution-output/ (Attribution Utilities Demo)
echo - No output files for Console Art Demo (console output only)
echo.
echo See AI-TOOLS-DEMOS.md for more information about each demo.
