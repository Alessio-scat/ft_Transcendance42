import { user } from '@/auth.js';
import { getProfile } from '@/auth.js';
import { getTournament, resetLocalTournament, fetchDeletePlayerSalon, fetchAddPlayer, fetchDeleteTournament } from '@/tournament.js';
import { isAuthenticated, getCsrfToken } from '@/auth.js';
import '@/components/layouts/auth-layout/auth-layout.ce.js';
import { redirectTo } from '../router';
import { BASE_URL, WS_BASE_URL } from '@/constants.js';

class ViewTournamentSalon extends HTMLElement {
  #user;
  #tournament;
  #backUrl = '/'; // Définissez ici l'URL de redirection par défaut

  constructor() {
    super();
    this.#user = getProfile();
    this.#tournament = getTournament();
  }
  
  async connectedCallback() {
    const isLoggedIn = await isAuthenticated();
    // Modifiez l'URL de redirection en fonction de l'état de connexion
    this.#backUrl = isLoggedIn ? '/game/tournament' : '/';
    if(this.#tournament.id === null)
      redirectTo(this.#backUrl);

    let deleteTournamentButtonHTML = '';
    if (this.#user.id === this.#tournament.admin_id) {
        // Si l'utilisateur actuel est l'administrateur du tournoi, ajouter le HTML du bouton de suppression
        deleteTournamentButtonHTML = `<button id="deleteTournamentBtn" class="btn btn-warning">Delete Tournament</button>`;
    }

    this.innerHTML = `
      <div class="min-vh-100 halo-bicolor d-flex flex-column p-2">
        <div class="d-flex justify-content-between align-items-center mb-5">
          <h1 class="fw-bold text-center m-0">Waiting room for ${this.#tournament.name} Tournament</h1>
          <div>
            <button id="leaveTournamentBtn" class="btn btn-danger">Leave Tournament</button>
            ${deleteTournamentButtonHTML}  <!-- Ajout du bouton de suppression si applicable -->
          </div>
        </div>
        <div id="playersList" class="mt-4"></div>
      </div>
    `;

    // Ajout d'un écouteur d'événements pour le bouton de sortie
    this.querySelector('#leaveTournamentBtn').addEventListener('click', () => {
      resetLocalTournament();
      this.deletePlayer();
      redirectTo(this.#backUrl);
    });

    const deleteBtn = this.querySelector('#deleteTournamentBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {

            this.deleteTournament();
        });
    }

    await this.initWebSocket();
    // this.addPlayer();
  }

  disconnectedCallback() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  async addPlayer() {
    const formData = {
      user_id: this.#user.id,
      username: this.#user.username,
      tournament_id: this.#tournament.id,
    };
    const data = await fetchAddPlayer(formData);
    if (data.success === false) {
      this.viewPlayer();
    }
  }
  
  async deletePlayer() {
    const data = await fetchDeletePlayerSalon();
  }
  
  async deleteTournament() {
    const data = await fetchDeleteTournament();
    if (data.success) {
      resetLocalTournament();
      redirectTo(this.#backUrl);
    } else {
      console.log("error");
    }
  }

  async viewPlayer() {
    try {
        const response = await fetch(`${BASE_URL}:8005/tournament/get_player/${this.#tournament.id}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const players = await response.json();
        const listElement = this.querySelector('#playersList');
        listElement.innerHTML = '<h2>Players in the Tournaments</h2><br>'; // Titre pour la section

        for (const player of players) {
            const csrfToken = await getCsrfToken();
            const userProfileResponse = await fetch(`${BASE_URL}:8002/get_user_profile/${player.user_id}/`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
            });

            if (!userProfileResponse.ok) {
                throw new Error(`HTTP error! status: ${userProfileResponse.status}`);
            }

            const user = await userProfileResponse.json();
            let avatar = "/assets/img/default-profile.jpg";
            if(user.avatar42 !== null && user.avatar42 !== undefined)
              avatar = user.avatar42;
            if (user.avatar !== null && user.avatar !== undefined)
              avatar = user.avatar;
            const playerElement = document.createElement('div');
            playerElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; flex-direction: column;">
                        <h3>${player.username}</h3> 
                        <img
                          src="${avatar}" 
                          class="d-block object-fit-cover rounded-circle m-n1"
                          width="28"
                          height="28"
                        />
                    </div>
                </div>
                <hr style="border-top: 1px solid #ccc; margin: 10px 0;">
            `;
            listElement.appendChild(playerElement);
        }

        // Calculer le nombre de joueurs en attente
        const nbPlayersWaiting = this.#tournament.maxPlayer - players.length;
        const waitingElement = document.createElement('div');
        waitingElement.innerHTML = `<h3>${nbPlayersWaiting} player(s) waiting</h3>`;
        listElement.appendChild(waitingElement);

    } catch (error) {
        console.error('Could not load tournament:', error);
    }
}


  initWebSocket() {
    // Assurez-vous que l'URL correspond à votre serveur WebSocket.
    this.socket = new WebSocket(WS_BASE_URL + ':8005/tournament/websocket/');

    this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.socket.send(JSON.stringify({tournoi_id: this.#tournament.id}));
        this.socket.send(JSON.stringify({user_id: this.#user.id}));
        this.addPlayer();
    };

    this.socket.onmessage = (event) => {
        // Logique pour gérer les messages entrants.
        const data = JSON.parse(event.data);

        if (data.action === 'add_Player') {
            this.viewPlayer();
        }
        if (data.action === 'disconnect') {
          socket.close();
        }
        if (data.action === 'delete_tournament') {
          resetLocalTournament();
          this.deletePlayer();
          redirectTo(this.#backUrl);
          this.socket.close();
        }
        if (data.action === 'display_player') {
          this.viewPlayer();
        }
        if (data.action === 'player_disconnected') {
          resetLocalTournament();
          this.deletePlayer();
          this.socket.close();
        }
    };

    this.socket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    window.addEventListener('beforeunload', () => {
      this.socket.close();
    });

  }
}

customElements.define('view-game-tournament-salon', ViewTournamentSalon);

