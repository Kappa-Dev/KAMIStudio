from functools import wraps
from flask import current_app, render_template

from neobolt.exceptions import ServiceUnavailable, AuthError
from pymongo.errors import ServerSelectionTimeoutError

from neo4j import GraphDatabase


def reconnect_neo4j_db():
    """Init connection to the Neo4j db."""
    success = False
    try:
        current_app.neo4j_driver = GraphDatabase.driver(
            current_app.config["NEO4J_URI"],
            auth=(current_app.config["NEO4J_USER"], current_app.config["NEO4J_PWD"])
        )
        success = True
    except AuthError as e:
        print(e)
        current_app.neo4j_driver = None
        current_app._neo4j_up = True
    except ServiceUnavailable as e:
        print(e)
        current_app.neo4j_driver = None
        current_app._neo4j_up = False
    return success


def reconnect_mongo_db():
    """Init connection to the Mongo DB."""
    success = False
    try:
        current_app.mongo.cx.server_info()
        current_app.mongo.db = current_app.mongo.cx["kamistudio"]
        if "kami_corpora" not in current_app.mongo.db.collection_names():
            current_app.mongo.db.create_collection("kami_corpora")
            current_app.mongo.db.kami_corpora.create_index("id", unique=True)

        if "kami_models" not in current_app.mongo.db.collection_names():
            current_app.mongo.db.create_collection("kami_models")
            current_app.mongo.db.kami_models.create_index("id", unique=True)

        if "kami_definitions" not in current_app.mongo.db.collection_names():
            current_app.mongo.db.create_collection("kami_definitions")
            current_app.mongo.db.kami_definitions.create_index("id", unique=True)

        if "kami_new_definitions" not in current_app.mongo.db.collection_names():
            current_app.mongo.db.create_collection("kami_new_definitions")
        success = True
    except ServerSelectionTimeoutError as e:
        print(e)
        current_app.mongo.db = None
    return success


def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_app.config["READ_ONLY"] is True:
            return render_template("403.html")
        else:
            return f(*args, **kwargs)
    return decorated_function


def check_dbs(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_app.mongo.db is None:
            # Try reconnecting
            if not reconnect_mongo_db():
                return render_template(
                    "mongo_connection_failure.html",
                    uri=current_app.config["MONGO_URI"])

        if current_app.neo4j_driver is None:
            # Try reconnecting
            if not reconnect_neo4j_db():
                if not current_app._neo4j_up:
                    return render_template(
                        "neo4j_connection_failure.html",
                        uri=current_app.config["NEO4J_URI"])
                else:
                    return render_template(
                        "neo4j_auth_failure.html",
                        uri=current_app.config["NEO4J_URI"],
                        user=current_app.config["NEO4J_USER"]
                    )

        return f(*args, **kwargs)
    return decorated_function


def _generate_unique_model_id(name):
    existing_models = [
        el["id"] for el in current_app.mongo.db.kami_models.find(
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
