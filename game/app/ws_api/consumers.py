from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ValidationError
import json
from game.models import Game
import requests

class SearchOpponentConsumer(AsyncWebsocketConsumer):
  
  async def connect(self):
    cookies = self.scope['headers']

    # Les en-têtes (et donc les cookies) sont encodés en bytes, donc vous devez les décoder
    cookies = dict(
        (key.decode('ascii'), value.decode('ascii')) for key, value in cookies if key.decode('ascii') == 'cookie'
    )

    # Les cookies sont maintenant une chaîne de caractères, vous devez donc trouver le cookie 'sessionid'
    cookies_str = cookies.get('cookie', '')
    sessionid = None
    for cookie in cookies_str.split(';'):
        if 'sessionid' in cookie:
            sessionid = cookie.split('=')[1].strip()
            break

    if sessionid:
        print(f"Session ID trouvé : {sessionid}")
        # Vous pouvez maintenant utiliser sessionid pour vos logiques de validation, etc.
    else:
        print("Session ID non trouvé")

    update_url = f"http://authentification:8001/accounts/verif_sessionid/{sessionid}"
    response = requests.get(update_url)
    print(response)
    if response.status_code != 200:
      raise ValidationError('wrong session ID')

    self.user_id = self.scope['url_route']['kwargs']['user_id']
    
    if not self.user_id:
      await self.close()
      return

    # todo: check if user is authenticated
    await self.accept()
    self.opponent_found = False
    await self.channel_layer.group_add("searching_players", self.channel_name)
    await self.search_opponent()

  async def disconnect(self, close_code):
    if self.opponent_found:
      return

    await self.channel_layer.group_discard("searching_players", self.channel_name)

  async def search_opponent(self):
    if self.opponent_found:
      return

    # Broadcast a message to the group asking if anyone is available
    await self.channel_layer.group_send(
      "searching_players",
      {
        'type': 'matchmaking',
        'channel_name': self.channel_name,
        'user_id': self.user_id
      }
    )

  async def matchmaking(self, event):
    if self.opponent_found or event['user_id'] == self.user_id:
      return
    
    self.opponent_found = True
    
    # Remove both players from the 'searching' group
    await self.channel_layer.group_discard("searching_players", self.channel_name)
    await self.channel_layer.group_discard("searching_players", event['channel_name'])

    # create a new game
    player1_id = self.user_id
    player2_id = event['user_id']

    game_id = await database_sync_to_async(self.create_game)(player1_id, player2_id)
    if game_id is None:
      await self.channel_layer.send(event['channel_name'], {
        'type': 'opponent.error',
        'message': 'An error occurred while creating the game'
      })
      await self.send(text_data=json.dumps({
        'type': 'error',
        'message': 'An error occurred while creating the game'
      }))
    else:
      # Notify players
      await self.channel_layer.send(event['channel_name'], {
        'type': 'opponent.success',
        'game_id': game_id,
        'player1_id': player1_id,
        'player2_id': player2_id,
      })
      await self.send(text_data=json.dumps({
        'game_id': game_id,
        'player1_id': player1_id,
        'player2_id': player2_id,
      }))

  async def opponent_success(self, event):
    await self.send(text_data=json.dumps({
      'game_id': event.get('game_id'),
      'player1_id': event.get('player1_id'),
      'player2_id': event.get('player2_id'),
    }))

  async def opponent_error(self, event):
    await self.send(text_data=json.dumps({
      'type': 'error',
      'message': event.get('message')
    }))

  def create_game(self, player1_id, player2_id):
    try:
      game = Game(player1_id=player1_id, player2_id=player2_id)
      game.save()
      return game.get_id()
    except ValidationError as e:
      return None
    except Exception as e:
      return None