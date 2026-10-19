from django.urls import path

from .views import (
    BookmarkListCreateAPIView,
    BookmarkDestroyAPIView,
    BookmarkArticleDestroyAPIView,
)

urlpatterns = [
    path(
        "",
        BookmarkListCreateAPIView.as_view(),
        name="bookmark-list-create",
    ),
    path(
        "<int:bookmark_id>/",
        BookmarkDestroyAPIView.as_view(),
        name="bookmark-delete",
    ),
    path(
        "article/<int:article_id>/",
        BookmarkArticleDestroyAPIView.as_view(),
        name="bookmark-delete-by-article",
    ),
]
