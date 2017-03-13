function RunnerResults(runnerId, headerContainer) {
    var self = this;

    self.headerContainer = headerContainer;

    self.runnerCogContainer = $('<span>')
        .css('margin', '5px')
        .html($('<img>').attr('src', '/static/images/waiting-small.gif'));

    self.rerunButton = navBarBtn.clone()
        .attr('title', 'Run playbook again')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-repeat'));

    self.statsButton = navBarBtn.clone()
        .attr('title', 'Statistics')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-list'));

    self.printButton = navBarBtn.clone()
        .attr('title', 'Print')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-print'));

    self.cancelButton = navBarBtn.clone()
        .attr('title', 'Cancel')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-remove').css('color', 'red'));

    self.autoScrollButton = navBarBtn.clone()
        .html('Auto scroll');

    $.ajax({
        url: '/runner/result/' + runnerId,
        data: {action: 'status'},
        success: function (runner) {
            self.runner = runner;
            self.buildHeader()
        }
    })

}


RunnerResults.prototype = {

    buildHeader: function () {
        var self = this;

        console.log('from buildHeader', self.runner);

        self.runnerStatusContainer = $('<small>').html(self.runner.status).css('margin-left', '20px');

        self.headerContainer.append(
            $('<div>').attr('class', 'container').append(
                $('<div>').attr('class', 'navbar-header').append(
                    $('<span>').attr('class', 'navbar-brand').append(
                        self.runner.name,
                        self.runnerStatusContainer,
                        self.runnerCogContainer
                    )
                ),
                $('<div>').attr('class','navbar-right').append(
                    self.autoScrollButton,
                    self.cancelButton,
                    self.rerunButton,
                    self.statsButton,
                    self.printButton
                )
            )
        )


    }
};