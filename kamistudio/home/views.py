"""Views of home blueprint."""
import datetime
import json
import os
import re

from flask import (render_template, Blueprint, redirect,
                   url_for, request, jsonify, send_file)
from flask import current_app as app

from werkzeug.utils import secure_filename

from kami import KamiCorpus, KamiModel

from kamistudio.utils import authenticate, check_dbs
from kamistudio.corpus.views import add_new_corpus
from kamistudio.model.views import add_new_model

from regraph import graph_to_d3_json
from regraph.neo4j import Neo4jHierarchy


home_blueprint = Blueprint('home', __name__, template_folder='templates')


@home_blueprint.route('/')
@home_blueprint.route('/home')
@check_dbs
def index():
    """Handler of index page."""
    corpora = []
    models = []
    recent = [None, None, None]
    corpora = list(app.mongo.db.kami_corpora.find({}))
    models = list(app.mongo.db.kami_models.find({}))

    # routine for finding last three models/corpora
    # (todo: think of a less naive implementation)
    last_corpora = list(app.mongo.db.kami_corpora.find().limit(3).sort(
        "last_modified", -1))
    last_models = list(app.mongo.db.kami_models.find().limit(3).sort(
        "last_modified", -1))
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

    return render_template(
        "index.html",
        corpora=corpora,
        models=models,
        recent=recent,
        readonly=app.config["READ_ONLY"])


def _generate_unique_corpus_id(name):
    if len(name) > 0:
        pattern = re.compile('[\W_]+')
        name = pattern.sub('', name.title().replace(" ", ""))
        if (name[0].isdigit()):
            name = "corpus" + name
    else:
        name = "newCorpus"

    existing_corpora = [
        el["id"] for el in app.mongo.db.kami_corpora.find(
            {}, {"id": 1, "_id": 0})]
    if name not in existing_corpora:
        return name
    else:
        i = 1
        new_name = name + "_{}".format(i)
        while new_name in existing_corpora:
            i += 1
            new_name = name + "_{}".format(i)
        return new_name


def _generate_unique_model_id(name):
    if len(name) > 0:
        name = filter(str.isalnum, name.title().replace(" ", ""))
        if (name[0].isdigit()):
            name = "model" + name
    else:
        name = "newModel"

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


@home_blueprint.route("/new-corpus", methods=["GET"])
@authenticate
@check_dbs
def new_corpus():
    """New corpus handler."""
    return render_template("new_corpus.html")


@home_blueprint.route("/new-model", methods=["GET"])
@authenticate
@check_dbs
def new_model():
    """New model handler."""
    return render_template("new_model.html")


@home_blueprint.route("/new-corpus", methods=["POST"])
@authenticate
@check_dbs
def create_new_corpus():
    """Handler for creation of a new corpus."""
    annotation = {}
    if request.form["name"]:
        annotation["name"] = request.form["name"]
    if request.form["desc"]:
        annotation["desc"] = request.form["desc"]
    if request.form["organism"]:
        annotation["organism"] = request.form["organism"]
    # TODO: handle annotation

    creation_time = last_modified = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")

    if request.form["name"]:
        corpus_id = _generate_unique_corpus_id(request.form["name"])
    else:
        corpus_id = _generate_unique_corpus_id("corpus")

    corpus = KamiCorpus(
        corpus_id,
        annotation,
        creation_time, last_modified,
        backend="neo4j",
        driver=app.neo4j_driver)
    corpus.create_empty_action_graph()
    add_new_corpus(corpus_id, creation_time, last_modified, annotation)
    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


@home_blueprint.route("/new-model", methods=["POST"])
@authenticate
@check_dbs
def create_new_model():
    """Handler for creation of a new corpus."""
    annotation = {}
    if request.form["name"]:
        annotation["name"] = request.form["name"]
    if request.form["desc"]:
        annotation["desc"] = request.form["desc"]
    if request.form["organism"]:
        annotation["organism"] = request.form["organism"]
    # TODO: handle annotation

    creation_time = last_modified = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")

    if request.form["name"]:
        model_id = _generate_unique_model_id(request.form["name"])
    else:
        model_id = _generate_unique_model_id("model")
    model = KamiModel(
        model_id,
        annotation,
        creation_time, last_modified,
        backend="neo4j",
        driver=app.neo4j_driver)
    model.create_empty_action_graph()
    add_new_model(model_id, creation_time, last_modified, annotation)
    return redirect(url_for('model.model_view', model_id=model_id))


