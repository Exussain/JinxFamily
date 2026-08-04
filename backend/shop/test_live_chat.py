import json
import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import Client, TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from .models import LiveChatMessage, LiveChatSession


class LiveChatApiTests(TestCase):
    def _post(self, client, payload, path="/api/chat"):
        return client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def _init_guest(self, client=None):
        client = client or Client()
        response = self._post(client, {"action": "init"})
        self.assertEqual(response.status_code, 200)
        return client, response.json()["session_id"]

    def test_guest_session_is_bound_to_signed_cookie(self):
        owner, session_id = self._init_guest()

        allowed = owner.get(
            "/api/chat",
            {"after_id": 0},
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(len(allowed.json()["messages"]), 1)

        stranger = Client()
        denied_read = stranger.get("/api/chat", {"session_id": session_id})
        denied_send = self._post(
            stranger,
            {
                "action": "send",
                "session_id": session_id,
                "message_type": "text",
                "text": "not mine",
            },
        )
        self.assertEqual(denied_read.status_code, 404)
        self.assertEqual(denied_send.status_code, 404)

    def test_idle_incremental_read_does_not_write_chat_session(self):
        owner, _session_id = self._init_guest()
        owner.get("/api/chat", {"after_id": 0})

        with CaptureQueriesContext(connection) as queries:
            response = owner.get("/api/chat", {"after_id": 1})

        self.assertEqual(response.status_code, 200)
        chat_session_updates = [
            query["sql"]
            for query in queries.captured_queries
            if query["sql"].lstrip().upper().startswith("UPDATE")
            and "shop_livechatsession" in query["sql"]
        ]
        self.assertEqual(chat_session_updates, [])

    def test_guest_reinit_recovers_cookie_session_not_untrusted_uuid(self):
        owner, session_id = self._init_guest()
        other_session = LiveChatSession.objects.create(guest_name="other")

        response = self._post(
            owner,
            {"action": "init", "session_id": str(other_session.id)},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["session_id"], session_id)

    def test_authenticated_users_cannot_cross_session_boundaries(self):
        first_user = User.objects.create_user(username="09120000001")
        second_user = User.objects.create_user(username="09120000002")
        session = LiveChatSession.objects.create(user=first_user)

        first_client = Client()
        first_client.force_login(first_user)
        second_client = Client()
        second_client.force_login(second_user)

        allowed = self._post(
            first_client,
            {
                "action": "send",
                "session_id": str(session.id),
                "message_type": "text",
                "text": "hello",
            },
        )
        denied = second_client.get(
            "/api/chat",
            {"session_id": str(session.id)},
        )

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(denied.status_code, 404)

    def test_incremental_sync_is_bounded_and_cursor_based(self):
        owner, session_id = self._init_guest()
        session = LiveChatSession.objects.get(id=session_id)
        LiveChatMessage.objects.bulk_create(
            [
                LiveChatMessage(
                    session=session,
                    sender="user",
                    message_type="text",
                    text=f"message {index}",
                )
                for index in range(105)
            ]
        )

        first_page = owner.get(
            "/api/chat",
            {"session_id": session_id, "after_id": 0},
        ).json()
        second_page = owner.get(
            "/api/chat",
            {
                "session_id": session_id,
                "after_id": first_page["next_after_id"],
            },
        ).json()

        self.assertEqual(len(first_page["messages"]), 100)
        self.assertTrue(first_page["has_more"])
        self.assertEqual(len(second_page["messages"]), 6)
        self.assertFalse(second_page["has_more"])
        self.assertGreater(
            second_page["next_after_id"],
            first_page["next_after_id"],
        )

    def test_send_returns_confirmed_message_and_reopens_session(self):
        owner, session_id = self._init_guest()
        LiveChatSession.objects.filter(id=session_id).update(status="closed")

        response = self._post(
            owner,
            {
                "action": "send",
                "session_id": session_id,
                "message_type": "text",
                "text": "new question",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"]["text"], "new question")
        session = LiveChatSession.objects.get(id=session_id)
        self.assertEqual(session.status, "open")
        self.assertEqual(session.unread_admin, 1)

    def test_visitor_upload_requires_session_ownership(self):
        owner, session_id = self._init_guest()
        image = SimpleUploadedFile(
            "sample.png",
            b"\x89PNG\r\n\x1a\n",
            content_type="image/png",
        )

        denied = Client().post(
            "/api/chat/upload",
            {"session_id": session_id, "file": image},
        )

        self.assertEqual(denied.status_code, 404)

    def test_owned_upload_streams_to_session_scoped_path(self):
        owner, session_id = self._init_guest()
        image = SimpleUploadedFile(
            "sample.png",
            b"\x89PNG\r\n\x1a\n",
            content_type="image/png",
        )

        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                uploaded = owner.post(
                    "/api/chat/upload",
                    {"session_id": session_id, "file": image},
                )
                payload = uploaded.json()
                sent = self._post(
                    owner,
                    {
                        "action": "send",
                        "session_id": session_id,
                        "message_type": payload["message_type"],
                        "file_url": payload["file_url"],
                    },
                )

        self.assertEqual(uploaded.status_code, 200)
        self.assertTrue(payload["file_url"].startswith(f"/media/chat/{session_id}/"))
        self.assertEqual(sent.status_code, 200)

    def test_invalid_session_identifier_is_not_a_server_error(self):
        response = Client().get("/api/chat", {"session_id": "not-a-uuid"})
        self.assertEqual(response.status_code, 404)

    def test_admin_incremental_messages_and_send_response(self):
        admin = User.objects.create_user(username="admin", is_staff=True)
        admin_client = Client()
        admin_client.force_login(admin)
        session = LiveChatSession.objects.create(guest_name="guest", unread_admin=2)
        first = LiveChatMessage.objects.create(
            session=session,
            sender="user",
            text="first",
        )
        second = LiveChatMessage.objects.create(
            session=session,
            sender="user",
            text="second",
        )

        fetched = admin_client.get(
            "/api/admin/chat",
            {
                "action": "messages",
                "session_id": str(session.id),
                "after_id": first.id,
            },
        )
        sent = self._post(
            admin_client,
            {
                "action": "send",
                "session_id": str(session.id),
                "message_type": "text",
                "text": "answer",
            },
            path="/api/admin/chat",
        )

        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(
            [message["id"] for message in fetched.json()["messages"]],
            [second.id],
        )
        self.assertEqual(sent.status_code, 200)
        self.assertEqual(sent.json()["message"]["sender"], "admin")
        session.refresh_from_db()
        self.assertEqual(session.unread_admin, 0)
        self.assertEqual(session.unread_user, 1)

    def test_admin_typing_presence_is_visible_to_owner_and_can_stop(self):
        owner, session_id = self._init_guest()
        admin = User.objects.create_user(username="typing-admin", is_staff=True)
        admin_client = Client()
        admin_client.force_login(admin)

        started = self._post(
            admin_client,
            {
                "action": "typing",
                "session_id": session_id,
                "is_typing": True,
            },
            path="/api/admin/chat",
        )
        visible = owner.get("/api/chat", {"after_id": 0})
        stopped = self._post(
            admin_client,
            {
                "action": "typing",
                "session_id": session_id,
                "is_typing": False,
            },
            path="/api/admin/chat",
        )
        hidden = owner.get("/api/chat", {"after_id": visible.json()["next_after_id"]})

        self.assertEqual(started.status_code, 200)
        self.assertTrue(visible.json()["typing"]["admin"])
        self.assertEqual(stopped.status_code, 200)
        self.assertFalse(hidden.json()["typing"]["admin"])

    def test_admin_typing_requires_a_real_json_boolean(self):
        owner, session_id = self._init_guest()
        admin = User.objects.create_user(username="typing-strict-admin", is_staff=True)
        admin_client = Client()
        admin_client.force_login(admin)

        response = self._post(
            admin_client,
            {
                "action": "typing",
                "session_id": session_id,
                "is_typing": "false",
            },
            path="/api/admin/chat",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["typing"])
        session = LiveChatSession.objects.get(id=session_id)
        self.assertIsNone(session.admin_typing_until)

    def test_expired_typing_presence_is_not_returned(self):
        owner, session_id = self._init_guest()
        LiveChatSession.objects.filter(id=session_id).update(
            admin_typing_until=timezone.now() - timedelta(seconds=1),
            ai_typing_until=timezone.now() - timedelta(seconds=1),
        )

        response = owner.get("/api/chat", {"after_id": 0})

        self.assertEqual(
            response.json()["typing"],
            {"admin": False, "ai": False},
        )

    def test_user_send_reports_ai_typing_immediately(self):
        owner, session_id = self._init_guest()

        with patch("shop.ai_support.maybe_autoreply", return_value=True):
            response = self._post(
                owner,
                {
                    "action": "send",
                    "session_id": session_id,
                    "message_type": "text",
                    "text": "AI question",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["typing"]["ai"])

    def test_ai_worker_clears_typing_presence_after_reply(self):
        from . import ai_support

        session = LiveChatSession.objects.create(
            guest_name="AI test",
            ai_typing_until=timezone.now() + timedelta(seconds=90),
        )
        trigger = LiveChatMessage.objects.create(
            session=session,
            sender="user",
            text="question",
        )

        with (
            patch("time.sleep"),
            patch.object(ai_support, "generate_reply", return_value="AI answer"),
        ):
            ai_support._do_autoreply(str(session.id), trigger.id)

        session.refresh_from_db()
        self.assertIsNone(session.ai_typing_until)
        self.assertTrue(
            session.messages.filter(
                sender="admin",
                is_ai=True,
                text="AI answer",
            ).exists()
        )

    def test_build_messages_with_image(self):
        from . import ai_support
        session = LiveChatSession.objects.create(guest_name="Vision test")
        LiveChatMessage.objects.create(
            session=session,
            sender="user",
            message_type="image",
            text="لطفاً این خطا رو ببین",
            file_url="https://example.com/test.jpg"
        )
        msgs = ai_support.build_messages(session)
        user_msg = msgs[-1]
        self.assertEqual(user_msg["role"], "user")
        self.assertIsInstance(user_msg["content"], list)
        self.assertEqual(user_msg["content"][0]["type"], "text")
        self.assertEqual(user_msg["content"][1]["type"], "image_url")

