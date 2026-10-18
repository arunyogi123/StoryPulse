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
                return Article.objects.filter(is_published=True).select_related("category", "author")
            if status_param == "draft":
                return Article.objects.filter(is_published=False).select_related("category", "author")
            return Article.objects.all().select_related("category", "author")

        return Article.objects.filter(is_published=True).select_related("category", "author")


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
