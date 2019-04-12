# KAMIStudio

KAMIStudio is a bio-curation environment for modelling cellular signalling based on the [KAMI](https://github.com/Kappa-Dev/KAMI) library. It is web-based and can be started as a server locally.


## Installation

To store data KAMIStudio uses two noSQL database technologies: Neo4j to store corpora and models and MongoDB to store different kinds of meta-data. Therefore, before using KAMIStudio you need to install the following software:

1. Neo4j (installation instructions can be found [here](https://neo4j.com/docs/operations-manual/current/installation/)). KAMIStudio uses two Neo4j plug-ins what are not included by default in Community Edition: Graph Algorithms ([see installation](https://neo4j.com/docs/graph-algorithms/current/introduction/#_installation)) and APOC (see installation for [Neo4j Desktop](https://neo4j-contrib.github.io/neo4j-apoc-procedures/#_installation_with_neo4j_desktop) and [Neo4j Servet & Docker](https://neo4j-contrib.github.io/neo4j-apoc-procedures/#installation))

2. MongoDB (installation instructions can be found [here](https://docs.mongodb.com/v3.2/installation/))

Currently, some Python dependencies of KAMIStudio are not in the Python Package Index (PyPI) (namely two Python libraries [ReGraph](https://github.com/Kappa-Dev/ReGraph) and [KAMI](https://github.com/Kappa-Dev/KAMI)), therefore, to use KAMIStudio you need to install them manually from the sources. It can be done in a couple of simple steps which include cloning the repository and installing from the source using setuptools:

3. Install ReGraph:

```
git clone https://github.com/Kappa-Dev/ReGraph
cd ReGraph
python setup.py install
```

4. Install KAMI:

```
git clone https://github.com/Kappa-Dev/KAMI
cd KAMI
python setup.py install
```

Finally, KAMIStudio can be installed from the source. To do that you can clone its reporsitory and install with Python setuptools as follows:

```
git clone https://github.com/Kappa-Dev/KAMIStudio
cd KAMIStudio
python setup.py install

```

## Server configuration

To configure KAMIStudio server you need to provide three paths: a path to store uploaded files, a path to store session files and a path to save configuration file. It can be done running `configure.py` provided in the KAMIStudio repository as follows:

```
python configure.py --uploads="/path/to/uploads/folder/" --session="/path/to/session/files" --configs="/path/to/config/file"
```

As the result the file `/path/to/config/file/kamistudio.conf` is created containing the following default configurations:

```
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PWD = "neo4j"
MONGO_URI = "mongodb://127.0.0.1:27017"

SECRET_KEY = b'_9#y1L"H9R7z\n\xfc]/'
```

Change them to correspond to your configurations (e.g. your Neo4j authentication credentials).

Default usage of the configuration script `python configure.py` uses current working directory to provide the necessary paths.

Finally, export necessary environment variables:

```
export FLASK_APP=kamistudio
export KAMISTUDIO_SETTINGS=/path/of/your/choice/kamistudio.conf
```

## Run KAMIStudio

Run the application:

```
flask run
```
