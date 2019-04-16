"""Root server app."""
import os
import json
import sys
import datetime

from flask import Flask, url_for, render_template
from flask_session import Session
from flask_bootstrap import Bootstrap
from flask_pymongo import PyMongo

from kamistudio.home.views import home_blueprint
from kamistudio.model.views import model_blueprint
from kamistudio.corpus.views import corpus_blueprint
from kamistudio.action_graph.views import action_graph_blueprint
from kamistudio.nuggets.views import nuggets_blueprint
from kamistudio.definitions.views import definitions_blueprint

from neo4j.v1 import GraphDatabase
from neobolt.exceptions import ServiceUnavailable
from pymongo.errors import ServerSelectionTimeoutError

from regraph.neo4j import Neo4jHierarchy

# pymongo.errors.AutoReconnect


def init_neo4j_db():
    """Init connection tot Neo4j db."""
    try:
        app.neo4j_driver = GraphDatabase.driver(
            app.config["NEO4J_URI"],
            auth=(app.config["NEO4J_USER"], app.config["NEO4J_PWD"])
        )
    except ServiceUnavailable as e:
        print(e)
        app.neo4j_driver = None


def init_mongo_db(add_test=False):
    """Initialize mongo DB."""
    if app.mongo.db is not None:
        if "kami_corpora" not in app.mongo.db.collection_names():
            app.mongo.db.create_collection("kami_corpora")
            app.mongo.db.kami_corpora.create_index("id", unique=True)

        if "kami_models" not in app.mongo.db.collection_names():
            app.mongo.db.create_collection("kami_models")
            app.mongo.db.kami_models.create_index("id", unique=True)

        if add_test is True:
            pass
            # app.mongo.db.kami_corpora.remove({})
            # if len(list(app.mongo.db.kami_corpora.find({}))) == 0:
            #     with open(os.path.join(os.getcwd(), "examples/corpora.json")) as f:
            #         test_corpora = json.load(f)
            #         for d in test_corpora:
            #             # if not app.mongo.db.kami_corpora.find({"id": d["id"]}):
            #             app.mongo.db.kami_corpora.insert_one(d)
            # app.mongo.db.kami_models.remove({})
            # if len(list(app.mongo.db.kami_models.find({}))) == 0:
            #     with open(os.path.join(os.getcwd(), "examples/models.json")) as f:
            #         test_models = json.load(f)
            #         for d in test_models:
            #             # if not app.mongo.db.kami_models.find({"id": d["id"]}):
            #             app.mongo.db.kami_models.insert_one(d)
            # app.mongo.db.kami_definitions.remove({})
            # if len(list(app.mongo.db.kami_definitions.find({}))) == 0:
            #     with open(os.path.join(os.getcwd(), "examples/definitions.json")) as f:
            #         test_definitions = json.load(f)
            #         for d in test_definitions:
            #             # if not app.mongo.db.kami_definitions.find(
            #                     # {"id": d["id"]}):
            #             app.mongo.db.kami_definitions.insert_one(d)

        # if app.neo4j_driver is not None:
        #     h = Neo4jHierarchy(driver=app.neo4j_driver)
        #     h._clear()
        #     # h.export("/home/eugenia/Work/Notebooks/kamistudio_demo/demo_hierarchy.json")
        #     Neo4jHierarchy.load(
        #         os.path.join(os.getcwd(), "examples/demo_hierarchy.json"),
        #         driver=app.neo4j_driver)


class KAMIStudio(Flask):
    """Flask server for KAMIStudio."""

    def __init__(self, name, template_folder):
        """Initialize a KAMIStudio application object."""
        super().__init__(name)


# App initialization
app = KAMIStudio(__name__,
                 template_folder="./kamistudio/templates")
Bootstrap(app)


# Configure the KAMIStudio server
app.config.from_pyfile('config.py')
app.config.from_pyfile('instance/config.py')

if os.environ.get('KAMISTUDIO_SETTINGS'):
    app.config.from_envvar('KAMISTUDIO_SETTINGS')

# Session config
Session(app)

app.mongo = PyMongo(app, serverSelectionTimeoutMS=10)
try:
    app.mongo.cx.server_info()
    app.mongo.db = app.mongo.cx["kamistudio"]
except ServerSelectionTimeoutError:
    app.mongo.db = None

init_neo4j_db()
init_mongo_db(True)

app.new_nugget = None
app.new_nugget_type = None

# register the blueprints
app.register_blueprint(home_blueprint)
app.register_blueprint(model_blueprint)
app.register_blueprint(corpus_blueprint)
app.register_blueprint(action_graph_blueprint)
app.register_blueprint(nuggets_blueprint)
app.register_blueprint(definitions_blueprint)


@app.context_processor
def override_url_for():
    """Override url_for function with dated url."""
    return dict(url_for=dated_url_for)


@app.errorhandler(404)
def page_not_found(e):
    """Handle not found page."""
    return render_template('404.html'), 404


def dated_url_for(endpoint, **values):
    """Add a time stamp to an url."""
    if endpoint == 'static':
        filename = values.get('filename', None)
        if filename:
            file_path = os.path.join(app.root_path,
                                     endpoint, filename)
            values['q'] = int(os.stat(file_path).st_mtime)
    elif endpoint == 'model.generate_kappa' or\
            endpoint == 'model.download_model':
        values['q'] = datetime.datetime.now().timestamp()
    elif endpoint == 'corpus.download_corpus':
        values['q'] = datetime.datetime.now().timestamp()

    return url_for(endpoint, **values)


if __name__ == "__main__":
    app.run(host='0.0.0.0')
