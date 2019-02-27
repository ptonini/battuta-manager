import os
import shutil
import ntpath
import tempfile

from django.http import HttpResponse, StreamingHttpResponse, HttpResponseNotFound, HttpResponseForbidden, HttpResponseBadRequest
from django.core.exceptions import PermissionDenied
from django.views.generic import View

from main.extras.mixins import ApiViewMixin
from apps.files.extras import FileHandler, FileHandlerException


class FileView(View, ApiViewMixin):

    def post(self, request, root, path):

        try:

            FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            try:

                fs_obj = FileHandler.create(root, path, request)

            except FileHandlerException as e:

                return self._api_response({'errors': [{'title': error} for error in e.errors]})

            except PermissionDenied:

                return HttpResponseForbidden()

            else:

                return self._api_response(fs_obj.read())

        else:

            return self._api_response({'errors': [{'title': 'Name in use'}]})

    def get(self, request, root, path):

        try:

            fs_obj = FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            return HttpResponseNotFound()

        except PermissionDenied:

            return HttpResponseForbidden()

        else:

            if request.GET.get('download', False):

                if fs_obj.type == 'file':

                    target = fs_obj.absolute_path

                else:

                    target = shutil.make_archive(os.path.join(tempfile.gettempdir(), fs_obj.name), 'zip', fs_obj.absolute_path)

                stream = StreamingHttpResponse((line for line in open(target, 'rb')))

                stream['Content-Length'] = os.path.getsize(target)

                stream['Content-Disposition'] = 'attachment; filename=' + ntpath.basename(target)

                os.remove(target) if fs_obj.type == 'folder' else None

                return stream

            elif request.GET.get('list', False):

                data = list()

                for f in FileHandler.get_root_class(root).list(request.user):

                    if f.authorizer()['readable']:

                        data.append(f.serialize({'attributes': ['path'], 'links': ['self', 'args']}))

                return self._api_response({'data': data})

            else:

                return self._api_response(fs_obj.read(request.JSON.get('fields')))

    def patch(self, request, root, path):

        try:

            fs_obj = FileHandler.factory(root, path, request.user)

        except FileNotFoundError:

            return HttpResponseNotFound()

        except PermissionDenied:

            return HttpResponseForbidden()

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

        except PermissionDenied:

            return HttpResponseForbidden()

        else:

            fs_obj.delete()

            return HttpResponse(status=204)


class FileSearchView(View, ApiViewMixin):

    def get(self, request):

        if request.GET.get('term'):

            return self._api_response(FileHandler.search(request.GET.get('term'), request.GET.get('type'), request.user))

        else:

            return HttpResponseBadRequest

