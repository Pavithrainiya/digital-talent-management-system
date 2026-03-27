from rest_framework import serializers
from .models import Task, Submission
from accounts.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')

class SubmissionSerializer(serializers.ModelSerializer):
    task_details = TaskSerializer(source='task', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ('user', 'task', 'submitted_at')
