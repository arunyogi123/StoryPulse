from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from bookmarks.models import Bookmark
from categories.models import Category
from news.models import Article

User = get_user_model()


class BookmarkAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="reader1",
            email="reader1@example.com",
            password="testpassword123",
            is_active=True,
        )
        self.user2 = User.objects.create_user(
            username="reader2",
            email="reader2@example.com",
            password="testpassword123",
            is_active=True,
        )
        self.author = User.objects.create_user(
            username="staff_editor",
            email="staff@example.com",
            password="testpassword123",
            is_staff=True,
            is_active=True,
        )
        self.category = Category.objects.create(
            name="World News",
            slug="world-news",
        )
        self.published_article = Article.objects.create(
            title="Solar Energy Boom",
            slug="solar-energy-boom",
            summary="Clean energy updates.",
            content="Full story details here.",
            category=self.category,
            author=self.author,
            is_published=True,
        )
        self.draft_article = Article.objects.create(
            title="Secret Draft Story",
            slug="secret-draft-story",
            summary="Draft summary.",
            content="Draft content.",
            category=self.category,
            author=self.author,
            is_published=False,
        )
        self.list_create_url = reverse("bookmark-list-create")

    def test_anonymous_user_cannot_access_bookmarks(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_and_list_bookmark(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            self.list_create_url,
            {"article_id": self.published_article.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["article"]["id"], self.published_article.id)

        # List
        get_response = self.client.get(self.list_create_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_response.data), 1)
        self.assertEqual(get_response.data[0]["article"]["title"], "Solar Energy Boom")

    def test_duplicate_bookmark_rejected(self):
        self.client.force_authenticate(user=self.user1)
        Bookmark.objects.create(user=self.user1, article=self.published_article)

        response = self.client.post(
            self.list_create_url,
            {"article_id": self.published_article.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_bookmark_unpublished_article(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            self.list_create_url,
            {"article_id": self.draft_article.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_bookmark_by_id(self):
        self.client.force_authenticate(user=self.user1)
        bm = Bookmark.objects.create(user=self.user1, article=self.published_article)
        delete_url = reverse("bookmark-delete", kwargs={"bookmark_id": bm.id})

        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Bookmark.objects.filter(id=bm.id).exists())

    def test_delete_bookmark_by_article_id(self):
        self.client.force_authenticate(user=self.user1)
        bm = Bookmark.objects.create(user=self.user1, article=self.published_article)
        delete_url = reverse(
            "bookmark-delete-by-article",
            kwargs={"article_id": self.published_article.id},
        )

        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Bookmark.objects.filter(id=bm.id).exists())

    def test_user_cannot_delete_another_users_bookmark(self):
        bm = Bookmark.objects.create(user=self.user1, article=self.published_article)
        self.client.force_authenticate(user=self.user2)

        delete_url = reverse("bookmark-delete", kwargs={"bookmark_id": bm.id})
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Bookmark.objects.filter(id=bm.id).exists())
