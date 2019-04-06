from django.db.models import Q

from main.extras import DataTableRequestHandler
from apps.preferences.extras import get_prefs


class JobTableHandler(DataTableRequestHandler):

    def _filter_queryset(self):

        filtered_result = list()

        queryset = self._queryset.filter(
            Q(user__username__icontains=self._search['value']) |
            Q(name__icontains=self._search['value']) |
            Q(status__icontains=self._search['value']) |
            Q(subset__icontains=self._search['value'])
        )

        for job in queryset:

            if job.perms(self._user)['readable']:

                filtered_result.append([
                    job.created.astimezone(self._tz).strftime(get_prefs('date_format')),
                    job.user.username,
                    job.name,
                    job.subset,
                    job.status,
                    job.link
                ])

        self._filtered_result = filtered_result

        return filtered_result
