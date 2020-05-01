# KAMIStudio

KAMIStudio is a bio-curation environment for modelling cellular signalling based on the [KAMI](https://github.com/Kappa-Dev/KAMI) library. It is web-based and can be started as a server locally.


## Installation with a Docker container

KAMIStudio provides an image for creation of a Docker container with all the required packages, as well as databases installed and configured. First, you need to make sure that you have installed Docker (https://docs.docker.com/install/#server) and the Docker Compose tool (https://docs.docker.com/compose/install/) on your machine. On desktop systems like Docker Desktop for Mac and Windows, Docker Compose is included as part of those desktop installs. 

First of all, clone the KAMIStudio repository:

```
git clone https://github.com/Kappa-Dev/KAMIStudio.git
```

Then, to create a container, go to the folder with the source of KAMIStudio and build the composed Docker images:


```
cd KAMIStudio
sudo docker-compose build
```

To lauch the created container with KAMIStudio run:

```
sudo docker-compose up
```

It will create three containers (one for the KAMIStudio server, one for the Neo4j database and the third one for the Mongo database), fetch all the dependencies, install them (note that it may take some time) and then launch KAMIStudio. Launching of KAMIStudio is performed within attached mode (`docker-compose up` does not terminate, but continuously outputs the messages from the launched containers). To run KAMIStudio in detached mode execute:

```
sudo docker-compose up -d
```

You can now access KAMIStudio using your browser at `0.0.0.0:5000`. _Note_ that Neo4j database has some delay on the start, therefore, if you get an error of connection to Neo4j immediately after lauching KAMIStudio, simply wait until the connection will be established and reload the page.

Installation of dependencies will be done only on the first `docker-compose build` and `docker-compose up`, all the rest will simply launch KAMIStudio inside the container (therefore, will take significantly less time). 



## Manual Installation

First of all, clone the KAMIStudio repository:

```
git clone https://github.com/Kappa-Dev/KAMIStudio.git
```

### Dependencies

To store data KAMIStudio uses two noSQL database technologies: Neo4j to store corpora and models and MongoDB to store different kinds of meta-data. Therefore, before using KAMIStudio you need to install the following software:

1. Neo4j (installation instructions can be found [here](https://neo4j.com/docs/operations-manual/current/installation/)). KAMIStudio uses two Neo4j plug-ins what are not included by default in Community Edition: Graph Algorithms ([see installation](https://neo4j.com/docs/graph-algorithms/current/introduction/#_installation)) and APOC (see installation for [Neo4j Desktop](https://neo4j-contrib.github.io/neo4j-apoc-procedures/#_installation_with_neo4j_desktop) and [Neo4j Servet & Docker](https://neo4j-contrib.github.io/neo4j-apoc-procedures/#installation))

2. MongoDB (installation instructions can be found [here](https://docs.mongodb.com/v3.2/installation/))

Currently, some Python dependencies of KAMIStudio are not in the Python Package Index (PyPI) (namely two Python libraries [ReGraph](https://github.com/Kappa-Dev/ReGraph) and [KAMI](https://github.com/Kappa-Dev/KAMI)), therefore, to use KAMIStudio you need to install them manually from the sources. It can be done in a couple of simple steps which include cloning the repository and installing from the source using setuptools:

3. Install ReGraph:

```
pip install regraph
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

### Server configuration

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


Run the application:

```
flask run
```
