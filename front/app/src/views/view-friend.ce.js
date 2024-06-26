import '@/components/layouts/default-layout/default-layout-sidebar.ce.js';
import '@/components/layouts/default-layout/default-layout-main.ce.js';
import { user, getCsrfToken } from '@/auth.js';
import { showModal } from '@/modal.js';
import { BASE_URL, WS_BASE_URL } from '@/constants.js';

class ViewFriend extends HTMLElement {
  connectedCallback() {
    this.wsUrl = `${WS_BASE_URL}:8003/ws/invitations/${user.id}/`;
    this.wsInstance = new WebSocket(this.wsUrl);
    this.innerHTML = `
    <default-layout-sidebar></default-layout-sidebar>
    <default-layout-main>
      <h1 class="display-5 fw-bold mb-4 text-center mt-md-n5 mt-0">Friends</h1> 
    
      <!-- Nav tabs -->
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a class="nav-link active" href="#myfriends" data-bs-toggle="tab">My friends</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#invitations" data-bs-toggle="tab">Invitations received</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#addfriends" data-bs-toggle="tab">Add friends</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#sentInvitations" data-bs-toggle="tab">Invitations Sent</a>
        </li>
      </ul>
    
      <!-- Tab panes -->
      <div class="tab-content">
          <div class="tab-pane container active" id="myfriends">
            <section>
              <h2>Online</h2>
              <ul id="online-friends" class="list-group">
                <!-- Online friends will be dynamically added here -->
              </ul>
            </section>
            <section>
              <h2>Offline</h2>
              <ul id="offline-friends" class="list-group">
                <!-- Offline friends will be dynamically added here -->
              </ul>
            </section>
        </div>

        <div class="tab-pane container fade" id="invitations">
          <div class="mt-4">
            <h2>Friend Requests</h2>
            <ul id="friend-requests" class="list-group">
              <!-- Friend requests will be dynamically added here -->
            </ul>
          </div>
          <!-- Invitations will be dynamically added here -->
        </div>

        <div class="tab-pane container fade" id="sentInvitations">
          <div class="mt-4">
            <h2>Sent Invitations</h2>
            <ul id="sent-invitations-list" class="list-group">
              <!-- Les invitations envoyées seront dynamiquement ajoutées ici -->
            </ul>
          </div>
        </div>
        
        <div class="tab-pane container fade" id="addfriends">
          <form class="input-group mb-3 mt-3">
            <input type="text" class="form-control" placeholder="Type a username" id="search-friend-name" required>
            <button class="btn btn-outline-secondary" type="button" id="search">Search</button>
          </form>
          <div class="list-group" id="search-results">
            <!-- Search results will be dynamically added here -->
          </div>
          <div id="error-messages"></div>
        </div>
      </div>
    </default-layout-main>
    `;

    this.initInvitationsWebSocket();

    this.loadSentInvitations();
    this.loadFriendRequests();
    this.loadOnlineFriends();
    this.loadOfflineFriends();
    this.querySelector('#search').addEventListener('click', this.searchFriends.bind(this));
  }

  initInvitationsWebSocket() {
    this.wsInstance.onopen = () => {};

    this.wsInstance.onmessage = event => {
      const data = JSON.parse(event.data);

      if (data.action === 'accept_invitation' || data.action === 'reject_invitation') {
        this.loadOnlineFriends();
        this.loadOfflineFriends();
        this.loadSentInvitations();
        this.loadFriendRequests();
      } else if (data.action === 'cancel_invitation') {
        this.loadSentInvitations();
        this.loadFriendRequests();
      } else if (data.action === 'remove_friend') {
        this.loadOnlineFriends();
        this.loadOfflineFriends();
      }

      if (data.message) {
        this.loadFriendRequests();
        this.loadSentInvitations();
      }
    };

    this.wsInstance.onerror = event => {
      console.error('WebSocket error observed:', event);
    };

    this.wsInstance.onclose = event => {};
  }

  closeWebSocket() {
    if (this.wsInstance) {
      this.wsInstance.close();
    }
  }

