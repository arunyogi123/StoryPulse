from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from news.models import Article

User = get_user_model()


class DashboardStatsAPITests(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="staff_editor",
            email="staff@example.com",
            password="testpassword123",
            is_staff=True,
            is_active=True,
        )
        self.regular_user = User.objects.create_user(
            username="regular_reader",
            email="reader@example.com",
            password="testpassword123",
            is_staff=False,
            is_active=True,
        )
        self.category = Category.objects.create(
            name="Science News",
            slug="science-news",
        )
        Article.objects.create(
            title="Published Story",
            slug="published-story",
            summary="Summary 1",
            content="Content 1",
            category=self.category,
            author=self.staff_user,
            is_published=True,
            is_featured=True,
        )
        Article.objects.create(
            title="Draft Story",
            slug="draft-story",
            summary="Summary 2",
            content="Content 2",
            category=self.category,
            author=self.staff_user,
            is_published=False,
            is_featured=False,
        )
        self.stats_url = reverse("admin-dashboard-stats")

    def test_anonymous_user_cannot_access_stats(self):
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_access_stats(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_receives_accurate_stats(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_articles"], 2)
        self.assertEqual(response.data["published_articles"], 1)
        self.assertEqual(response.data["draft_articles"], 1)
        self.assertEqual(response.data["featured_articles"], 1)
        self.assertEqual(response.data["total_categories"], 1)
        self.assertEqual(response.data["total_users"], 2)

