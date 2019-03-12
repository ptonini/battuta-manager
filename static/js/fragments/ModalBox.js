function ModalBox (type, header, $content, onConfirmation, onClose=false, bindForm=true) {

    let self = this;

    self.element = Templates['dialog'];

    self.closeButton = Templates['close-button'];

    self.cancelButton = Templates['cancel-button'];

    self.confirmButton = Templates['confirm-button'];

    self.header = self.element.find('h5.dialog-header');

    self.content = self.element.find('div.dialog-content');

    self.footer = self.element.find('div.dialog-footer');

    self.onClose = () => {

        onClose && onClose();

        self.close()

    };{width: 700}

    self.onConfirmation = () => onConfirmation && onConfirmation !== true && onConfirmation(self);

    if (header) {

        if (header !== true) self.header.html(header)

    } else self.header.remove();

    $content && self.content.append($content);

    switch (type) {

        case 'notification':

            self.footer.append(self.closeButton.click(self.onClose));

            break;

        case 'confirmation':

            self.footer.append(
                self.cancelButton.click(self.onClose),
                onConfirmation ? self.confirmButton.click(self.onConfirmation) : null
            );

            if (bindForm && $content.is('form')) {

                $content.submit(event => {

                    event.preventDefault();

                    self.confirmButton.click()

                })

            }

    }

}

ModalBox.prototype = {

    defaultOptions: {
        width: '360',
        modal: true,
        show: true,
        hide: true,
        resizable: false,
        close: function() { $(this).remove() }
    },

    open: function(options) {

        this.element.dialog(Object.assign({}, this.defaultOptions, options ? options : {}))

    },

    close: function() { this.element.dialog('close') },

    confirm: function () { this.confirmButton.click() }

};