  // list send invitation
  async loadSentInvitations() {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${BASE_URL}:8003/list_sent_invitations/${user.id}/`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      const responseData = await response.json();

      const sentInvitationsList = document.getElementById('sent-invitations-list');
      if (!sentInvitationsList) return;
      sentInvitationsList.innerHTML = '';

      if (responseData && responseData.invitations) {
        if (responseData.invitations.length > 0) {
          responseData.invitations.forEach(invitation => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            // create container for avatar, email, username, email
            const userInfoDiv = document.createElement('div');
            userInfoDiv.style.display = 'flex';
            userInfoDiv.style.alignItems = 'center';

            // add avatar
            const avatarImg = document.createElement('img');
            if (!invitation.from_user_avatar) avatarImg.src = '/assets/img/default-profile.jpg';
            else avatarImg.src = invitation.from_user_avatar;
            avatarImg.alt = 'User Avatar';
            avatarImg.style.width = '40px';
            avatarImg.style.height = '40px';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.marginRight = '50px';
            userInfoDiv.appendChild(avatarImg);

            // add username
            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = invitation.from_user_username;
            usernameSpan.style.marginRight = '50px';
            userInfoDiv.appendChild(usernameSpan);

            // add email
            const emailSpan = document.createElement('span');
            emailSpan.textContent = invitation.from_user_email;
            userInfoDiv.appendChild(emailSpan);

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.classList.add('btn', 'btn-warning');
            cancelButton.onclick = () =>
              showModal(
                'Confirm Invitation Deletion',
                'Are you sure you want to delete your invitation ? This action cannot be undone.',
                {
                  okCallback: () => this.cancelSentInvitation(invitation.invitation_id, invitation.from_user_username),
                  cancelCallback: () => {},
                }
              );

            listItem.appendChild(userInfoDiv);
            listItem.appendChild(cancelButton);
            sentInvitationsList.appendChild(listItem);
          });
        } else {
          const noInvitationsItem = document.createElement('li');
          noInvitationsItem.classList.add('list-group-item');
          noInvitationsItem.textContent = 'No sent invitations.';
          sentInvitationsList.appendChild(noInvitationsItem);
        }
      } else {
        console.error('Invalid response format:', responseData);
      }
    } catch (error) {
      console.error('Error fetching sent invitations:', error);
    }
  }

  // cancel invitation send
  async cancelSentInvitation(invitationId, from_user_username) {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${BASE_URL}:8003/cancel_sent_invitation/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ invitation_id: invitationId, username: from_user_username }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        this.loadSentInvitations();
      } else {
        console.error('Failed to cancel the invitation:', data.message);
      }
    } catch (error) {
      console.error('Error cancelling the invitation:', error);
    }
  }

  // list request friends
  async loadFriendRequests() {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${BASE_URL}:8003/list_received_invitations/${user.id}/`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      const responseData = await response.json();

      const friendRequestsList = document.getElementById('friend-requests');
      if (!friendRequestsList) return;
      friendRequestsList.innerHTML = '';

      if (responseData && responseData.invitations) {
        if (responseData.invitations.length > 0) {
          responseData.invitations.forEach(invitation => {
            const listItem = document.createElement('li');
            listItem.id = `invitation-${invitation.invitation_id}`;
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            // Create a container for the avatar, username, and email
            const userInfoDiv = document.createElement('div');
            userInfoDiv.style.display = 'flex';
            userInfoDiv.style.alignItems = 'center';

            // Add the avatar
            const avatarImg = document.createElement('img');
            if (!invitation.from_user_avatar) avatarImg.src = '/assets/img/default-profile.jpg';
            else avatarImg.src = invitation.from_user_avatar;
            avatarImg.alt = 'User Avatar';
            avatarImg.style.width = '40px';
            avatarImg.style.height = '40px';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.marginRight = '50px';
            userInfoDiv.appendChild(avatarImg);

            // Add the username
            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = invitation.from_user_username;
            usernameSpan.style.marginRight = '50px';
            userInfoDiv.appendChild(usernameSpan);

            // Add the email
            const emailSpan = document.createElement('span');
            emailSpan.textContent = invitation.from_user_email;
            userInfoDiv.appendChild(emailSpan);

            // Create the buttons for accept and reject
            const buttonGroup = document.createElement('div');
            buttonGroup.classList.add('btn-group');

            const acceptButton = document.createElement('button');
            acceptButton.textContent = 'Accept';
            acceptButton.classList.add('btn', 'btn-success', 'mx-1');
            acceptButton.onclick = () =>
              this.acceptFriendRequest(invitation.invitation_id, invitation.from_user_username);

            const rejectButton = document.createElement('button');
            rejectButton.textContent = 'Reject';
            rejectButton.classList.add('btn', 'btn-danger', 'mx-1');
            rejectButton.onclick = () =>
              this.rejectFriendRequest(invitation.invitation_id, invitation.from_user_username);

            buttonGroup.appendChild(acceptButton);
            buttonGroup.appendChild(rejectButton);

            // Append everything to the list item
            listItem.appendChild(userInfoDiv);
            listItem.appendChild(buttonGroup);

            friendRequestsList.appendChild(listItem);
          });
        } else {
          const noInvitationsItem = document.createElement('li');
          noInvitationsItem.classList.add('list-group-item');
          noInvitationsItem.textContent = 'No friend requests.';
          friendRequestsList.appendChild(noInvitationsItem);
        }
      } else {
        console.error('Invalid response format:', responseData);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }

  // btn accept
  async acceptFriendRequest(invitationId, from_user_username) {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(BASE_URL + ':8003/accept_invitation/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ invitation_id: invitationId, username: from_user_username }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        document.querySelector(`#invitation-${invitationId}`).remove();
        this.loadOfflineFriends();
        this.loadOnlineFriends();
        this.loadFriendRequests();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // btn reject
  async rejectFriendRequest(invitationId, from_user_username) {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(BASE_URL + ':8003/reject_invitation/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ invitation_id: invitationId, username: from_user_username }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        document.querySelector(`#invitation-${invitationId}`).remove();
        this.loadOfflineFriends();
        this.loadOnlineFriends();
        this.loadFriendRequests();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async searchFriends() {
    const errorMessagesDiv = document.querySelector('#error-messages');
    errorMessagesDiv.innerHTML = '';

    const searchInputField = this.querySelector('#search-friend-name');
    const searchInput = searchInputField.value.trim();

    if (searchInput === '') {
      const searchResultsList = this.querySelector('#search-results');
      searchResultsList.innerHTML = '<li class="list-group-item">Please enter a search username.</li>';
      return;
    }

    const searchResultsList = this.querySelector('#search-results');
    searchResultsList.innerHTML = '';

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(
        `${BASE_URL}:8003/search_users/?query=${encodeURIComponent(searchInput)}&user_id=${encodeURIComponent(
          user.id
        )}`,
        {
          method: 'GET',
          headers: {
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const searchResults = await response.json();

      if (searchResults.length === 0) {
        const noResultsItem = document.createElement('li');
        noResultsItem.classList.add('list-group-item');
        noResultsItem.textContent = 'No users found.';
        searchResultsList.appendChild(noResultsItem);
      } else {
        searchResults.forEach(user => {
          const listItem = document.createElement('li');
          listItem.classList.add('list-group-item');
          listItem.style.display = 'flex';
          listItem.style.justifyContent = 'space-between';
          listItem.style.alignItems = 'center';

          // Create a container for the avatar and username
          const userInfoDiv = document.createElement('div');
          userInfoDiv.style.display = 'flex';
          userInfoDiv.style.alignItems = 'center';

          // Add the user's avatar
          const avatarImg = document.createElement('img');
          if (!user.avatar_url) avatarImg.src = '/assets/img/default-profile.jpg';
          else avatarImg.src = user.avatar_url;
          avatarImg.alt = 'User Avatar';
          avatarImg.style.width = '40px';
          avatarImg.style.height = '40px';
          avatarImg.style.borderRadius = '50%';
          avatarImg.style.marginRight = '50px';
          userInfoDiv.appendChild(avatarImg);

          // Add the user's username
          const textSpan = document.createElement('span');
          textSpan.textContent = user.username;
          textSpan.style.marginRight = '50px';
          userInfoDiv.appendChild(textSpan);

          // Add the user's email
          const emailSpan = document.createElement('span');
          emailSpan.textContent = user.email;
          userInfoDiv.appendChild(emailSpan);

          // Create the friend request button
          const friendRequestButton = document.createElement('button');
          friendRequestButton.textContent = 'Send Friend Request';
          friendRequestButton.classList.add('btn', 'btn-primary');
          friendRequestButton.onclick = () => this.sendFriendRequest(user.username, friendRequestButton);

          // Append everything to the listItem
          listItem.appendChild(userInfoDiv);
          listItem.appendChild(friendRequestButton);
          searchResultsList.appendChild(listItem);
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  //Send Invitation user
  async sendFriendRequest(username, button) {
    const errorMessagesDiv = document.querySelector('#error-messages');
    errorMessagesDiv.innerHTML = '';

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(BASE_URL + ':8003/send_invitation/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ username: username, user_id: user.id }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        button.textContent = 'Friend Request Sent';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        button.disabled = true;
        this.loadSentInvitations();
      } else {
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('alert', 'alert-danger');
        errorMessage.textContent = 'Failed to send friend request: ' + (data.message || 'Unknown error');
        document.querySelector('#error-messages').appendChild(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async loadOnlineFriends() {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${BASE_URL}:8003/online_friends/${user.id}/`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { online_friends } = await response.json();

      const onlineFriendsList = this.querySelector('#online-friends');
      onlineFriendsList.innerHTML = '';

      if (online_friends.length > 0) {
        online_friends.forEach(friend => {
          const listItem = document.createElement('li');
          listItem.classList.add('list-group-item', 'd-flex', 'align-items-center', 'justify-content-between');

          // Avatar
          const avatarImg = document.createElement('img');
          if (!friend.avatar_url) avatarImg.src = '/assets/img/default-profile.jpg';
          else avatarImg.src = friend.avatar_url;
          avatarImg.alt = 'User Avatar';
          avatarImg.style.width = '40px';
          avatarImg.style.height = '40px';
          avatarImg.style.borderRadius = '50%';
          avatarImg.style.marginRight = '50px';
          listItem.appendChild(avatarImg);

          // Username
          const usernameSpan = document.createElement('span');
          usernameSpan.textContent = friend.username;
          usernameSpan.style.marginRight = '50px';
          listItem.appendChild(usernameSpan);

          // Email
          const emailSpan = document.createElement('span');
          emailSpan.textContent = friend.email;
          listItem.appendChild(emailSpan);

          // In-game status as a badge
          const statusBadge = document.createElement('span');
          // statusBadge.classList.add('badge', friend.in_game ? 'badge-success' : 'badge-danger');
          statusBadge.textContent = friend.in_game ? 'In game' : 'Not in game';

          // Set badge styling explicitly
          statusBadge.style.backgroundColor = friend.in_game ? 'green' : 'gray';
          statusBadge.style.color = 'white';
          statusBadge.style.padding = '5px 10px';
          statusBadge.style.borderRadius = '5px';
          statusBadge.style.fontSize = '0.85em';
          listItem.appendChild(statusBadge);

          // Delete friend button
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('btn', 'btn-danger');
          deleteButton.onclick = () =>
            showModal('Confirm User Deletion', 'Are you sure you want to delete user? This action cannot be undone.', {
              okCallback: () => this.confirmDeleteFriend(friend.friend_id),
              cancelCallback: () => {},
            });

          listItem.appendChild(deleteButton);

          onlineFriendsList.appendChild(listItem);
        });
      } else {
        const noOnlineFriends = document.createElement('li');
        noOnlineFriends.classList.add('list-group-item');
        noOnlineFriends.textContent = 'No friends online.';
        onlineFriendsList.appendChild(noOnlineFriends);
      }
    } catch (error) {
      console.error('Error loading online friends:', error);
    }
  }

  async loadOfflineFriends() {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${BASE_URL}:8003/offline_friends/${user.id}/`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { offline_friends } = await response.json();

      const offlineFriendsList = this.querySelector('#offline-friends');
      offlineFriendsList.innerHTML = '';

      if (offline_friends.length > 0) {
        offline_friends.forEach(friend => {
          const listItem = document.createElement('li');
          listItem.classList.add('list-group-item', 'd-flex', 'align-items-center', 'justify-content-between');

          // Avatar
          const avatarImg = document.createElement('img');
          if (!friend.avatar_url) avatarImg.src = '/assets/img/default-profile.jpg';
          else avatarImg.src = friend.avatar_url;
          avatarImg.alt = 'User Avatar';
          avatarImg.style.width = '40px';
          avatarImg.style.height = '40px';
          avatarImg.style.borderRadius = '50%';
          avatarImg.style.marginRight = '50px';
          listItem.appendChild(avatarImg);

          // Username
          const usernameSpan = document.createElement('span');
          usernameSpan.textContent = friend.username;
          usernameSpan.style.marginRight = '50px';
          listItem.appendChild(usernameSpan);

          // Email
          const emailSpan = document.createElement('span');
          emailSpan.textContent = friend.email;
          listItem.appendChild(emailSpan);

          // Delete friend button
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('btn', 'btn-danger');
          deleteButton.onclick = () =>
            showModal('Confirm User Deletion', 'Are you sure you want to delete user? This action cannot be undone.', {
              okCallback: () => this.confirmDeleteFriend(),
              cancelCallback: () => {},
            });

          listItem.appendChild(deleteButton);
          offlineFriendsList.appendChild(listItem);
        });
      } else {
        const noOfflineFriends = document.createElement('li');
        noOfflineFriends.classList.add('list-group-item');
        noOfflineFriends.textContent = 'No friends offline.';
        offlineFriendsList.appendChild(noOfflineFriends);
      }
    } catch (error) {
      console.error('Error loading offline friends:', error);
    }
  }

  // Function to confirm deletion and send delete request
  async confirmDeleteFriend(friendId) {
    try {
      const csrfToken = await getCsrfToken();
      const data = { friend_id: friendId, user_id: user.id };
      const response = await fetch(BASE_URL + ':8003/remove_friend/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        this.loadOfflineFriends();
        this.loadOnlineFriends();
      } else {
        throw new Error("Une erreur est survenue lors de la suppression de l'ami.");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ami:", error);
    }
  }
}

customElements.define('view-friend', ViewFriend);

export const closeViewFriendWebSocket = () => {
  const instance = document.querySelector('view-friend');
  if (instance) {
    instance.closeWebSocket();
  }
};
