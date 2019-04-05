"""Root server app."""
import os

import json
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
    except ServiceUnavailable:
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
            app.mongo.db.kami_corpora.remove({})
            if len(list(app.mongo.db.kami_corpora.find({}))) == 0:
                app.mongo.db.kami_corpora.insert_one({
                    "id": "tcbb",
                    "creation_time": "04-04-2019 11:08:56",
                    "last_modified": "04-04-2019 11:08:56",
                    "meta_data": {
                        "name": "EGFR signalling",
                        "desc": "Partial EGFR signalling network, toy example",
                        "organism": "Homo sapiens (Human)",
                        "annotation": "Manually created, example from the paper 'Bio-curation for cellular signalling: the KAMI project'"
                    }
                })
                app.mongo.db.kami_corpora.insert_one({
                    "id": "pYNET_20",
                    "creation_time": "04-04-2019 11:13:53",
                    "last_modified": "04-04-2019 11:15:40",
                    "meta_data": {
                        "name": "pYNET 20",
                        "desc": "Phosphotyrosine and SH2 signalling network, extract 20 interactions",
                        "organism": "Homo sapiens (Human)",
                        "annotation": "Automatically built from data collated from the literature"
                    }
                })
                app.mongo.db.kami_corpora.insert_one({
                    "id": "pYNET_200",
                    "creation_time": "04-04-2019 13:18:53",
                    "last_modified": "04-04-2019 14:15:40",
                    "meta_data": {
                        "name": "pYNET 200",
                        "desc": "Phosphotyrosine and SH2 signalling network, extract 200 interactions",
                        "organism": "Homo sapiens (Human)",
                        "annotation": "Automatically built from data collated from the literature"
                    }
                })
            app.mongo.db.kami_models.remove({})
            if len(list(app.mongo.db.kami_models.find({}))) == 0:
                app.mongo.db.kami_models.insert_one({
                    "id": "tcbb_model",
                    "creation_time": "04-04-2019 11:08:56",
                    "last_modified": "04-04-2019 11:08:56",
                    "meta_data": {
                        "name": "Instantiated EGFR model",
                        "desc": "Instantiated EGFR signalling subnetwork, toy example",
                        "organism": "Homo sapiens (Human)",
                        "annotation": "Manually created, example from the paper 'Bio-curation for cellular signalling: the KAMI project'"
                    },
                    "origin": {
                        "corpus_id": "tcbb",
                        "definitions": [],
                        "seed_genes": []
                    },
                    "kappa_models": []
                })
            app.mongo.db.kami_definitions.remove({})
            if len(list(app.mongo.db.kami_definitions.find({}))) == 0:
                app.mongo.db.kami_definitions.insert_one({
                    'id': '1',
                    'corpus_id': 'tcbb',
                    'protoform': {
                        'uniprotid': 'P00533',
                        'regions': [{
                            'name': 'Protein kinase',
                        }],
                        'residues': [{'aa': ['Y'], 'loc': 1092}],
                    },
                    'products': {
                        'WT': {
                            "wild_type": True,
                            "desc": "Wild type protein",
                            "components": {
                                'regions': [{
                                    'name': 'Protein kinase',
                                }],
                                'residues': [{'aa': ['Y'], 'loc': 1092}],
                            }
                        },
                        'p60': {
                            "wild_type": False,
                            "desc": "Missing 406-1219",
                            "components": {}
                        }}})
                app.mongo.db.kami_definitions.insert_one({
                    'id': '2',
                    'corpus_id': 'tcbb',
                    'protoform': {'uniprotid': 'P62993',
                      'regions': [{'name': 'SH2',
                        'sites': [],
                        'residues': [{'aa': ['S', 'D'], 'loc': 90}],
                        'states': [],
                        'bound_to': [],
                        'unbound_from': []}],
                      'sites': [],
                      'residues': [],
                      'states': [],
                      'bound_to': [],
                      'unbound_from': []},
                     'products': {'Wild type': {
                        "wild_type": True,
                        'components': {'regions': [{'name': 'SH2',
                          'sites': [],
                          'residues': [{'aa': ['S'], 'loc': 90}],
                          'states': [],
                          'bound_to': [],
                          'unbound_from': []}],
                        'sites': [],
                        'residues': [],
                        'states': []},
                       'desc': 'Wild type isoform of GRB2'},
                      'S90D': {
                        "wild_type": False,
                        'components': {'regions': [{'name': 'SH2',
                          'sites': [],
                          'residues': [{'aa': ['D'], 'loc': 90}],
                          'states': [],
                          'bound_to': [],
                          'unbound_from': []}],
                        'sites': [],
                        'residues': [],
                        'states': []},
                       'desc': 'Mutation S90D'},
                      'noSH2': {
                        "wild_type": False,
                        'components': {'regions': [],
                        'sites': [],
                        'residues': [],
                        'states': []},
                       'desc': 'SH2 knock-out splice variant'}}}
                )
                app.mongo.db.kami_definitions.insert_one({
                    'id': '3',
                    'corpus_id': 'tcbb',
                    'protoform': {
                        'uniprotid': 'P56945',
                        'sites': [{
                            "start": 407, "end": 413,
                            "residues": [{
                                "aa": ["Y", "A"],
                                "loc": 410,
                                "test": True}]
                        }]
                    },
                    'products': {
                        'WT': {
                            "wild_type": True,
                            "desc": "Wild type protein",
                            "components": {
                                'sites': [{
                                    "start": 407, "end": 413,
                                    "residues": [{
                                        "aa": "Y",
                                        "loc": 410,
                                        "test": True
                                    }]
                                }]
                            }
                        },
                        'S90A': {
                            "wild_type": False,
                            "desc": "Mutation S90A",
                            "components": {
                                'sites': [{
                                    "start": 407, "end": 413,
                                    "residues": [{
                                        "aa": "A",
                                        "loc": 410,
                                        "test": True
                                    }]
                                }]
                            }
                        },
                        'nopY': {
                            "wild_type": False,
                            "desc": "Knock-out of pY-site",
                            "components": {}
                        }
                    }
                })

        # if app.neo4j_driver is not None:
        #     h = Neo4jHierarchy(driver=app.neo4j_driver)
        #     # h.export("/home/eugenia/Work/Notebooks/kamistudio_demo/demo_hierarchy.json")
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
app.config['SESSION_TYPE'] = 'filesystem'
# app.config['SESSION_TYPE'] = 'MongoDBSessionInterface'
Session(app)

# Configure the KAMIStudio server
app.config.from_pyfile('instance/configs.py')
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
    return url_for(endpoint, **values)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
