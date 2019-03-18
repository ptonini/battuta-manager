function ModalBox (header, $content, confirmButton=true, bindForm=true) {

    let self = this;

    self.element = Templates['dialog'];

    self.closeButton = Templates['close-button'];

    self.header = self.element.find('h5.dialog-header');

    self.content = self.element.find('div.dialog-content');

    self.footer = self.element.find('div.dialog-footer');

    if (header) { if (header !== true) self.header.html(header)

    } else self.header.remove();

    self.onClose = () => self.close();

    $content && self.content.append($content);

    self.footer.append(self.closeButton);

    if (confirmButton)  {

        self.confirmButton = Templates['confirm-button'];

        self.footer.append(self.confirmButton);

        if (bindForm && $content.is('form')) $content.submit(event => {

            event.preventDefault();

            self.confirm()

        });

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

    set onConfirmation(action) { this.confirmButton.off().click(action) },

    set onClose(action) { this.closeButton.off().click(action) },

};