# KAMIStudio

KAMIStudio is a web-based bio-curation environment for modelling cellular signalling based on [KAMI](https://github.com/Kappa-Dev/KAMI) library.


## Installation

Clone the repo:

```
git clone git@github.com:Kappa-Dev/KAMIStudio.git
cd KAMIStudio
```


Install KAMIStudio with setuptools:

```
python setup.py install
```


In order to run KAMIStudion export an environment variable that tells Flask where to find the application instance:

```
export FLASK_APP=kamistudio
````

Finally run the application:

```
flask run
```
