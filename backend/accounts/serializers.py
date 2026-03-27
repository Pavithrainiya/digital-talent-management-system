import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'username', 'password', 'role')

    def validate_name(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Name must be at least 8 characters.")
        return value

    def validate_username(self, value):
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", value):
            raise serializers.ValidationError("Username must include a special character.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'User')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'bio', 'skills', 'phone_number', 'experience', 'resume')
