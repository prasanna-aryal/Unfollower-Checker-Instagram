// Elements
const refreshBtn = document.getElementById('refreshBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const blockReelsToggle = document.getElementById('blockReels');
const blockExploreToggle = document.getElementById('blockExplore');
const unfollowerList = document.getElementById('unfollowerList');
const unfollowerCount = document.getElementById('unfollowerCount');
const statusDiv = document.getElementById('status');

// Helper function to validate Instagram URLs
function isInstagramUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.instagram.com' || urlObj.hostname === 'instagram.com';
  } catch (e) {
    return false;
  }
}

// Load saved settings
chrome.storage.sync.get(['blockReels', 'blockExplore', 'darkMode'], (result) => {
  blockReelsToggle.checked = result.blockReels || false;
  blockExploreToggle.checked = result.blockExplore || false;
  
  // Apply dark mode if enabled
  if (result.darkMode) {
    document.body.classList.add('dark-mode');
  }
});

// Load unfollowers data
loadUnfollowers();

// Dark mode toggle event listener
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  chrome.storage.sync.set({ darkMode: isDarkMode });
});

// Event listeners
refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Refreshing...';
  statusDiv.className = 'status';
  statusDiv.innerHTML = '<p>Fetching data from Instagram...</p>';
  
  try {
    // Send message to content script to fetch data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!isInstagramUrl(tab.url)) {
      throw new Error('Please navigate to Instagram first');
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'fetchUnfollowers' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: Please refresh the Instagram page and try again', 'error');
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
        return;
      }
      
      if (response && response.success) {
        showStatus('Successfully updated unfollowers list', 'success');
        loadUnfollowers();
      } else {
        showStatus(response?.error || 'Failed to fetch data', 'error');
      }
      
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    });
  } catch (error) {
    showStatus(error.message, 'error');
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh';
  }
});

blockReelsToggle.addEventListener('change', async () => {
  const enabled = blockReelsToggle.checked;
  chrome.storage.sync.set({ blockReels: enabled });
  
  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (isInstagramUrl(tab.url)) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleReels', 
      enabled: enabled 
    });
  }
});

blockExploreToggle.addEventListener('change', async () => {
  const enabled = blockExploreToggle.checked;
  chrome.storage.sync.set({ blockExplore: enabled });
  
  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (isInstagramUrl(tab.url)) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleExplore', 
      enabled: enabled 
    });
  }
});

function loadUnfollowers() {
  chrome.storage.local.get(['unfollowers'], (result) => {
    const unfollowers = result.unfollowers || [];
    unfollowerCount.textContent = unfollowers.length;
    displayUnfollowers(unfollowers);
  });
}

function displayUnfollowers(unfollowers) {
  if (unfollowers.length === 0) {
    unfollowerList.innerHTML = '<div class="status"><p>No unfollowers found. Click "Refresh" to scan.</p></div>';
    return;
  }
  
  // Clear existing content
  unfollowerList.innerHTML = '';
  
  unfollowers.forEach(user => {
    const item = document.createElement('div');
    item.className = 'unfollower-item';
    item.setAttribute('data-user-id', escapeHtml(user.id));
    
    // Create avatar
    const avatar = document.createElement('img');
    avatar.className = 'unfollower-avatar';
    avatar.src = user.profile_pic_url || 'icons/default-avatar.png';
    avatar.alt = escapeHtml(user.username);
    avatar.onerror = function() { this.src = 'icons/default-avatar.png'; };
    
    // Create info container
    const info = document.createElement('div');
    info.className = 'unfollower-info';
    
    // Username container
    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'unfollower-username';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.username;
    usernameDiv.appendChild(usernameSpan);
    
    // Verified badge
    if (user.is_verified) {
      const verifiedBadge = document.createElement('span');
      verifiedBadge.className = 'verified-badge';
      verifiedBadge.innerHTML = `
        <svg aria-label="Verified" fill="rgb(0, 149, 246)" height="12" role="img" viewBox="0 0 40 40" width="12">
          <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fill-rule="evenodd"></path>
        </svg>
      `;
      usernameDiv.appendChild(verifiedBadge);
    }
    
    // Status badges
    const statusDiv = document.createElement('div');
    statusDiv.className = 'unfollower-status';
    
    const followingBadge = document.createElement('span');
    followingBadge.className = 'status-badge following';
    followingBadge.textContent = 'Following';
    
    const privacyBadge = document.createElement('span');
    privacyBadge.className = `status-badge ${user.is_private ? 'private' : 'public'}`;
    privacyBadge.textContent = user.is_private ? 'Private' : 'Public';
    
    statusDiv.appendChild(followingBadge);
    statusDiv.appendChild(privacyBadge);
    
    info.appendChild(usernameDiv);
    info.appendChild(statusDiv);
    
    // Unfollow button
    const unfollowBtn = document.createElement('button');
    unfollowBtn.className = 'unfollow-btn';
    unfollowBtn.textContent = 'Unfollow';
    unfollowBtn.setAttribute('data-username', user.username);
    unfollowBtn.addEventListener('click', async (e) => {
      const username = e.target.dataset.username;
      if (confirm(`Are you sure you want to unfollow @${username}?`)) {
        await unfollowUser(username, e.target);
      }
    });
    
    item.appendChild(avatar);
    item.appendChild(info);
    item.appendChild(unfollowBtn);
    
    unfollowerList.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function unfollowUser(username, button) {
  button.disabled = true;
  button.textContent = 'Unfollowing...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'unfollowUser', 
      username: username 
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: Please refresh the Instagram page and try again', 'error');
        button.disabled = false;
        button.textContent = 'Unfollow';
        return;
      }
      
      if (response && response.success) {
        // Remove from list
        const item = button.closest('.unfollower-item');
        item.remove();
        
        // Update count
        const currentCount = parseInt(unfollowerCount.textContent);
        unfollowerCount.textContent = Math.max(0, currentCount - 1);
        
        showStatus(`Successfully unfollowed @${username}`, 'success');
        
        // Update stored data
        chrome.storage.local.get(['unfollowers'], (result) => {
          const unfollowers = (result.unfollowers || []).filter(u => u.username !== username);
          chrome.storage.local.set({ unfollowers });
        });
      } else {
        showStatus(response?.error || 'Failed to unfollow user', 'error');
        button.disabled = false;
        button.textContent = 'Unfollow';
      }
    });
  } catch (error) {
    showStatus(error.message, 'error');
    button.disabled = false;
    button.textContent = 'Unfollow';
  }
}

function showStatus(message, type = '') {
  statusDiv.className = `status ${type}`;
  statusDiv.innerHTML = `<p>${escapeHtml(message)}</p>`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
    statusDiv.innerHTML = '<p>Ready</p>';
  }, 5000);
}
