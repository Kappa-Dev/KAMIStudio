import os
import sys
import argparse
import subprocess


parser = argparse.ArgumentParser(
    description='Configuration of KAMIStudio')
parser.add_argument(
    '-u', '--uploads', dest="uploads",
    default=os.getcwd(),
    help='path to uploads folder ' +
         '(default: current working directory)')
parser.add_argument(
    '-c', '--configs', dest="configs",
    default=os.getcwd(),
    help='path to configuration file \'kamistudio.conf\' ' +
         '(default: current working directory with default configs)')
parser.add_argument(
    '-s', '--session',
    dest='session',
    default=os.getcwd(),
    help='path to sessions folder' +
         '(default: current working directory)')


def configure(argdict):
    # Create uploads folder
    if "uploads" in argdict.keys():
        uploads = argdict["uploads"]
    else:
        uploads = parser.get_default('-u')
    if not os.path.isdir(os.path.join(uploads, "uploads")):
        subprocess.run(["mkdir", os.path.join(uploads, "uploads")])
    print("Set uploads folder to '{}'".format(os.path.join(uploads, "uploads")))

    # Create session files folder
    if "session" in argdict.keys():
        session = argdict["session"]
    else:
        session = parser.get_default('-s')
    if not os.path.isdir(os.path.join(session, "flask_session")):
        subprocess.run(["mkdir", os.path.join(session, "flask_session")])
    print("Set session folder to '{}'".format(os.path.join(session, "flask_session")))

    # Create configuration file
    if "configs" in argdict.keys():
        configs = argdict["configs"]
    else:
        configs = parser.get_default('-c')

    file = os.path.join(configs, "kamistudio.conf")
    print("Writing the following configs to '{}'...".format(file))
    with open(file, "w+") as f:
        confs = [
            "NEO4J_URI = 'bolt://neo4jdb:7687'",
            "NEO4J_USER = 'neo4j'",
            "NEO4J_PWD = 'admin'",
            "MONGO_URI = 'mongodb://mongodb:27017'",
            "SECRET_KEY = {}".format(os.urandom(24)),
            "UPLOAD_FOLDER = '{}'".format(os.path.join(uploads, "uploads")),
            "SESSION_FILE_DIR = '{}'".format(os.path.join(session, "flask_session")),
            "READ_ONLY = False"
        ]
        for c in confs:
            f.write(c + "\n")
            print("\t" + c)
    print("WARNING: to not forget to set environment variable KAMISTUDIO_SETTINGS to '{}'".format(file))
    print("Example: export KAMISTUDIO_SETTINGS='{}'".format(file))
    os.environ["KAMISTUDIO_SETTINGS"] = file

if __name__ == '__main__':
    argdict = vars(parser.parse_args(sys.argv[1:]))
    configure(argdict)
