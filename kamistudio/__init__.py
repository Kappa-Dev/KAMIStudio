"""Root server app."""
import os

from flask import Flask, url_for, render_template
from flask_session import Session
from flask_bootstrap import Bootstrap
from flask_pymongo import PyMongo

from kamistudio.home.views import home_blueprint
from kamistudio.model.views import model_blueprint
from kamistudio.corpus.views import corpus_blueprint
from kamistudio.action_graph.views import action_graph_blueprint
from kamistudio.nuggets.views import nuggets_blueprint

from neo4j.v1 import GraphDatabase

from regraph.neo4j import Neo4jHierarchy


def init_neo4j_db():
    app.neo4j_driver = GraphDatabase.driver(
        app.config["NEO4J_URI"],
        auth=(app.config["NEO4J_USER"], app.config["NEO4J_PWD"])
    )


def init_mongo_db(add_test=False):
    """Initialize mongo DB."""
    if "kami_corpora" not in app.mongo.db.collection_names():
        app.mongo.db.create_collection("kami_corpora")
        app.mongo.db.kami_corpora.create_index("id", unique=True)

    if "kami_models" not in app.mongo.db.collection_names():
        app.mongo.db.create_collection("kami_models")
        app.mongo.db.kami_models.create_index("id", unique=True)

    if add_test is True:
        # app.mongo.db.kami_corpora.remove({})
        if len(list(app.mongo.db.kami_corpora.find({}))) == 0:
            app.mongo.db.kami_corpora.insert_one({
                "id": "test_corpus",
                "creation_time": "12-12-2018 11:53:56",
                "last_modified": "14-12-2018 03:02:01",
                "meta_data": {
                    "name": "Human PID database",
                    "desc": "PPIs extracted from Pathway Interaction Database",
                    "organism": "Homo sapiens (Human)",
                    "annotation": "Converted to KAMI from NCI PID network, originally represented with BioPax"
                }
            })
        # app.mongo.db.kami_models.remove({})
        if len(list(app.mongo.db.kami_models.find({}))) == 0:
            app.mongo.db.kami_models.insert_one({
                "id": "test_model",
                "creation_time": "13-12-2018 17:19:45",
                "last_modified": "17-12-2018 18:23:00",
                "meta_data": {
                    "name": "Hepatocyte (Human PID)",
                    "desc": "Instantiation of PID for human hepatocytes",
                    "organism": "Homo sapiens (Human)",
                    "annotation": ""
                },
                "origin": {
                    "corpus_id": "test_corpus",
                    "definitions": [],
                    "seed_genes": []
                },
                "kappa_models": []
            })
        # if app.neo4j_driver is not None:
        #     Neo4jHierarchy.load(
        #         "kamistudio/instance/test_kamistudio.json",
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

# Session config
app.secret_key = b'_5#y2L"H9R8z\n\xec]/'
# app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_TYPE'] = 'MongoDBSessionInterface'
Session(app)

# Configure the KAMIStudio server
app.config.from_pyfile('instance/configs.py')
app.mongo = PyMongo(app)
app.mongo.db = app.mongo.cx["kamistudio"]

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
    return url_for(endpoint, **values)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
