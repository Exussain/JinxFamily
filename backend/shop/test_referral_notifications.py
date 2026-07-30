from django.contrib.auth.models import User
from django.test import TestCase

from .models import PointsTransaction, Referral, UserProfile
from .rewards import REFERRAL_MILESTONE_COUNT, REFERRAL_MILESTONE_POINTS, process_referral


class ReferralNotificationApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="09120000001", password="secret")
        self.other_user = User.objects.create_user(username="09120000002", password="secret")
        UserProfile.objects.create(user=self.user, referral_code="NX-OWNER1")
        UserProfile.objects.create(user=self.other_user, referral_code="NX-OTHER1")

    def _add_referral(self, referrer, suffix, diamonds):
        referee = User.objects.create_user(username=f"0912111{suffix:04d}")
        UserProfile.objects.create(user=referee, referred_by=referrer)
        return Referral.objects.create(
            referrer=referrer,
            referee=referee,
            points_awarded=diamonds,
        )

    def test_referral_status_returns_only_current_users_unseen_activity(self):
        self._add_referral(self.user, 1, 0)
        self._add_referral(self.user, 2, 0)
        self._add_referral(self.user, 3, REFERRAL_MILESTONE_POINTS)
        self._add_referral(self.other_user, 99, 50)
        self.client.force_login(self.user)

        response = self.client.get("/api/me/referral")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["unseen"], {
            "count": 3,
            "diamonds": REFERRAL_MILESTONE_POINTS,
            "crossed_milestone": True,
        })
        self.assertEqual(payload["milestone"]["target"], REFERRAL_MILESTONE_COUNT)
        self.assertEqual(payload["milestone"]["reward_points"], REFERRAL_MILESTONE_POINTS)
        self.assertTrue(payload["milestone"]["reached"])
        self.assertEqual(payload["milestone"]["rewards"], [])
        self.assertEqual(payload["points_earned"], 0)  # no PointsTransaction rows yet

    def test_crossed_milestone_is_true_when_unseen_rows_include_third_referral(self):
        self._add_referral(self.user, 1, 0)
        self._add_referral(self.user, 2, 0)
        self._add_referral(self.user, 3, REFERRAL_MILESTONE_POINTS)
        profile = self.user.profile
        profile.referral_notified_count = 2
        profile.save(update_fields=["referral_notified_count"])
        self.client.force_login(self.user)

        response = self.client.get("/api/me/referral")

        self.assertTrue(response.json()["unseen"]["crossed_milestone"])
        self.assertEqual(response.json()["unseen"]["count"], 1)
        self.assertEqual(response.json()["unseen"]["diamonds"], REFERRAL_MILESTONE_POINTS)

    def test_acknowledgement_is_authenticated_post_only_and_idempotent(self):
        for index in range(1, 4):
            self._add_referral(self.user, index, 0)

        anonymous = self.client.post("/api/me/referral/acknowledge")
        self.assertEqual(anonymous.status_code, 401)

        self.client.force_login(self.user)
        wrong_method = self.client.get("/api/me/referral/acknowledge")
        self.assertEqual(wrong_method.status_code, 405)

        first = self.client.post("/api/me/referral/acknowledge")
        second = self.client.post("/api/me/referral/acknowledge")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json(), {"acknowledged_count": 3})
        self.assertEqual(second.json(), {"acknowledged_count": 3})
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.referral_notified_count, 3)
        self.assertEqual(self.other_user.profile.referral_notified_count, 0)


class ProcessReferralMilestoneTests(TestCase):
    def setUp(self):
        self.referrer = User.objects.create_user(username="09123330001", password="secret")
        UserProfile.objects.create(user=self.referrer, referral_code="NX-REF001")

    def _signup_with_code(self, phone_suffix: int):
        referee = User.objects.create_user(username=f"0912444{phone_suffix:04d}", password="secret")
        UserProfile.objects.create(user=referee)
        return process_referral(referee, "NX-REF001"), referee

    def test_first_two_invites_award_zero_third_awards_fifty(self):
        pts1, _ = self._signup_with_code(1)
        pts2, _ = self._signup_with_code(2)
        pts3, _ = self._signup_with_code(3)

        self.assertEqual(pts1, 0)
        self.assertEqual(pts2, 0)
        self.assertEqual(pts3, REFERRAL_MILESTONE_POINTS)

        referrals = list(
            Referral.objects.filter(referrer=self.referrer).order_by("created_at", "id")
        )
        self.assertEqual(len(referrals), 3)
        self.assertEqual([r.points_awarded for r in referrals], [0, 0, REFERRAL_MILESTONE_POINTS])

        total = sum(
            t.amount
            for t in PointsTransaction.objects.filter(user=self.referrer, reason="referral")
        )
        self.assertEqual(total, REFERRAL_MILESTONE_POINTS)
        self.referrer.profile.refresh_from_db()
        self.assertEqual(self.referrer.profile.points_balance, REFERRAL_MILESTONE_POINTS)

    def test_fourth_invite_does_not_award_again(self):
        for i in range(1, 5):
            self._signup_with_code(i)
        total = sum(
            t.amount
            for t in PointsTransaction.objects.filter(user=self.referrer, reason="referral")
        )
        self.assertEqual(total, REFERRAL_MILESTONE_POINTS)
        self.assertEqual(Referral.objects.filter(referrer=self.referrer).count(), 4)

    def test_invalid_code_and_self_referral(self):
        other = User.objects.create_user(username="09125550001", password="secret")
        UserProfile.objects.create(user=other)
        self.assertIsNone(process_referral(other, "NX-NOPE"))
        self.assertIsNone(process_referral(self.referrer, "NX-REF001"))
