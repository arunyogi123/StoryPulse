import os
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from PIL import Image

from news.models import Article


class ValidatedImageField(serializers.ImageField):
    def to_internal_value(self, data):
        max_size = 5 * 1024 * 1024  # 5MB
        if hasattr(data, "size") and data.size > max_size:
            raise serializers.ValidationError(
                f"Image file size ({data.size / (1024 * 1024):.1f}MB) exceeds the maximum limit of 5MB."
            )
        ext = os.path.splitext(getattr(data, "name", ""))[1].lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        if ext and ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: JPEG, PNG, WebP."
            )
        return super().to_internal_value(data)


class ArticleSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        required=False,
        max_length=280,
        validators=[UniqueValidator(queryset=Article.objects.all())],
    )

    # Display the category name instead of only its database ID
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    # Display the author's username
    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    image = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    image_file = ValidatedImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "category",
            "category_name",
            "author",
            "author_username",
            "image",
            "image_file",
            "is_featured",
            "is_published",
            "created_at",
            "updated_at",
        ]

        # These fields are generated automatically or assigned by the backend
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]

    def validate_image(self, value):
        if not value or not value.strip():
            return ""
        val = value.strip()
        validator = URLValidator(schemes=["http", "https"])
        try:
            validator(val)
        except DjangoValidationError:
            raise serializers.ValidationError(
                "Enter a valid publicly accessible image URL (starting with http:// or https://)."
            )
        return val

    def validate_image_file(self, value):
        if not value:
            return value

        # File size validation: max 5MB (5 * 1024 * 1024 bytes)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f"Image file size ({value.size / (1024 * 1024):.1f}MB) exceeds the maximum limit of 5MB."
            )

        # File extension validation
        ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: JPEG, PNG, WebP."
            )

        # Verify image format and integrity with Pillow
        try:
            img = Image.open(value)
            fmt = img.format.upper() if img.format else ""
            if fmt not in {"JPEG", "PNG", "WEBP"}:
                raise serializers.ValidationError(
                    f"Unsupported image format '{fmt}'. Allowed formats: JPEG, PNG, WebP."
                )
            img.verify()
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError(
                "Upload a valid image. The file you submitted is either corrupted or not an image."
            )
        finally:
            if hasattr(value, "seek"):
                value.seek(0)

        return value

    def validate(self, attrs):
        slug = attrs.get("slug")
        if not slug or not slug.strip():
            # If updating an existing instance without changing slug, preserve current slug
            if self.instance and self.instance.slug:
                attrs["slug"] = self.instance.slug
            else:
                title = attrs.get("title", "")
                base_slug = slugify(title) or "article"
                candidate_slug = base_slug
                counter = 1
                qs = Article.objects.all()
                if self.instance and self.instance.pk:
                    qs = qs.exclude(pk=self.instance.pk)
                while qs.filter(slug=candidate_slug).exists():
                    candidate_slug = f"{base_slug}-{counter}"
                    counter += 1
                attrs["slug"] = candidate_slug

        # If an uploaded image file is provided, clear manual image url to avoid conflict
        if attrs.get("image_file"):
            attrs["image"] = ""

        return super().validate(attrs)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        if instance.image_file:
            try:
                url = instance.image_file.url
                if request:
                    ret["image"] = request.build_absolute_uri(url)
                else:
                    ret["image"] = url
            except Exception:
                pass
        return ret
