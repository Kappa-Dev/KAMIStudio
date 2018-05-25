"""Setup of KAMI."""

from setuptools import setup
setup(name='kamistudio',
      version='0.1',
      description='KAMI GUI web application using D3',
      author='...',
      license='MIT License',
      packages=['client',
                'server',
                'server.kami',
                'server.base',
                'server.mu_calculus'],
#                'anatomizer'],
      package_dir={'kami.server': 'kami/server'},
      package_data={
#          'kami.server': ['iRegraph_api.yaml'],
#          'anatomizer': ['resources/*'],
          'server': ['iRegraph_api.yaml']
      },
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          "indra",
          "flask",
          "flex",
          "lxml",
          "jpype1",
          "flask_cors"
      ])
