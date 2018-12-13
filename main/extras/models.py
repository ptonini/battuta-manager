class SerializerModelMixin:

    def _serializer(self, fields, attributes, links, meta, relationships, data=False):

        data = data if data else {'id': self.id, 'type': self.type, 'attributes': {}, 'links': {}, 'meta':{}, 'relationships': {}}

        att_dict = False

        link_dict = False

        meta_dict = False

        # relationships_dict = False

        if not fields or 'attributes' in fields:

            att_dict = {k: v for k, v in attributes.items() if not fields or k in fields['attributes']}

        if not fields or 'links' in fields:

            link_dict = {k: v for k, v in links.items() if not fields or k in fields['links']}

        if not fields or 'meta' in fields:

            meta_dict = {k: v for k, v in meta.items() if not fields or k in fields['meta']}

        # if not fields or 'relationships' in fields:
        #
        #     relationships_dict = {k: v for k, v in relationships.items() if not fields or k in fields['relationships']}

        att_dict and data['attributes'].update(att_dict)

        link_dict and data['links'].update(link_dict)

        meta_dict and data['meta'].update(meta_dict)

        # relationships_dict and data['relationships'].update(relationships_dict)

        return data