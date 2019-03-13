"""Views of home blueprint."""
import os
import json

from flask import render_template, Blueprint, redirect, url_for, request
from flask import current_app as app

from werkzeug.utils import secure_filename

from kami import KamiCorpus

home_blueprint = Blueprint('home', __name__, template_folder='templates')



@home_blueprint.route('/')
@home_blueprint.route('/home')
def index():
    """Handler of index page."""
    corpora = []
    models = []
    recent = [None, None, None]
    if app.mongo.db is not None:
        corpora = list(app.mongo.db.kami_corpora.find({}))
        models = list(app.mongo.db.kami_models.find({}))

        # routine for finding last three models/corpora
        # (todo: think of less naive implementation)
        last_corpora = list(app.mongo.db.kami_corpora.find().limit(3).sort(
            "last_modified"))
        last_models = list(app.mongo.db.kami_models.find().limit(3).sort(
            "last_modified"))
        i = 0
        ci = 0
        mi = 0
        while i < 3:
            c = None
            m = None
            if ci <= len(last_corpora) - 1:
                c = last_corpora[ci]["last_modified"]
            if mi <= len(last_models) - 1:
                m = last_models[mi]["last_modified"]
            if c is not None:
                if m is not None:
                    if c > m:
                        recent[i] = (last_corpora[ci], "corpus")
                        ci += 1
                    else:
                        recent[i] = (last_models[mi], "model")
                        mi += 1
                else:
                    recent[i] = (last_corpora[ci], "corpus")
                    ci += 1
            else:
                if m is not None:
                    recent[i] = (last_models[mi], "model")
                    mi += 1
            i += 1
        print(last_corpora, last_models, recent)

    return render_template(
        "index.html", corpora=corpora, models=models, recent=recent)


def _generate_unique_hie_id(name):
    if name not in app.models.keys():
        return name
    else:
        i = 1
        new_name = name + "(%s)" % str(i)
        while new_name in app.models.keys():
            i += 1
            new_name = name + "(%s)" % str(i)
        return new_name


@home_blueprint.route("/new-corpus", methods=["GET"])
def new_corpus():
    """New corpus handler."""
    return render_template("new_corpus.html")


@home_blueprint.route("/new-model", methods=["GET"])
def new_model():
    """New model handler."""
    return render_template("new_model.html")


@home_blueprint.route("/new-corpus", methods=["POST"])
def create_new_corpus():
    model = KamiCorpus()
    if request.form["name"]:
        model.add_attrs({"name": request.form["name"]})
    if request.form["desc"]:
        model.add_attrs({"desc": request.form["desc"]})
    model_id = _generate_unique_hie_id(request.form["name"])
    app.models[model_id] = model
    return redirect(url_for('model.model_view', mode_id=model_id))


@home_blueprint.route("/new-model", methods=["POST"])
def create_new_model():
    model = KamiCorpus()
    if request.form["name"]:
        model.add_attrs({"name": request.form["name"]})
    if request.form["desc"]:
        model.add_attrs({"desc": request.form["desc"]})
    model_id = _generate_unique_hie_id(request.form["name"])
    app.models[model_id] = model
    return redirect(url_for('model.model_view', mode_id=model_id))


@home_blueprint.route("/import-corpus", methods=['GET', 'POST'])
def import_corpus():
    """Handler of model import."""
    if request.method == "GET":
        failed = request.args.get('failed')
        return render_template('import_corpus.html', failed=failed)
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
            return imported_model(filename, name, desc)


@home_blueprint.route("/import-model", methods=['GET', 'POST'])
def import_model():
    """Handler of model import."""
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
            return imported_model(filename, name, desc)


@home_blueprint.route("/delete-models", methods=['GET', 'POST'])
def delete_models():
    if request.method == "GET":
        return("Are you sure?")
    else:
        h_ids = json.loads(request.get_data().decode('utf-8'))
        for h in h_ids:
            if h in app.models.keys():
                del app.models[h]
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


def imported_model(filename, name, desc=None):
    """Internal handler of already imported model."""
    new_model = KamiCorpus.load(
        os.path.join(app.config['UPLOAD_FOLDER'], filename))
    if desc is not None:
        new_model.attrs["desc"] = desc
    model_id = _generate_unique_hie_id(name)
    app.models[model_id] = new_model
    return redirect(url_for('model.model_view', model_id=model_id))
