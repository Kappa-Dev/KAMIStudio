"""Setup of KAMIStudio."""

from setuptools import setup


setup(name='KAMIStudio',
      version='2.0',
      description='Bio-curation tool for cellular signalling',
      author='Russ Harmer, Yves-Stan Le Cornec, Sebastien Legare, Eugenia Oshurko',
      license='MIT License',
      packages=['kamistudio'],
      package_dir={},
      package_data={},
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'indra',
          'flask',
          'flask_bootstrap',
          'flex',
          'lxml',
          'jpype1',
          'flask_cors'
      ])
