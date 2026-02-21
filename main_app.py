import os
import sys

# Ensure we always run from the correct directory regardless of where Python is invoked from
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.main import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
