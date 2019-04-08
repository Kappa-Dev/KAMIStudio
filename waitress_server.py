from waitress import serve
import kamistudio


serve(kamistudio.app, host='127.0.0.1', port=5000)