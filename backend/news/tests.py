from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from news.models import Article

User = get_user_model()


class ArticleVisibilityTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Technology",
            slug="technology",
            description="Tech news",
        )
        self.staff_user = User.objects.create_user(
            username="staff_author",
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

        self.published_article = Article.objects.create(
            title="Published Tech Story",
            slug="published-tech-story",
            summary="A published summary.",
            content="Content for published story.",
            category=self.category,
            author=self.staff_user,
            is_published=True,
            is_featured=False,
        )
        self.draft_article = Article.objects.create(
            title="Draft Tech Story",
            slug="draft-tech-story",
            summary="A draft summary.",
            content="Content for draft story.",
            category=self.category,
            author=self.staff_user,
            is_published=False,
            is_featured=False,
        )
        self.articles_url = reverse("article-list")

    def test_anonymous_user_sees_only_published_articles(self):
        response = self.client.get(self.articles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("published-tech-story", slugs)
        self.assertNotIn("draft-tech-story", slugs)

    def test_regular_user_sees_only_published_articles(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.articles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("published-tech-story", slugs)
        self.assertNotIn("draft-tech-story", slugs)

    def test_staff_user_sees_all_articles_by_default(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.articles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("published-tech-story", slugs)
        self.assertIn("draft-tech-story", slugs)

    def test_staff_user_status_published_filter(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.articles_url, {"status": "published"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("published-tech-story", slugs)
        self.assertNotIn("draft-tech-story", slugs)

    def test_staff_user_status_draft_filter(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.articles_url, {"status": "draft"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertNotIn("published-tech-story", slugs)
        self.assertIn("draft-tech-story", slugs)

    def test_category_filter(self):
        other_cat = Category.objects.create(name="Health", slug="health")
        Article.objects.create(
            title="Health News",
            slug="health-news",
            summary="Health summary",
            content="Health content",
            category=other_cat,
            author=self.staff_user,
            is_published=True,
        )
        response = self.client.get(self.articles_url, {"category": "health"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("health-news", slugs)
        self.assertNotIn("published-tech-story", slugs)

    def test_search_filter(self):
        response = self.client.get(self.articles_url, {"search": "Published Tech"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.data]
        self.assertIn("published-tech-story", slugs)
        self.assertNotIn("draft-tech-story", slugs)



class ArticleSlugGenerationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Science",
            slug="science",
            description="Science news",
        )
        self.staff_user = User.objects.create_user(
            username="science_editor",
            email="science@example.com",
            password="testpassword123",
            is_staff=True,
            is_active=True,
        )
        self.client.force_authenticate(user=self.staff_user)
        self.create_url = reverse("article-create")

    def test_auto_slug_generation_when_omitted(self):
        data = {
            "title": "Exploring Distant Galaxies",
            "summary": "Telescopes capture ancient light.",
            "content": "Detailed article content here.",
            "category": self.category.id,
            "is_published": False,
        }
        response = self.client.post(self.create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "exploring-distant-galaxies")

    def test_auto_slug_collision_resolution(self):
        # Create first article
        self.client.post(
            self.create_url,
            {
                "title": "Quantum Computing Breakthrough",
                "summary": "Summary 1",
                "content": "Content 1",
                "category": self.category.id,
            },
        )
        # Create second article with exact same title
        response = self.client.post(
            self.create_url,
            {
                "title": "Quantum Computing Breakthrough",
                "summary": "Summary 2",
                "content": "Content 2",
                "category": self.category.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["slug"],
            "quantum-computing-breakthrough-1",
        )

    def test_explicit_slug_preserved(self):
        response = self.client.post(
            self.create_url,
            {
                "title": "Generic Title",
                "slug": "custom-engineered-slug",
                "summary": "Summary text",
                "content": "Content text",
                "category": self.category.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "custom-engineered-slug")

    def test_duplicate_explicit_slug_rejected(self):
        # Create first
        self.client.post(
            self.create_url,
            {
                "title": "First",
                "slug": "unique-slug-xyz",
                "summary": "Summary",
                "content": "Content",
                "category": self.category.id,
            },
        )
        # Attempt second with duplicate slug
        response = self.client.post(
            self.create_url,
            {
                "title": "Second",
                "slug": "unique-slug-xyz",
                "summary": "Summary",
                "content": "Content",
                "category": self.category.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", response.data)


class ArticlePermissionsTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="World",
            slug="world",
            description="World news",
        )
        self.regular_user = User.objects.create_user(
            username="regular_joe",
            email="joe@example.com",
            password="testpassword123",
            is_staff=False,
            is_active=True,
        )
        self.staff_user = User.objects.create_user(
            username="staff_jane",
            email="jane@example.com",
            password="testpassword123",
            is_staff=True,
            is_active=True,
        )
        self.article = Article.objects.create(
            title="Global Summit",
            slug="global-summit",
            summary="Leaders meet.",
            content="Full summit details.",
            category=self.category,
            author=self.staff_user,
            is_published=True,
        )
        self.create_url = reverse("article-create")
        self.manage_url = reverse(
            "article-manage",
            kwargs={"slug": self.article.slug},
        )

    def test_regular_user_cannot_create_article(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            self.create_url,
            {
                "title": "Unauthorized Story",
                "summary": "Summary",
                "content": "Content",
                "category": self.category.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_update_article(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            self.manage_url,
            {"title": "Tampered Title"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_delete_article(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(self.manage_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


import io
import shutil
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image


def generate_test_image(format="JPEG", size=(100, 100), color=(200, 50, 50)):
    file_obj = io.BytesIO()
    image = Image.new("RGB", size, color)
    image.save(file_obj, format=format)
    file_obj.seek(0)
    return file_obj.read()


class ArticleImageSelectionTests(APITestCase):
    def setUp(self):
        self.temp_media = tempfile.mkdtemp()
        self.settings_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.settings_override.enable()

        self.category = Category.objects.create(
            name="Media Tech",
            slug="media-tech",
            description="Media technology",
        )
        self.staff_user = User.objects.create_user(
            username="editor_dan",
            email="dan@example.com",
            password="testpassword123",
            is_staff=True,
            is_active=True,
        )
        self.regular_user = User.objects.create_user(
            username="reader_bob",
            email="bob@example.com",
            password="testpassword123",
            is_staff=False,
            is_active=True,
        )
        self.create_url = reverse("article-create")

    def tearDown(self):
        self.settings_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)

    def test_create_article_with_valid_online_image_url(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "title": "Online Image Article",
            "summary": "Summary of article.",
            "content": "Full story content.",
            "category": self.category.id,
            "image": "https://images.example.com/nature.jpg",
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["image"], "https://images.example.com/nature.jpg"
        )

        article = Article.objects.get(slug=response.data["slug"])
        self.assertEqual(article.image, "https://images.example.com/nature.jpg")
        self.assertFalse(bool(article.image_file))

    def test_create_article_with_invalid_image_url_fails(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "title": "Invalid URL Article",
            "summary": "Summary text.",
            "content": "Content text.",
            "category": self.category.id,
            "image": "not-a-valid-url",
        }
        response = self.client.post(self.create_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", response.data)

    def test_create_article_with_jpeg_file_upload(self):
        self.client.force_authenticate(user=self.staff_user)
        img_bytes = generate_test_image("JPEG")
        uploaded = SimpleUploadedFile(
            "sample.jpg", img_bytes, content_type="image/jpeg"
        )

        payload = {
            "title": "JPEG Upload Story",
            "summary": "JPEG summary.",
            "content": "JPEG story content.",
            "category": self.category.id,
            "image_file": uploaded,
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        article = Article.objects.get(slug=response.data["slug"])
        self.assertTrue(bool(article.image_file))
        # The serializer must return a usable image URL pointing to the media file
        self.assertIn("/media/articles/", response.data["image"])
        self.assertTrue(response.data["image"].endswith(".jpg"))

    def test_create_article_with_png_file_upload(self):
        self.client.force_authenticate(user=self.staff_user)
        img_bytes = generate_test_image("PNG")
        uploaded = SimpleUploadedFile(
            "diagram.png", img_bytes, content_type="image/png"
        )

        payload = {
            "title": "PNG Upload Story",
            "summary": "PNG summary.",
            "content": "PNG story content.",
            "category": self.category.id,
            "image_file": uploaded,
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("/media/articles/", response.data["image"])
        self.assertTrue(response.data["image"].endswith(".png"))

    def test_create_article_with_webp_file_upload(self):
        self.client.force_authenticate(user=self.staff_user)
        img_bytes = generate_test_image("WEBP")
        uploaded = SimpleUploadedFile(
            "graphic.webp", img_bytes, content_type="image/webp"
        )

        payload = {
            "title": "WebP Upload Story",
            "summary": "WebP summary.",
            "content": "WebP story content.",
            "category": self.category.id,
            "image_file": uploaded,
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("/media/articles/", response.data["image"])
        self.assertTrue(response.data["image"].endswith(".webp"))

    def test_upload_invalid_non_image_file_rejected(self):
        self.client.force_authenticate(user=self.staff_user)
        fake_file = SimpleUploadedFile(
            "script.txt", b"plain text content", content_type="text/plain"
        )

        payload = {
            "title": "Invalid File Story",
            "summary": "Summary text.",
            "content": "Story content.",
            "category": self.category.id,
            "image_file": fake_file,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image_file", response.data)

    def test_upload_corrupted_image_file_rejected(self):
        self.client.force_authenticate(user=self.staff_user)
        corrupted = SimpleUploadedFile(
            "corrupt.jpg", b"fake binary data not an image", content_type="image/jpeg"
        )

        payload = {
            "title": "Corrupt Image Story",
            "summary": "Summary text.",
            "content": "Story content.",
            "category": self.category.id,
            "image_file": corrupted,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image_file", response.data)

    def test_upload_file_exceeding_size_limit_rejected(self):
        self.client.force_authenticate(user=self.staff_user)
        # Create a file that claims to be 6MB (exceeds 5MB limit)
        oversized = SimpleUploadedFile(
            "huge.jpg", b"0" * (6 * 1024 * 1024), content_type="image/jpeg"
        )

        payload = {
            "title": "Oversized Image Story",
            "summary": "Summary text.",
            "content": "Story content.",
            "category": self.category.id,
            "image_file": oversized,
        }
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image_file", response.data)
        self.assertIn("5MB", str(response.data["image_file"]))

    def test_update_article_with_new_uploaded_file(self):
        self.client.force_authenticate(user=self.staff_user)
        article = Article.objects.create(
            title="Update Target",
            slug="update-target",
            summary="Initial summary.",
            content="Initial content.",
            category=self.category,
            author=self.staff_user,
            image="https://example.com/initial.jpg",
            is_published=True,
        )
        manage_url = reverse("article-manage", kwargs={"slug": article.slug})

        new_img = SimpleUploadedFile(
            "new.png", generate_test_image("PNG"), content_type="image/png"
        )
        response = self.client.patch(
            manage_url, {"image_file": new_img}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertTrue(bool(article.image_file))
        self.assertIn("/media/articles/", response.data["image"])

    def test_unauthorized_users_cannot_upload_article_images(self):
        img_bytes = generate_test_image("JPEG")
        uploaded = SimpleUploadedFile(
            "unauth.jpg", img_bytes, content_type="image/jpeg"
        )
        payload = {
            "title": "Unauthorized Upload",
            "summary": "Summary.",
            "content": "Content.",
            "category": self.category.id,
            "image_file": uploaded,
        }

        # Anonymous user
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.create_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_article_api_returns_usable_image_url(self):
        img_bytes = generate_test_image("JPEG")
        article = Article.objects.create(
            title="Public Story with Uploaded Image",
            slug="public-uploaded-story",
            summary="Public summary.",
            content="Public content.",
            category=self.category,
            author=self.staff_user,
            is_published=True,
        )
        article.image_file.save("banner.jpg", io.BytesIO(img_bytes), save=True)

        detail_url = reverse("article-detail", kwargs={"slug": article.slug})
        # Anonymous client GET
        self.client.logout()
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify image is a usable URL pointing to media
        self.assertIn("/media/articles/", response.data["image"])

    def test_create_article_without_image_succeeds_and_returns_empty_image(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "title": "Story Without Any Image",
            "summary": "This article deliberately has no image.",
            "content": "Full story content without image attachment.",
            "category": self.category.id,
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("image"), "")
        self.assertIsNone(response.data.get("image_file"))

        article = Article.objects.get(slug=response.data["slug"])
        self.assertEqual(article.image, "")
        self.assertFalse(bool(article.image_file))

    def test_create_article_with_image_url(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "title": "Story With Image URL",
            "summary": "This article has an online image URL.",
            "content": "Full story content with online image URL.",
            "category": self.category.id,
            "image": "https://example.com/photos/story.jpg",
            "is_published": True,
        }
        response = self.client.post(self.create_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("image"), "https://example.com/photos/story.jpg")

    def test_clear_existing_image_and_uploaded_file(self):
        self.client.force_authenticate(user=self.staff_user)
        img_bytes = generate_test_image("PNG")
        article = Article.objects.create(
            title="Story To Clear Image",
            slug="story-to-clear-image",
            summary="Summary.",
            content="Content.",
            category=self.category,
            author=self.staff_user,
            is_published=True,
        )
        article.image_file.save("removable.png", io.BytesIO(img_bytes), save=True)
        self.assertTrue(bool(article.image_file))

        manage_url = reverse("article-manage", kwargs={"slug": article.slug})
        response = self.client.patch(manage_url, {"image": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("image"), "")

        article.refresh_from_db()
        self.assertEqual(article.image, "")
        self.assertFalse(bool(article.image_file))

