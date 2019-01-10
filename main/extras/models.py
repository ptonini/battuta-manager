class ModelSerializerMixin:

    id = None

    type = None

    def _serializer(self, fields, attributes, links, meta, relationships, data=False):

        def filter_fields(field_dict, field_dict_name):

            if fields and field_dict_name in fields:

                return {k: v for k, v in field_dict.items() if k in fields[field_dict_name]}

            else:

                return field_dict

        data = data if data else {'id': self.id, 'type': self.type, 'attributes': {}, 'links': {}, 'meta':{}}

        data['attributes'].update(filter_fields(attributes, 'attributes'))

        data['links'].update(filter_fields(links, 'links'))

        data['meta'].update(filter_fields(meta, 'meta'))

        return data