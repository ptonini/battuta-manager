function AlertBox(type, status, message) {

    let self = this;

    self.element = Templates['alert'];

    self.element.find('div.alert').addClass('alert-' + status);

    self.element.find('div.message-container').append(message);

    switch (type) {

        case 'confirmation':

            self.element.find('div.button-container').append(Templates['cancel-icon'], Templates['confirm-icon']);

            break;

        case 'notification':

            self.element.find('div.button-container').append(Templates['close-icon']);

    }

    self.closeButton = self.element.find('span.fa-times');

    self.closeButton.click(() => self.element.fadeOut(() => self.element.remove()));

}

AlertBox.status = function (status, message) {

    new AlertBox('notification', status, message).deploy()

};

AlertBox.warning = function (message, confirmationCallback) {

    let alert = new AlertBox('confirmation', 'warning', message);

    alert.element.find('span.confirm-button').click(function () {

        alert.element.fadeOut(function () {

            alert.element.remove();

            confirmationCallback && confirmationCallback();

        })

    });

    alert.deploy()

};

AlertBox.prototype = {

    deploy: function () {

        let self = this;

        $(mainContainer).find('div.alert').fadeOut(function() { $(this).remove() });

        $(mainContainer).append(self.element.hide());

        self.element.fadeIn();

        setTimeout(() => self.closeButton.click(), 10000)

    },

};

