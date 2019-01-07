import os
import shutil
import ntpath
import tempfile

from django.http import HttpResponse, StreamingHttpResponse, HttpResponseNotFound

from apps.files.extras import FileHandler, FileHandlerException
from main.extras.views import ApiView


class FileView(ApiView):

    def post(self, request, root, path):

        try:

            FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            try:

                fs_obj = FileHandler.create(root, path, request)

            except FileHandlerException as e:

                return self._api_response({'errors': [{'title': error} for error in e.errors]})

            else:

                return self._api_response(fs_obj.read())

        else:

            return self._api_response({'errors': [{'title': 'Name in use'}]})

    def get(self, request, root, path):

        try:

            fs_obj = FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            return HttpResponseNotFound()

        else:

            if request.GET.get('download', False):

                if fs_obj.type == 'file':

                    target = fs_obj.absolute_path

                else:

                    archive_name = os.path.join(tempfile.gettempdir(), fs_obj.name)

                    target = shutil.make_archive(archive_name, 'zip', fs_obj.absolute_path)

                stream = StreamingHttpResponse((line for line in open(target, 'rb')))

                stream['Content-Length'] = os.path.getsize(target)

                stream['Content-Disposition'] = 'attachment; filename=' + ntpath.basename(target)

                os.remove(target) if fs_obj.type == 'folder' else None

                return stream

            else:

                return self._api_response(fs_obj.read(request.JSON.get('fields')))

    def patch(self, request, root, path):

        try:

            fs_obj = FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            return HttpResponseNotFound()

        else:

            try:

                fs_obj.update(request.JSON.get('data', {}).get('attributes'))

            except FileHandlerException as e:

                return self._api_response({'errors': [{'title': error} for error in e.errors]})

            else:

                return self._api_response(fs_obj.read())

    @staticmethod
    def delete(request, root, path):

        try:

            fs_obj = FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            return HttpResponseNotFound()

        else:

            fs_obj.delete()

            return HttpResponse(status=204)

    # file_sources = {
    #     'files': {
    #         'prefix': '{{ files_path }}',
    #         'exclude': list(),
    #         'exts': None,
    #         'permission': 'users.edit_files'
    #     },
    #     'playbooks': {
    #         'prefix': None,
    #         'exclude': list(),
    #         'exts': ['.yml', '.yaml'],
    #         'permission': 'users.edit_playbooks'
    #     },
    #     'roles': {
    #         'prefix': '{{ roles_path }}',
    #         'exclude': ['tasks', 'handlers', 'vars', 'defaults', 'meta'],
    #         'exts': None,
    #         'permission': 'users.edit_roles'
    #
    #     },
    #     'users': {
    #         'name': 'users',
    #         'path': settings.USERDATA_PATH,
    #         'prefix': '{{ userdata_path }}',
    #         'exclude': list(),
    #         'exts': None,
    #         'permission': 'users.edit_files'
    #     }
    # }
    #



    # def set_root(self, root, owner, user):
    #
    #     root_dict = self.file_sources[root]
    #
    #     if root == 'users':
    #
    #         root_dict['authorized'] = True if user.username == owner else user.has_perm('users.edit_user_files')
    #
    #         root_dict['path'] = os.path.join(settings.USERDATA_PATH, owner)
    #
    #     else:
    #
    #         root_dict['authorized'] = user.has_perm(root_dict['permission'])
    #
    #     if root_dict['path'] and not os.path.exists(root_dict['path']):
    #
    #         os.makedirs(root_dict['path'])
    #
    #     return root_dict


    # def search_files(self, source, request, prefs, project_auth):
    #
    #     file_list = list()
    #
    #     root_path = self.set_root(source['name'], '', request.user)
    #
    #     for root, dirs, files in os.walk(source['path']):
    #
    #         for file_name in files:
    #
    #             full_path = os.path.join(root, file_name)
    #
    #             is_not_archive = magic.from_file(full_path, mime='true') not in self.archive_types
    #
    #             relative_path = full_path.replace(source['path'] + '/', '')
    #
    #             conditions_to_exclude = {
    #                 request.GET.get('term', '') not in relative_path,
    #                 request.GET.get('term') and root.split('/')[-1] in source['exclude'],
    #                 any(s.startswith('.') for s in relative_path.split('/')) and not prefs['show_hidden_files'],
    #                 request.GET.get('type') == 'archive' and is_not_archive,
    #                 source['name'] == 'users' and relative_path.split('/')[1] != request.user.username,
    #                 not root_path['authorized'] and not project_auth.can_view_file(full_path),
    #             }
    #
    #             if True not in conditions_to_exclude:
    #
    #                 if request.GET.get('term'):
    #
    #                     file_list.append({'value': os.path.join(source['prefix'], relative_path)})
    #
    #                 else:
    #
    #                     head, tail = os.path.split(relative_path)
    #
    #                     file_dict = {'folder': head, 'name': tail}
    #
    #                     if file_dict not in json.loads(request.GET.get('exclude', '[]')):
    #
    #                         file_list.append({
    #                             'folder': head,
    #                             'name': tail,
    #                             'root': source['name'],
    #                             'type': magic.from_file(full_path, mime='true') if os.path.isfile(full_path) else 'directory'
    #                         })
    #
    #     if request.GET.get('term'):
    #
    #         return sorted(file_list, key=lambda k: (k.get('value')))
    #
    #     else:
    #
    #         return sorted(file_list, key=lambda k: (k.get('folder'), k.get('name')))
    #


    # def get(self, request, action):
    #
    #     prefs = get_preferences()
    #
    #     authorizer = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuthorizer(request.user), settings.CACHE_TIMEOUT)
    #
    #     if action == 'search':
    #
    #         data = list()
    #
    #         if request.GET.get('root'):
    #
    #             data = self.search_files(self.file_sources[request.GET['root']], request, prefs, authorizer)
    #
    #         else:
    #
    #             for key in self.file_sources:
    #
    #                 source = self.file_sources[key]
    #
    #                 data = data + self.search_files(source, request, prefs, authorizer) if source['prefix'] else data
    #
    #     else:
    #
    #         root = self.set_root(request.GET['root'], request.GET.get('owner'), request.user)
    #
    #         if not root['path']:
    #
    #             return HttpResponseNotFound('Invalid root')
    #
    #         if action == 'list':
    #
    #             tz = timezone(request.user.userdata.timezone)
    #
    #             file_list = list()
    #
    #             directory = os.path.join(root['path'], request.GET['folder'])
    #
    #             folder = request.GET['folder']
    #
    #             for file_name in os.listdir(directory):
    #
    #                 full_path = os.path.join(directory, file_name)
    #
    #                 base_name, ext = os.path.splitext(file_name)
    #
    #                 file_type = magic.from_file(full_path, mime='true') if os.path.isfile(full_path) else 'directory'
    #
    #                 exclude_conditions = {
    #                     file_name.startswith('.') and not prefs['show_hidden_files'],
    #                     file_type != 'directory' and root['exts'] and ext not in root['exts'],
    #                     {'name': file_name, 'folder': folder} in json.loads(request.GET.get('exclude', '[]')),
    #                     not root['authorized'] and not authorizer.can_view_file(full_path),
    #                 }
    #
    #                 if True not in exclude_conditions:
    #
    #                     file_size = os.path.getsize(full_path)
    #
    #                     file_timestamp = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))
    #
    #                     utc_timestamp = utc.localize(file_timestamp)
    #
    #                     file_list.append({
    #                         'name': file_name,
    #                         'type': file_type,
    #                         'size': file_size,
    #                         'modified': utc_timestamp.astimezone(tz).strftime(prefs['date_format']),
    #                         'root': request.GET.get('root'),
    #                         'folder': folder,
    #                     })
    #
    #             data = {'status': 'ok', 'file_list': file_list}
    #
    #         elif action == 'read':
    #
    #             full_path = os.path.join(root['path'], request.GET.get('folder'), request.GET['name'])
    #
    #             print(full_path)
    #
    #             if os.path.exists(full_path):
    #
    #                 if os.path.isfile(full_path):
    #
    #                     if os.stat(full_path).st_size <= prefs['max_edit_size']:
    #
    #                         with open(full_path, 'r') as text_file:
    #
    #                             data = {'status': 'ok', 'text': text_file.read()}
    #
    #                     else:
    #
    #                         data = {
    #                             'status': 'failed',
    #                             'msg': 'The file is larger than ' + str(prefs['max_edit_size']) + 'kb'
    #                         }
    #
    #                 else:
    #
    #                     data = {'status': 'failed', 'msg': 'Target is not a file'}
    #
    #             else:
    #
    #                 data = {'status': 'failed', 'msg': 'The file was not found'}


    #         elif action == 'download':
    #

    #
    #         else:
    #
    #             return HttpResponseNotFound('Invalid action')
    #
    #     return HttpResponse(json.dumps(data), content_type='application/json')

    # def post(self, request, action):
    #
    #     authorizer = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuthorizer(request.user), settings.CACHE_TIMEOUT)
    #
    #     root = self.set_root(request.POST['root'], request.POST.get('owner'), request.user)
    #
    #     full_path = os.path.join(root['path'], request.POST['folder'], request.POST['name'])
    #
    #     data = dict()
    #
    #     if root['authorized'] or authorizer.can_edit_file(full_path):
    #
    #         new_path = os.path.join(root['path'], request.POST['folder'], request.POST['new_name'])
    #
    #         base_name, ext = os.path.splitext(new_path)
    #
    #         is_directory = (request.POST['type'] == 'directory')
    #
    #         if is_directory or not root['exts'] or ext in root['exts']:
    #
    #             if action == 'save':
    #
    #                 if full_path == new_path or not os.path.exists(new_path):
    #
    #                     try:
    #
    #                         if is_directory:
    #
    #                             os.makedirs(new_path)
    #
    #                         else:
    #
    #                             with open(new_path, 'w') as f:
    #
    #                                 f.write(request.POST.get('text', '').encode('utf8'))
    #
    #                         data = {'status': 'ok', 'msg': request.POST['new_name'] + ' saved'}
    #
    #                     except Exception as e:
    #
    #                         data = {'status': 'failed', 'msg': str(e)}
    #
    #                     if full_path != new_path:
    #
    #                         try:
    #
    #                             os.remove(full_path)
    #
    #                         except os.error:
    #
    #                             pass
    #
    #                 else:
    #
    #                     data = {'status': 'failed', 'msg': 'This name is already in use'}
    #
    #             elif action == 'rename':
    #
    #                 if os.path.exists(new_path):
    #
    #                     data = {'status': 'failed', 'msg': 'This name is already in use'}
    #
    #                 else:
    #
    #                     os.rename(full_path, new_path)
    #
    #                     data = {'status': 'ok', 'msg': request.POST['new_name'] + ' renamed'}
    #
    #             elif action == 'create':
    #
    #                 result = self.create_file(new_path, request.POST['type'] == 'directory')
    #
    #                 if result == 'ok':
    #
    #                     data = {'status': 'ok', 'msg': request.POST['new_name'] + ' created'}
    #
    #                 elif result == 'exists':
    #
    #                     data = {'status': 'failed', 'msg': 'This name is already in use'}
    #
    #             elif action == 'create_role':
    #
    #                 result = self.create_file(new_path, True)
    #
    #                 if result == 'ok':
    #
    #                    fs_obj = FileHandler.build(root, path) for folder in json.loads(request.POST['role_folders']):
    #
    #                         folder_path = os.path.join(new_path, folder['folder'])
    #
    #                         self.create_file(folder_path, True)
    #
    #                         if folder.get('main'):
    #
    #                             main_path = os.path.join(folder_path, 'main.yml')
    #
    #                             self.create_file(main_path, False)
    #
    #                     data = {'status': 'ok', 'msg': request.POST['name'] + ' created', 'name': request.POST['name']}
    #
    #                 elif result == 'exists':
    #
    #                     data = {'status': 'failed', 'msg': request.POST['name'] + ' already exists'}
    #
    #             elif action == 'copy':
    #
    #                 if os.path.exists(new_path):
    #
    #                     data = {'status': 'failed', 'msg': 'This name is already in use'}
    #
    #                 else:
    #
    #                     shutil.copy(full_path, new_path) if os.path.isfile(full_path) else shutil.copytree(full_path, new_path)
    #
    #                     data = {'status': 'ok', 'msg': request.POST['name'] + ' copied'}
    #
    #             elif action == 'upload':
    #
    #                 if os.path.exists(new_path):
    #
    #                     data = {'status': 'failed', 'msg': 'This name is already in use'}
    #
    #                 else:
    #
    #                     try:
    #
    #                         with open(new_path, 'w') as f:
    #
    #                             for chunk in request.FILES['file_data']:
    #
    #                                 f.write(chunk)
    #
    #                     except Exception as e:
    #
    #                         data = {'status': 'failed', 'msg': str(e)}
    #
    #                     else:
    #
    #                         data = {'status': 'ok', 'msg': request.POST['new_name'] + ' uploaded'}
    #
    #             elif action == 'delete':
    #
    #                 os.remove(new_path) if os.path.isfile(new_path) else shutil.rmtree(new_path)
    #
    #                 data = {'status': 'ok', 'msg': request.POST['new_name'] + ' deleted'}
    #
    #             else:
    #
    #                 return HttpResponseNotFound('Invalid action')
    #
    #         else:
    #
    #             data = {'status': 'failed', 'msg': 'File extension not allowed is this folder'}
    #
    #     else:
    #
    #         data = {'status': 'denied'}
    #
    #     return HttpResponse(json.dumps(data), content_type='application/json')

