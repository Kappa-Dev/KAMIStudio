from functools import wraps
from flask import current_app, render_template


def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print("Here")
        if current_app.config["READ_ONLY"] is True:
            return render_template("403.html")
        else:
            return f(*args, **kwargs)
    return decorated_function
