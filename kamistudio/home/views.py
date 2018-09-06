"""Views of home blueprint."""
import os
import json

from flask import render_template, Blueprint, redirect, url_for, request
from flask import current_app as app

from werkzeug.utils import secure_filename

from kami.hierarchy import KamiHierarchy

home_blueprint = Blueprint('home', __name__, template_folder='templates')


@home_blueprint.route('/')
@home_blueprint.route('/home')
def index():
    """Handler of index page."""
    return render_template("index.html", hierarchies=app.hierarchies)


def _generate_unique_hie_id(name):
    if name not in app.hierarchies.keys():
        return name
    else:
        i = 1
        new_name = name + "(%s)" % str(i)
        while new_name in app.hierarchies.keys():
            i += 1
            new_name = name + "(%s)" % str(i)
        return new_name


@home_blueprint.route("/new-model", methods=["GET"])
def new_hierarchy():
    """New hierarchy handler."""
    return render_template("new_model.html")


@home_blueprint.route("/new-model", methods=["POST"])
def create_new_hierarchy():
    hierarchy = KamiHierarchy()
    if request.form["name"]:
        hierarchy.add_attrs({"name": request.form["name"]})
    if request.form["desc"]:
        hierarchy.add_attrs({"desc": request.form["desc"]})
    hierarchy_id = _generate_unique_hie_id(request.form["name"])
    app.hierarchies[hierarchy_id] = hierarchy
    return redirect(url_for('model.model_view', hierarchy_id=hierarchy_id))


@home_blueprint.route("/import-model", methods=['GET', 'POST'])
def import_hierarchy():
    """Handler of hierarchy import."""
    if request.method == "GET":
        failed = request.args.get('failed')
        return render_template('import_model.html', failed=failed)
    else:
        # check if the post request has the file part
        name = request.form['name']
        desc = None
        if request.form['desc'] != "":
            desc = request.form['desc']

        if 'file' not in request.files:
            raise ValueError('No file part')
            return redirect(request.url)
        file = request.files['file']
        # if user does not select file, browser also
        # submit a empty part without filename
        if file.filename == '':
            raise ValueError('No selected file')
            return redirect(request.url)
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return imported_hierarchy(filename, name, desc)


@home_blueprint.route("/delete-models", methods=['GET', 'POST'])
def delete_hierarchies():
    if request.method == "GET":
        return("Are you sure?")
    else:
        h_ids = json.loads(request.get_data().decode('utf-8'))
        for h in h_ids:
            if h in app.hierarchies.keys():
                del app.hierarchies[h]
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


def imported_hierarchy(filename, name, desc=None):
    """Internal handler of already imported hierarchy."""
    new_hierarchy = KamiHierarchy.load(
        os.path.join(app.config['UPLOAD_FOLDER'], filename))
    if desc is not None:
        new_hierarchy.attrs["desc"] = desc
    hierarchy_id = _generate_unique_hie_id(name)
    app.hierarchies[hierarchy_id] = new_hierarchy
    return redirect(url_for('model.model_view', hierarchy_id=hierarchy_id))