@home_blueprint.route("/import-corpus", methods=['GET', 'POST'])
@authenticate
@check_dbs
def import_corpus():
    """Handler of model import."""
    if request.method == "GET":
        failed = request.args.get('failed')
        return render_template(
            'import_corpus.html', failed=failed)
    else:
        # check if the post request has the file part
        annotation = {}
        if request.form["name"]:
            annotation["name"] = request.form["name"]
        if request.form["desc"]:
            annotation["desc"] = request.form["desc"]
        if request.form["organism"]:
            annotation["organism"] = request.form["organism"]
        # TODO: handle annotation

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
            return imported_corpus(filename, annotation)


@home_blueprint.route("/import-model", methods=['GET', 'POST'])
@authenticate
@check_dbs
def import_model():
    """Handler of model import."""
    if request.method == "GET":
        failed = request.args.get('failed')
        return render_template('import_model.html', failed=failed)
    else:
        # check if the post request has the file part
        annotation = {}
        if request.form["name"]:
            annotation["name"] = request.form["name"]
        if request.form["desc"]:
            annotation["desc"] = request.form["desc"]
        if request.form["organism"]:
            annotation["organism"] = request.form["organism"]
        # TODO: handle annotation

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
            return imported_model(filename, annotation)


def imported_corpus(filename, annotation):
    """Internal handler of already imported model."""
    if annotation["name"]:
        corpus_id = _generate_unique_corpus_id(annotation["name"])
    else:
        corpus_id = _generate_unique_corpus_id("corpus")

    creation_time = last_modified = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")
    path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(path_to_file):
        with open(path_to_file, "r+") as f:
            try:
                json_data = json.loads(f.read())
                json_data["corpus_id"] = corpus_id
                add_new_corpus(corpus_id, creation_time, last_modified, annotation)
                corpus = KamiCorpus.from_json(
                    corpus_id,
                    json_data,
                    annotation,
                    creation_time=creation_time,
                    last_modified=last_modified,
                    backend="neo4j",
                    driver=app.neo4j_driver)
            except:
                return render_template("500.html")
    return redirect(url_for('corpus.corpus_view', corpus_id=corpus_id))


def imported_model(filename, annotation):
    """Internal handler of already imported model."""
    if annotation["name"]:
        model_id = _generate_unique_model_id(annotation["name"])
    else:
        model_id = _generate_unique_model_id("model")

    model_id = _generate_unique_model_id("model")
    creation_time = last_modified = datetime.datetime.now().strftime(
        "%d-%m-%Y %H:%M:%S")
    path_to_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(path_to_file):
        with open(path_to_file, "r+") as f:
            try:
                json_data = json.loads(f.read())
                json_data["model_id"] = model_id
                add_new_model(model_id, creation_time, last_modified, annotation)
                model = KamiModel.load_json(
                    model_id,
                    os.path.join(app.config['UPLOAD_FOLDER'], filename),
                    annotation,
                    creation_time=creation_time,
                    last_modified=last_modified,
                    backend="neo4j",
                    driver=app.neo4j_driver)
            except:
                return render_template("500.html")
    return redirect(url_for('model.model_view', model_id=model_id))


@home_blueprint.route("/about")
@check_dbs
def about_page():
    return render_template("about.html")


@home_blueprint.route("/raw-meta-model")
def get_meta_model():
    """Get meta model graph."""
    h = Neo4jHierarchy(driver=app.neo4j_driver)
    data = {
        "graph": graph_to_d3_json(h.get_graph("meta_model")),
        "node_positioning": {}
    }
    return jsonify(data), 200


@home_blueprint.route("/tutorial")
def tutorial_page():
    return render_template("tutorial.html")


@home_blueprint.route("/tutorial/<file>")
def serve_tutorial_file(file):
    path = os.path.join(
        app.root_path, 'static', 'tutorial', file)
    if os.path.isfile(path):
        return send_file(
            path,
            as_attachment=True,
            attachment_filename=file)
    else:
        return render_template("404.html")
