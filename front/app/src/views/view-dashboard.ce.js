import './view-sidebar.ce.js';
import { redirectTo } from '../router.js';

class ViewDash extends HTMLElement {
  connectedCallback() {
    // const username = window.user ? window.user.username : null;
    const username = localStorage.getItem('username');
    console.log(username);
    if(!username){
      alert('errors');
      redirectTo("/");
      return;
    }
    this.innerHTML = `
      <style>
        .dashboard-text {
          margin-left: 300px;
          text-align: center;
          margin-top: 100px; /* Ajustez la valeur selon vos besoins */
          font-size: 72px;
        }
        

        #supp {
          position: absolute;
          bottom: 0;
          right: 0;
          margin: 20px; /* Ajoutez une marge pour éviter que le texte ne soit collé aux bords */
        }

        .big-button-play {
          display: flex;
          justify-content: center; /* Centrer horizontalement */
          align-items: center; /* Centrer verticalement */
          margin-bottom: 300px; /* Ajustez la valeur selon vos besoins */
          margin-left: 100px;
          height: 100vh; /* Pour occuper toute la hauteur de la fenêtre */
        }
      
        .play-now-btn_play {
          font-size: 36px; /* Taille de police très grande */
        } 

        .custom-btn {
          font-size: 48px; /* Augmenter la taille de la police */
          padding: 20px 40px; /* Augmenter le rembourrage pour agrandir la zone cliquable */
        }
      </style>
      <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
      </head>
      <div class="layout">
        <view-sidebar class="layout-sidebar"></view-sidebar>
        <div class="dashboard-content">
          <div class="dashboard-text">
              <h1>TRANSCENDANCE PONG</h1>
          </div>
          <h2>Bienvenue, ${username}</h2>
          <div class="big-button-play">
            <button type="button" class="btn btn-outline-light btn-lg">Play Now</button>
          </div>
        </div>
        <div id="supp">
          <a href="#" id="delete-account-link">
            <h3> supprimer le compte</h3>
          </a>
        </div>
      </div>
    `;
    this.querySelector('#delete-account-link').addEventListener('click', (event) => {
      event.preventDefault();
      this.suppUser(username);
    });
  }
  suppUser(username) {
    const url = `http://127.0.0.1:8001/accounts/delete_user/${username}`;
    fetch(url, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    .then(response => response.json())
    .then(data => {
      if(data.success) {
        // window.user = null;
        localStorage.removeItem('username');
        redirectTo("/");
      }
    })
    .catch(error => console.error('Error:', error));
  }
}

customElements.define('view-dash', ViewDash);