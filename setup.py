"""Setup of KAMIStudio."""

from setuptools import setup


setup(name='KAMIStudio',
      version='2.0',
      description='Bio-curation tool for cellular signalling',
      author='Russ Harmer, Yves-Stan Le Cornec, Sebastien Legare, Eugenia Oshurko',
      license='MIT License',
      packages=[
          'kamistudio',
          'kamistudio.instance',
          'kamistudio.action_graph',
          'kamistudio.home',
          'kamistudio.model',
          'kamistudio.nuggets',
          'kamistudio.corpus',
          'kamistudio.definitions'],
      package_dir={},
      package_data={
          'kamistudio': ['instance/*'],
          'kamistudio': [
              'templates/*', 'static/*',
              'static/bootstrap/*', 'static/css/*',
              'static/js/*', 'uploads/*', 'static/img/*'],
          'kamistudio.action_graph': ['templates/*', 'static/*'],
          'kamistudio.home': ['templates/*', 'static/*'],
          'kamistudio.model': ['templates/*', 'static/*'],
          'kamistudio.corpus': ['templates/*', 'static/*'],
          'kamistudio.nuggets': ['templates/*', 'static/*'],
      },
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'indra',
          'flask',
          'flask-session',
          'flask_bootstrap',
          'flask_cors',
          'flask-uploads',
          'flask-pymongo',
          'flex',
          'lxml',
          'jpype1'
      ],
      # dependency_links=[
      #     'git+https://github.com/Kappa-Dev/ReGraph@master#egg=regraph-1.0',
      #     'git+https://github.com/Kappa-Dev/KAMI@master#egg=kami-1.2.0'
      # ]
)
