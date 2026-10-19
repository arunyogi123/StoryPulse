from rest_framework import serializers

from bookmarks.models import Bookmark
from news.models import Article


class BookmarkedArticleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "category_name",
            "author_username",
            "image",
            "created_at",
        ]
        read_only_fields = fields

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


class BookmarkSerializer(serializers.ModelSerializer):
    article = BookmarkedArticleSerializer(read_only=True)
    article_id = serializers.PrimaryKeyRelatedField(
        source="article",
        queryset=Article.objects.filter(is_published=True),
        write_only=True,
    )

    class Meta:
        model = Bookmark
        fields = [
            "id",
            "article",
            "article_id",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_article_id(self, article):
        user = self.context["request"].user

        if Bookmark.objects.filter(
            user=user,
            article=article,
        ).exists():
            raise serializers.ValidationError(
                "You have already bookmarked this article."
            )

        return article
