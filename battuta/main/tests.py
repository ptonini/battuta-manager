from django.test import TestCase

# Create your tests here.


class MainViewTestCase(TestCase):

    def test_index(self):

        resp = self.client.get('/')

        self.assertEqual(resp.status_code, 200)
