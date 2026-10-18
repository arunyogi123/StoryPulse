from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser

from news.models import Article
from .serializers import ArticleSerializer


# List published articles for public users; authenticated staff can retrieve all articles or filter by status
class ArticleListAPIView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            status_param = self.request.query_params.get("status")
            if status_param == "published":
                qs = Article.objects.filter(is_published=True).select_related("category", "author")
            elif status_param == "draft":
                qs = Article.objects.filter(is_published=False).select_related("category", "author")
            else:
                qs = Article.objects.all().select_related("category", "author")
        else:
            qs = Article.objects.filter(is_published=True).select_related("category", "author")

        category_param = self.request.query_params.get("category")
        if category_param:
            if category_param.isdigit():
                qs = qs.filter(category_id=int(category_param))
            else:
                qs = qs.filter(category__slug=category_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search_param)
                | Q(summary__icontains=search_param)
                | Q(content__icontains=search_param)
            )

        return qs


# Retrieve one published article using its slug
class ArticleDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    queryset = Article.objects.filter(is_published=True)


# Allow staff users to create articles
class ArticleCreateAPIView(generics.CreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Automatically assign the logged-in staff user as the author
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# Allow staff users to update or delete articles
class ArticleManageAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "slug"
