import sys
import os

# Add the 'backend' folder to the Python path so it can resolve imports like `import database`
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_dir)

# Import the FastAPI application instance
from main import app
