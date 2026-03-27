from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task, Submission
from .serializers import TaskSerializer, SubmissionSerializer
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
import google.generativeai as genai
import os
import json

genai.configure(api_key=os.environ.get('GEMINI_API_KEY', ''))

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'Admin'

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    serializer_class = TaskSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return Task.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        if self.request.user.role == 'Admin':
            return Submission.objects.all().order_by('-submitted_at')
        return Submission.objects.filter(user=self.request.user).order_by('-submitted_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['put'], permission_classes=[IsAdminOrReadOnly])
    def review(self, request, pk=None):
        submission = self.get_object()
        status = request.data.get('status')
        if status in ['Pending', 'Submitted', 'Reviewed']:
            submission.status = status
            submission.save()
            return Response({'status': 'Status updated'})
        return Response({'error': 'Invalid status'}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def evaluate(self, request, pk=None):
        submission = self.get_object()
        task = submission.task
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return Response({'error': 'Gemini API Key not configured in environment variables.'}, status=500)
            
        prompt = f"""
        You are an expert Talent Evaluator AI.
        Evaluate this user's submission against the task instructions.
        
        TASK TITLE: {task.title}
        TASK DESCRIPTION: {task.description}
        
        USER SUBMISSION CONTENT:
        {submission.content}
        
        Provide a JSON response strictly exactly matching this format with no markdown wrappers:
        {{
            "score": 85,
            "feedback": "Detailed constructive feedback here...",
            "recommended_status": "Reviewed"
        }}
        """
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            cleaned_json = response.text.replace('```json', '').replace('```', '').strip()
            return Response({'ai_evaluation': json.loads(cleaned_json)})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role == 'Admin':
            total_tasks = Task.objects.count()
            completed_tasks = Submission.objects.filter(status='Reviewed').count()
            pending_tasks = Submission.objects.filter(status='Submitted').count()
        else:
            total_tasks = Task.objects.count()
            completed_tasks = Submission.objects.filter(user=request.user, status='Reviewed').count()
            pending_tasks = Submission.objects.filter(user=request.user, status='Submitted').count()
            
        completion_rate = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        
        return Response({
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'completion_rate': completion_rate
        })
