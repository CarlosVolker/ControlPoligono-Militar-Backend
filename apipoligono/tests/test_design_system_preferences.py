from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apipoligono.models import (
    DSAmbcolor,
    DSAmbient,
    DSAccent,
    DSBg,
    DSFont,
    DSIconfam,
    DSRadius,
    DSTheme,
    Usuario,
)
from apipoligono.tests._factories import make_tenant, make_user_account


TEST_PASSWORD = 'appearance-test-password'
APPEARANCE_FIELDS = (
    'ds_theme',
    'ds_accent',
    'ds_bg',
    'ds_font',
    'ds_radius',
    'ds_iconfam',
    'ds_ambient',
    'ds_ambcolor',
)
DEFAULTS = {
    'ds_theme': 'dark',
    'ds_accent': 'mint',
    'ds_bg': 'command',
    'ds_font': 'ibm-plex',
    'ds_radius': 'square',
    'ds_iconfam': 'phosphor',
    'ds_ambient': 'embers',
    'ds_ambcolor': 'accent',
}
ENUMS = {
    'ds_theme': DSTheme,
    'ds_accent': DSAccent,
    'ds_bg': DSBg,
    'ds_font': DSFont,
    'ds_radius': DSRadius,
    'ds_iconfam': DSIconfam,
    'ds_ambient': DSAmbient,
    'ds_ambcolor': DSAmbcolor,
}
LEGACY_FIELDS = ('theme', 'palette', 'density')


class DesignSystemAppearanceEndpointTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        tenant = make_tenant(code='appearance-test', name='Appearance test tenant')
        cls.user_one, _ = make_user_account(
            tenant,
            rut='TEST-APPEARANCE-ONE',
            password=TEST_PASSWORD,
            nombre='Appearance one',
        )
        cls.user_two, _ = make_user_account(
            tenant,
            rut='TEST-APPEARANCE-TWO',
            password=TEST_PASSWORD,
            nombre='Appearance two',
        )

    def setUp(self):
        self.url = reverse('design_system_appearance')
        self.user = Usuario.objects.get(pk=self.user_one.pk)
        self.client, self.csrf_token = self._authenticated_client(self.user)

    def _authenticated_client(self, user):
        client = APIClient(enforce_csrf_checks=True)
        response = client.post(
            reverse('session_login'),
            {'rut': user.rut, 'password': TEST_PASSWORD},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(settings.CSRF_COOKIE_NAME, client.cookies)
        self.assertIn(settings.SESSION_COOKIE_NAME, client.cookies)
        return client, client.cookies[settings.CSRF_COOKIE_NAME].value

    def _put(self, payload, client=None, csrf_token=None):
        client = client or self.client
        csrf_token = csrf_token or self.csrf_token
        return client.put(
            self.url,
            payload,
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )

    def _delete(self, client=None, csrf_token=None):
        client = client or self.client
        csrf_token = csrf_token or self.csrf_token
        return client.delete(self.url, HTTP_X_CSRFTOKEN=csrf_token)

    def _alternate_snapshot(self):
        return {
            field: next(
                value for value, _ in ENUMS[field].choices
                if value != DEFAULTS[field]
            )
            for field in APPEARANCE_FIELDS
        }

    def _stored_snapshot(self, user=None):
        user = user or self.user
        user.refresh_from_db()
        return {field: getattr(user, field) for field in APPEARANCE_FIELDS}

    def test_get_returns_exact_defaults_without_mutating_user(self):
        before = self._stored_snapshot()
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, DEFAULTS)
        self.assertEqual(set(response.data), set(APPEARANCE_FIELDS))
        self.assertEqual(self._stored_snapshot(), before)
        self.assertNotIn('HTTP_X_TENANT_CODE', self.client.defaults)

    def test_put_persists_full_snapshot_and_get_returns_it(self):
        snapshot = self._alternate_snapshot()

        response = self._put(snapshot)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, snapshot)
        self.assertEqual(self._stored_snapshot(), snapshot)
        self.assertEqual(self.client.get(self.url).data, snapshot)

    def test_put_accepts_every_value_in_each_model_enum(self):
        payload = self._alternate_snapshot()

        for field, choices in ((field, enum.choices) for field, enum in ENUMS.items()):
            for value, _ in choices:
                with self.subTest(field=field, value=value):
                    candidate = {**payload, field: value}
                    response = self._put(candidate)
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.data, candidate)
                    payload = candidate

    def test_put_rejects_invalid_strings_null_and_non_string_values(self):
        baseline = self._alternate_snapshot()
        self.assertEqual(self._put(baseline).status_code, 200)

        invalid_values = (
            ('ds_accent', 'not-a-choice'),
            ('ds_bg', ''),
            ('ds_theme', None),
            ('ds_font', 7),
            ('ds_radius', False),
            ('ds_iconfam', []),
            ('ds_ambient', {}),
        )
        for field, value in invalid_values:
            with self.subTest(field=field, value=value):
                response = self._put({**baseline, field: value})
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)
                self.assertEqual(self._stored_snapshot(), baseline)

    def test_put_rejects_each_missing_field_and_reports_non_field_errors(self):
        baseline = self._alternate_snapshot()
        self.assertEqual(self._put(baseline).status_code, 200)

        for field in APPEARANCE_FIELDS:
            with self.subTest(missing=field):
                payload = {key: value for key, value in baseline.items() if key != field}
                response = self._put(payload)
                self.assertEqual(response.status_code, 400)
                self.assertIn('non_field_errors', response.data)
                self.assertEqual(self._stored_snapshot(), baseline)

    def test_put_rejects_extra_fields_with_non_field_errors(self):
        baseline = self._alternate_snapshot()
        response = self._put({**baseline, 'unexpected': 'value'})

        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data)
        self.assertIn('Unexpected field.', response.data['non_field_errors'])
        self.assertEqual(self._stored_snapshot(), DEFAULTS)

    def test_invalid_put_does_not_partially_write_valid_fields(self):
        baseline = self._alternate_snapshot()
        self.assertEqual(self._put(baseline).status_code, 200)
        rejected = {**baseline, 'ds_theme': 'light', 'ds_accent': 'invalid-accent'}

        response = self._put(rejected)

        self.assertEqual(response.status_code, 400)
        self.assertIn('ds_accent', response.data)
        self.assertEqual(self._stored_snapshot(), baseline)
        self.assertEqual(self.client.get(self.url).data, baseline)

    def test_delete_resets_to_defaults_with_empty_idempotent_204(self):
        self.assertEqual(self._put(self._alternate_snapshot()).status_code, 200)

        first = self._delete()
        second = self._delete()

        self.assertEqual(first.status_code, 204)
        self.assertEqual(first.content, b'')
        self.assertEqual(second.status_code, 204)
        self.assertEqual(second.content, b'')
        self.assertEqual(self._stored_snapshot(), DEFAULTS)
        self.assertEqual(self.client.get(self.url).data, DEFAULTS)

    def test_session_csrf_is_required_for_put_and_delete(self):
        baseline = self._alternate_snapshot()
        self.assertEqual(self._put(baseline).status_code, 200)
        other_snapshot = self._alternate_snapshot()
        other_snapshot['ds_theme'] = 'light'

        put_response = self.client.put(self.url, other_snapshot, format='json')
        delete_response = self.client.delete(self.url)

        self.assertEqual(put_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        self.assertEqual(self._stored_snapshot(), baseline)

    def test_anonymous_requests_are_rejected(self):
        anonymous = APIClient(enforce_csrf_checks=True)

        self.assertEqual(anonymous.get(self.url).status_code, 403)
        self.assertEqual(
            anonymous.put(self.url, DEFAULTS, format='json').status_code,
            403,
        )
        self.assertEqual(anonymous.delete(self.url).status_code, 403)

    def test_post_and_patch_are_method_not_allowed_with_session_and_csrf(self):
        baseline = self._alternate_snapshot()
        self.assertEqual(self._put(baseline).status_code, 200)

        post_response = self.client.post(
            self.url,
            baseline,
            format='json',
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )
        patch_response = self.client.patch(
            self.url,
            baseline,
            format='json',
            HTTP_X_CSRFTOKEN=self.csrf_token,
        )

        self.assertEqual(post_response.status_code, 405)
        self.assertEqual(patch_response.status_code, 405)
        self.assertEqual(self._stored_snapshot(), baseline)

    def test_preferences_are_isolated_between_authenticated_sessions(self):
        second_user = Usuario.objects.get(pk=self.user_two.pk)
        second_client, second_csrf = self._authenticated_client(second_user)
        first_snapshot = self._alternate_snapshot()
        second_snapshot = self._alternate_snapshot()
        second_snapshot['ds_theme'] = DEFAULTS['ds_theme']

        self.assertEqual(self._put(first_snapshot).status_code, 200)
        self.assertEqual(second_client.get(self.url).data, DEFAULTS)
        self.assertEqual(
            self._put(second_snapshot, client=second_client, csrf_token=second_csrf).status_code,
            200,
        )
        self.assertEqual(self.client.get(self.url).data, first_snapshot)
        self.assertEqual(second_client.get(self.url).data, second_snapshot)
        self.assertEqual(self._stored_snapshot(self.user), first_snapshot)
        self.assertEqual(self._stored_snapshot(second_user), second_snapshot)

    def test_legacy_preferences_remain_unchanged(self):
        legacy = {
            'theme': 'nexus-dark',
            'palette': 'military-teal',
            'density': 'compact',
        }
        for field, value in legacy.items():
            setattr(self.user, field, value)
        self.user.save(update_fields=LEGACY_FIELDS)

        put_response = self._put(self._alternate_snapshot())
        delete_response = self._delete()

        self.assertEqual(set(put_response.data), set(APPEARANCE_FIELDS))
        self.assertEqual(delete_response.status_code, 204)
        self.user.refresh_from_db()
        self.assertEqual(
            {field: getattr(self.user, field) for field in LEGACY_FIELDS},
            legacy,
        )
