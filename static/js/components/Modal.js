function Modal (type, header, content) {

    let self = this;

    self.element = Templates['dialog'];

    self.header = self.element.find('h5.dialog-header');

    if (header) {

        if (header !== true) self.header.html(header)

    } else self.header.remove();

    content && self.element.find('div.dialog-content').append(content);

    switch (type) {

        case 'notification':

            self.element.find('div.dialog-footer').append(
                Templates['close-button'].click(() => self.element.dialog('close'))
            );

            break;

        case 'confirmation':

            self.element.find('div.dialog-footer').append(
                Templates['cancel-button'].click(() => self.element.dialog('close')),
                Templates['confirm-button']
            );
    }

}

Modal.notification = function (header, content) {

    return new Modal('notification', header, content).element

};

Modal.confirmation = function (header, content) {

    return new Modal('confirmation', header, content).element

};