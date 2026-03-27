from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'username', 'name', 'role', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Info', {'fields': ('name', 'role')}),
    )

admin.site.register(User, CustomUserAdmin)
