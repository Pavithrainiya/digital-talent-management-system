from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
