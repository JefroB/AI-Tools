#!/bin/bash
# Run all AI-Tools demos in sequence

echo "====================================="
echo "Running AI-Tools Demos"
echo "====================================="

# Create a directory for all demo outputs
mkdir -p demo-outputs

# Function to run a demo and handle errors
run_demo() {
  local script=$1
  local name=$2
  
  echo ""
  echo "====================================="
  echo "Running $name"
  echo "====================================="
  
  node $script
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ $name completed successfully"
  else
    echo ""
    echo "❌ $name failed with error code $?"
  fi
}

# Run the basic demo
run_demo "ai-tools-demo.js" "Basic Demo"

# Run the advanced demo
run_demo "ai-tools-advanced-demo.js" "Advanced Demo"

# Run the codebase analysis
run_demo "analyze-codebase.js" "Codebase Analysis"

# Run the version utilities demo
run_demo "examples/version-utils-demo.js" "Version Utilities Demo"

# Run the attribution utilities demo
run_demo "examples/attribution-utils-demo.js" "Attribution Utilities Demo"

# Run the console art demo
run_demo "examples/console-art-demo.js" "Console Art Demo"

# Run the tool usage tracker demo
run_demo "examples/tool-usage-tracker-demo.js" "Tool Usage Tracker Demo"

echo ""
echo "====================================="
echo "All demos completed"
echo "====================================="
echo ""
echo "Demo outputs can be found in:"
echo "- test-demo-output/ (Basic Demo)"
echo "- advanced-demo-output/ (Advanced Demo)"
echo "- analysis-output/ (Codebase Analysis)"
echo "- No output files for Version Utilities Demo (console output only)"
echo "- test-attribution-output/ (Attribution Utilities Demo)"
echo "- No output files for Console Art Demo (console output only)"
echo "- test-demo-output/tool-usage/ (Tool Usage Tracker Demo)"
echo ""
echo "See AI-TOOLS-DEMOS.md for more information about each demo."
