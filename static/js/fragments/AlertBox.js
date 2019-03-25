function AlertBox(status, message, confirmIcon) {

    let self = this;

    self.element = Templates['alert'];

    self.messageContainer = self.element.find('div.message-container');

    self.buttonContainer = self.element.find('div.button-container');

    self.closeIcon = Templates['close-icon'].click(() => self.element.fadeOut(() => self.element.remove()));

    self.element.find('div.alert').addClass('alert-' + status);

    message && self.messageContainer.append(message);

    self.buttonContainer.append(self.closeIcon);

    if (confirmIcon) {

        self.confirmIcon = Templates['confirm-icon'].addClass('ml-1');

        self.buttonContainer.append(self.confirmIcon)

    }

}

AlertBox.warning = function (message, confirmationCallback) {

    let alert = new AlertBox('warning', message, confirmationCallback);

    alert.onConfirmation = function () {

        alert.element.fadeOut(function () {

            alert.element.remove();

            confirmationCallback && confirmationCallback();

        })

    };

    alert.deploy()

};

AlertBox.deletion = action => AlertBox.warning('This action cannot be reversed. Continue?', action);

AlertBox.status = (status, message) => new AlertBox(status, message).deploy();

AlertBox.prototype = {

    deploy: function () {

        let self = this;

        $(mainContainer).find('div.alert').fadeOut(function() { $(this).remove() });

        $(mainContainer).append(self.element.hide());

        self.element.fadeIn();

        // setTimeout(() => self.closeIcon.click(), 10000)

    },

    set onConfirmation(action) { this.confirmIcon.click(action) }

};

