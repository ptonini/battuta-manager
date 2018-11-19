class SerializerModelMixin:

    def serializer(self, fields, attributes, links, meta, data=False):

        data = data if data else {'id': self.id, 'type': self.type, 'attributes': {}, 'links': {}, 'meta':{}}

        att_dict = False

        link_dict = False

        meta_dict = False

        if not fields or 'attributes' in fields:

            att_dict = {k: v for k, v in attributes.items() if not fields or k in fields['attributes']}

        if not fields or 'links' in fields:

            link_dict = {k: v for k, v in links.items() if not fields or k in fields['links']}

        if not fields or 'meta' in fields:

            meta_dict = {k: v for k, v in meta.items() if not fields or k in fields['meta']}

        att_dict and data['attributes'].update(att_dict)

        link_dict and data['links'].update(link_dict)

        meta_dict and data['meta'].update(meta_dict)

        return data