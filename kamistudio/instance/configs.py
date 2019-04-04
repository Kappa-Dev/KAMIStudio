"""KAMIStudio app default settings."""

DEBUG = True
UPLOAD_FOLDER = './kamistudio/uploads'
DOWNLOAD_FOLDER = "kamistudio/downloads"
ALLOWED_EXTENSIONS = set(['json'])
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PWD = "admin"
MONGO_URI = "mongodb://127.0.0.1:27017"
READ_ONLY = False
