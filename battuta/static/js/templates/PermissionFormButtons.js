/**
 * Created by ptonini on 24/08/17.
 */

var PermissionFormButtons = {

    inventory: divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Inventory')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit hosts').data('permission', 'edit_hosts')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit groups').data('permission', 'edit_groups')
            )
        )
    ),

    users: divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Users')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit users').data('permission', 'edit_users')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user groups').data('permission', 'edit_user_groups')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user files').data('permission', 'edit_user_files')
            )
        )

    ),

    runner: divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Runner')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Execute jobs').data('permission', 'execute_jobs')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit tasks').data('permission', 'edit_tasks')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit playbooks').data('permission', 'edit_playbooks')
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit roles').data('permission', 'edit_roles')
            )
        )
    ),

    preferences: divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Preferences')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit preferences').data('permission', 'edit_preferences')
            )
        )
    ),

    files: divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Files')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit files').data('permission', 'edit_files')
            )
        )
    )
};