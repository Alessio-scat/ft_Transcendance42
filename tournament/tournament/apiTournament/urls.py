from django.urls import path
from . import views

app_name = "tournament"

urlpatterns = [
    path('create_tournament/', views.create_tournament, name='create_tournament'),
    path('view/', views.view, name='view'),
    path('get/<int:tournament_id>/', views.tournament_detail, name='tournament_detail'),
    path('create_joueur/', views.create_joueur, name='create_joueur'),
    path('get_player/<int:tournament_id>/', views.view_joueur, name='view_joueur'),
    path('delete_joueur/<int:user_id>/', views.delete_joueur, name='delete_joueur'),
    path('tournoi_info/<int:user_id>/', views.tournoi_info, name='tournoi_info'),
    path('delete_tournment/<int:tournoi_id>/', views.delete_tournoi, name='delete_tournoi'),
    path('create_matches/<int:tournament_id>/', views.create_matches, name='create_matches'),
    path('get_matches/<int:tournament_id>/', views.get_matches, name='get_matches'),
    path('ready/<int:player_id>/<int:match_id>/', views.set_player_ready, name='set_player_ready'),
    path('get_latest_match_for_user/<int:user_id>/<int:tournament_id>', views.get_latest_match_for_user, name='get_latest_match_for_user'),
    path('update_winner/<int:match_id>/<int:winner_id>/<int:score1>/<int:score2>/', views.update_winner_and_prepare_next_match, name='update_winner_and_prepare_next_match'),
    path('delete_player/<int:player_id>/', views.delete_player_and_tournament_if_empty, name='delete_player'),
    path('update_leave/<int:match_id>/<int:player>/', views.update_leave, name='update_leave'),
]
