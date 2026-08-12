import os
import sys
import json
import urllib.parse
from http.server import BaseHTTPRequestHandler

# Set up paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

DB_PATH = os.path.join(ROOT_DIR, 'api_data.db')
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.join(ROOT_DIR, 'dashboard_data.db')

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import server
server.DB_PATH = DB_PATH

class handler(server.DashboardHandler):
    pass
