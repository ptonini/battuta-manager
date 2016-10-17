import os
import magic


def get_directory_content(root):
    content = {'root': root, 'filelist': list()}

    for filename in os.listdir(root):

        full_filename = os.path.join(root, filename)

        if os.path.isfile(full_filename):
            file_mime_type = magic.from_file(full_filename, mime='true')
        else:
            file_mime_type = 'directory'

        file_size = os.path.getsize(full_filename)
        file_timestamp = os.path.getmtime(full_filename)

        content['filelist'].append([filename, file_mime_type, file_size, file_timestamp, ''])

    return content
