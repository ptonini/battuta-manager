from main.extras import DataTableRequestHandler
from apps.preferences.extras import get_preferences
from pytz import timezone

class JobTableHandler(DataTableRequestHandler):

    def _filter_queryset(self):

        prefs = get_preferences()

        tz = timezone(request.user.userdata.timezone)



    # # Build list from queryset
    #
    # for job in queryset:
    #     if job.subset:
    #         target = job.subset
    #     else:
    #         play = job.play_set.first()
    #         if play:
    #             target = play.hosts
    #         else:
    #             target = None
    #
    #     row = [job.created_on.astimezone(tz).strftime(prefs['date_format']),
    #            job.user.username,
    #            job.name,
    #            target,
    #            job.status,
    #            job.id]
    #
    #     handler.add_and_filter_row(row)