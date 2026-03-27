from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task, Submission
from .serializers import TaskSerializer, SubmissionSerializer

class AdminOnlyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [AdminOnlyPermission()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.role == 'Admin':
            return Task.objects.all().order_by('-created_at')
        return Task.objects.all().order_by('-deadline')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'Admin':
            return Submission.objects.all().order_by('-submitted_at')
        return Submission.objects.filter(user=self.request.user).order_by('-submitted_at')

    def create(self, request, *args, **kwargs):
        task_id = request.data.get('task')
        content = request.data.get('content')
        if not task_id:
            return Response({"error": "Task ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        submission, created = Submission.objects.get_or_create(
            task=task,
            user=request.user,
            defaults={'content': content, 'status': 'Submitted'}
        )
        if not created:
            submission.content = content
            submission.status = 'Submitted'
            submission.save()

        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'], permission_classes=[AdminOnlyPermission])
    def review(self, request, pk=None):
        submission = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Submission.STATUS_CHOICES):
            submission.status = new_status
            submission.save()
            return Response(self.get_serializer(submission).data)
        return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role == 'Admin':
            total_tasks = Task.objects.count()
            total_subs = Submission.objects.count()
            completed = Submission.objects.filter(status='Reviewed').count()
            pending = total_subs - completed
            rate = (completed / total_subs * 100) if total_subs > 0 else 0
            return Response({
                "total_tasks": total_tasks,
                "completed_tasks": completed,
                "pending_tasks": pending,
                "completion_rate": round(rate, 2)
            })
        else:
            total_assigned = Task.objects.count()
            my_subs = Submission.objects.filter(user=request.user).count()
            completed = Submission.objects.filter(user=request.user, status='Reviewed').count()
            rate = (completed / total_assigned * 100) if total_assigned > 0 else 0
            return Response({
                "total_tasks": total_assigned,
                "completed_tasks": completed,
                "pending_tasks": total_assigned - completed,
                "completion_rate": round(rate, 2)
            })
