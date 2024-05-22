# Generated by Django 4.2.10 on 2024-05-21 12:04

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.IntegerField(null=True)),
                ('firstName', models.CharField(max_length=100, null=True, verbose_name='First Name')),
                ('lastName', models.CharField(max_length=100, null=True, verbose_name='Last Name')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('avatar42', models.CharField(max_length=100, null=True, verbose_name='url42')),
            ],
        ),
    ]
