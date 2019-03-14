function ModalBox (type, header, $content, onConfirmation, bindForm=true) {

    let self = this;

    self.element = Templates['dialog'];

    self.closeButton = Templates['close-button'];

    self.cancelButton = Templates['cancel-button'];

    self.confirmButton = Templates['confirm-button'];

    self.header = self.element.find('h5.dialog-header');

    self.content = self.element.find('div.dialog-content');

    self.footer = self.element.find('div.dialog-footer');

    self.onClose = () => self.close();

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
                onConfirmation ? self.confirmButton : null
            );

            if (bindForm && $content.is('form')) $content.submit(event => {

                event.preventDefault();

                self.confirm()

            })

    }

}

ModalBox.prototype = {

    defaultOptions: {
        width: '360',
        modal: true,
        show: true,
        hide: true,
        resizable: false,
        position: ModalBox.prototype.defaultPosition,
        close: function() { $(this).remove() }
    },

    defaultPosition: {my: 'center', at: 'center', of: window},

    open: function(options) {

        this.element.dialog(Object.assign({}, this.defaultOptions, options ? options : {}));

        this.center();

        $(window).resize(() => this.center());

        return this;

    },

    close: function () { this.element.dialog('close') },

    confirm: function () { this.confirmButton.click() },

    center: function () { this.element.dialog('option', 'position', this.defaultPosition) },

    set onConfirmation(callback) { this.confirmButton.click(callback) },

};