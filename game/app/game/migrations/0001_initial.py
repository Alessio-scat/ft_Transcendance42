# Generated by Django 4.2.9 on 2024-05-21 12:04

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player_left_id', models.CharField(max_length=255)),
                ('player_left_score', models.IntegerField(default=0)),
                ('player_left_connected', models.BooleanField(default=False)),
                ('player_left_forfeit', models.BooleanField(default=False)),
                ('player_right_id', models.CharField(max_length=255)),
                ('player_right_score', models.IntegerField(default=0)),
                ('player_right_connected', models.BooleanField(default=False)),
                ('player_right_forfeit', models.BooleanField(default=False)),
                ('match_id', models.CharField(blank=True, max_length=255, null=True)),
                ('status', models.CharField(choices=[('WAITING', 'Waiting'), ('RUNNING', 'Running'), ('FINISHED', 'Finished'), ('ABORTED', 'Aborted')], default='WAITING', max_length=20)),
                ('winner_id', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ended_at', models.DateTimeField(blank=True, null=True)),
            ],
        ),
    ]
