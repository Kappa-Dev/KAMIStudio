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


@home_blueprint.route("/new_hierarchy", methods=["GET"])
def new_hierarchy():
    """New hierarchy handler."""
    return render_template("new_hierarchy.html")


@home_blueprint.route("/new_hierarchy", methods=["POST"])
def create_new_hierarchy():
    hierarchy = KamiHierarchy()
    if request.form["hierarchy_name"]:
        hierarchy.add_attrs({"name": request.form["hierarchy_name"]})
    hierarchy_id = _generate_unique_hie_id(request.form["hierarchy_name"])
    app.hierarchies[hierarchy_id] = hierarchy
    return redirect(url_for('model.model_view', hierarchy_id=hierarchy_id))


@home_blueprint.route("/import_hierarchy", methods=['GET', 'POST'])
def import_hierarchy():
    if request.method == 'GET':
        return render_template('import_hierarchy.html')
    elif request.method == 'POST':
        print("\n\nHERE")
        # check if the post request has the file part
        h_name = request.form['hierarchy_name']
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
            return imported_hierarchy(filename, h_name)


def imported_hierarchy(filename, name):
    new_hierarchy = KamiHierarchy.load(
        os.path.join(app.config['UPLOAD_FOLDER'], filename))
    hierarchy_id = _generate_unique_hie_id(name)
    app.hierarchies[hierarchy_id] = new_hierarchy
    return redirect(url_for('model.model_view', hierarchy_id=hierarchy_id))


@home_blueprint.route("/delete_hierarchies", methods=['GET', 'POST'])
def delete_hierarchies():
    if request.method == "GET":
        return("Are you sure?")
    else:
        h_ids = json.loads(request.get_data().decode('utf-8'))
        for h in h_ids:
            if h in app.hierarchies.keys():
                del app.hierarchies[h]
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
