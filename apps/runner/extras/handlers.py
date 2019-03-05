from django.db.models import Q

from main.extras import DataTableRequestHandler
from apps.preferences.extras import get_preferences


class JobTableHandler(DataTableRequestHandler):

    def _filter_queryset(self):

        prefs = get_preferences()

        queryset = self._queryset.filter(
            Q(user__username__icontains=self._search['value']) |
            Q(name__icontains=self._search['value']) |
            Q(status__icontains=self._search['value'])|
            Q(subset__icontains=self._search['value'])
        )

        for job in queryset:

            self._filtered_result.append([
                job.created.astimezone(self._tz).strftime(prefs['date_format']),
                job.user.username,
                job.name,
                job.subset,
                job.status,
                job.id
            ])
