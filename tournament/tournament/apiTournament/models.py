from django.db import models
from django.db.models import Count

# Create your models here.
class Tournoi(models.Model):
    CREATED = 0
    IN_PROGRESS = 1
    FINISHED = 2

    name = models.CharField(max_length=100)
    # matchs = models.ManyToManyField(Match)
    status = models.IntegerField(default=CREATED)
    max_players = models.IntegerField(default=16, blank=True)
    start_datetime = models.DateTimeField(null=True)
    admin_id = models.BigIntegerField(default=0)

class Joueur(models.Model):
    NOT_READY = 0
    READY = 1

    username = models.CharField(max_length=100)
    user_id = models.IntegerField()
    tournament = models.ForeignKey(Tournoi, on_delete=models.SET_NULL, related_name='players', null=True)
    status_ready = models.IntegerField(default=NOT_READY)

class Match(models.Model):
    NOT_PLAYED = 0
    IN_PROGRESS = 1
    FINISHED = 2
    NOT_LEAVE = 0
    # P1_LEAVE = 1
    # P2_LEAVE = 2
    
    player_1 = models.ForeignKey(Joueur, related_name='player_1', on_delete=models.CASCADE, null=True)
    player_1_score = models.IntegerField(null=True)
    player_2 = models.ForeignKey(Joueur, related_name='player_2', on_delete=models.CASCADE, null=True)
    player_2_score = models.IntegerField(null=True)
    winner = models.ForeignKey(Joueur, related_name='won_games', on_delete=models.SET_NULL, null=True, blank=True)
    tour = models.IntegerField(default=1)  # Pour suivre le tour du match dans le tourno
    status = models.IntegerField(default=NOT_PLAYED)
    leave = models.IntegerField(default=NOT_LEAVE)
    tournament = models.ForeignKey(Tournoi, on_delete=models.CASCADE, related_name='matches', null=True)  # Ajout de la relation avec le modèle Tournoi
    match_id = models.IntegerField(default=1)
    game_id = models.IntegerField(null=True, blank=True)
