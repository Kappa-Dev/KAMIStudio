# Use an official Python runtime as an image
FROM python:3.6

# The EXPOSE instruction indicates the ports on which a container 
# will listen for connections
# Since Flask apps listen to port 5000  by default, we expose it
EXPOSE 5000

# Sets the working directory for following COPY and CMD instructions
# Notice we haven’t created a directory by this name - this instruction 
# creates a directory with this name if it doesn’t exist
WORKDIR /var/www/KAMIStudio

# Install any needed packages specified in requirements.txt
COPY requirements.txt /var/www/KAMIStudio
RUN pip install -r requirements.txt

# Install KAMI and ReGraph
RUN git clone https://github.com/Kappa-Dev/ReGraph.git && cd ReGraph && python setup.py install
RUN git clone https://github.com/Kappa-Dev/KAMI.git && cd KAMI && python setup.py install

# Configure Neo4j auth and plugins
ENV NEO4J_AUTH=neo4j/admin

# Configure KAMIStudio
COPY kamistudio /var/www/KAMIStudio/kamistudio
COPY setup.py /var/www/KAMIStudio
COPY configure.py /var/www/KAMIStudio
RUN python /var/www/KAMIStudio/setup.py install && python configure.py
ENV FLASK_APP=kamistudio
ENV FLASK_ENV=production
ENV KAMISTUDIO_SETTINGS='/var/www/KAMIStudio/kamistudio.conf'

# Run KAMIStudio when the container launches
CMD flask run --host=0.0.0.0