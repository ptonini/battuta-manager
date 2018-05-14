import os
import yaml


def validate_yaml(full_path):

    if os.path.isfile(full_path):

        with open(full_path, 'r') as yaml_file:

            try:

                yaml.load(yaml_file.read())

                return None

            except yaml.YAMLError as e:

                return type(e).__name__ + ': ' + e.__str__()

    else:

        return None