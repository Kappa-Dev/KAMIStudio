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


def _generate_unique_model_id(name):
    existing_models = [
        el["id"] for el in app.mongo.db.kami_models.find(
            {}, {"id": 1, "_id": 0})]
    if name not in existing_models:
        return name
    else:
        i = 1
        new_name = name + "_{}".format(i)
        while new_name in existing_models:
            i += 1
            new_name = name + "_{}".format(i)
        return new_name