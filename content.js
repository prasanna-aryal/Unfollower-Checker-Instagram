// Content script for Instagram Unfollower Checker

let blockReelsEnabled = false;
let blockExploreEnabled = false;

// Load settings when script initializes
chrome.storage.sync.get(['blockReels', 'blockExplore'], (result) => {
  blockReelsEnabled = result.blockReels || false;
  blockExploreEnabled = result.blockExplore || false;
  
  if (blockReelsEnabled) {
    blockReels();
  }
  if (blockExploreEnabled) {
    blockExplore();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchUnfollowers') {
    fetchUnfollowers()
      .then(unfollowers => {
        chrome.storage.local.set({ unfollowers });
        sendResponse({ success: true, count: unfollowers.length });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'unfollowUser') {
    unfollowUser(request.username)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === 'toggleReels') {
    blockReelsEnabled = request.enabled;
    if (blockReelsEnabled) {
      blockReels();
    } else {
      unblockReels();
    }
    sendResponse({ success: true });
  }
  
  if (request.action === 'toggleExplore') {
    blockExploreEnabled = request.enabled;
    if (blockExploreEnabled) {
      blockExplore();
    } else {
      unblockExplore();
    }
    sendResponse({ success: true });
  }
});

// Watch for content changes and reapply blocks if needed
const observer = new MutationObserver(() => {
  if (blockReelsEnabled) {
    blockReels();
  }
  if (blockExploreEnabled) {
    blockExplore();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Function to fetch unfollowers
async function fetchUnfollowers() {
  try {
    // Get current user's username
    const username = await getCurrentUsername();
    if (!username) {
      throw new Error('Could not determine current username. Please make sure you are logged in.');
    }
    
    // Fetch followers and following lists
    const [followers, following] = await Promise.all([
      fetchUserList(username, 'followers'),
      fetchUserList(username, 'following')
    ]);
    
    // Find users who are not following back
    const followerIds = new Set(followers.map(user => user.id));
    const unfollowers = following.filter(user => !followerIds.has(user.id));
    
    return unfollowers;
  } catch (error) {
    console.error('Error fetching unfollowers:', error);
    throw error;
  }
}

// Get current logged-in username
async function getCurrentUsername() {
  // Try to get username from page
  const usernameElement = document.querySelector('a[href^="/"][href$="/"] img[alt*="profile"]');
  if (usernameElement) {
    const link = usernameElement.closest('a');
    if (link) {
      const username = link.getAttribute('href').replace(/\//g, '');
      if (username) return username;
    }
  }
  
  // Alternative: get from meta tag or window object
  const metaTag = document.querySelector('meta[property="og:url"]');
  if (metaTag) {
    const url = metaTag.getAttribute('content');
    const match = url.match(/instagram\.com\/([^\/]+)/);
    if (match) return match[1];
  }
  
  // Try to extract from page scripts
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.textContent;
    if (text.includes('"username":"')) {
      const match = text.match(/"username":"([^"]+)"/);
      if (match) return match[1];
    }
  }
  
  return null;
}

// Fetch user list (followers or following)
async function fetchUserList(username, type) {
  return new Promise((resolve, reject) => {
    // This is a simplified implementation
    // In a real scenario, you would need to use Instagram's internal API
    // For now, we'll show a message that user needs to be on their profile
    
    // Navigate to the profile and open the followers/following dialog
    const currentPath = window.location.pathname;
    const expectedPath = `/${username}/`;
    if (currentPath !== expectedPath && currentPath !== `/${username}`) {
      reject(new Error(`Please navigate to your profile page (@${username}) first`));
      return;
    }
    
    // Try to find and click the followers/following button
    setTimeout(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const targetLink = links.find(link => 
        link.href.includes(`/${username}/${type}`)
      );
      
      if (!targetLink) {
        reject(new Error(`Could not find ${type} link. Please make sure you're on your profile page.`));
        return;
      }
      
      // In a real implementation, we would:
      // 1. Click the link to open the modal
      // 2. Scroll through the list to load all users
      // 3. Extract user data from the DOM
      // For this demo, we'll use a simplified approach
      
      // This is a placeholder - real implementation would parse the DOM
      const users = extractUsersFromPage(type);
      resolve(users);
    }, 1000);
  });
}

// Extract users from the current page
// Note: This is a simplified implementation that works with visible page content.
// For a production app, you would need to use Instagram's internal GraphQL API
// or implement a more sophisticated DOM parsing strategy.
function extractUsersFromPage(type) {
  const users = [];
  
  // Look for user links on the page
  const userLinks = document.querySelectorAll('a[href^="/"]');
  const seenUsernames = new Set();
  
  // List of Instagram system paths to exclude
  const excludedPaths = [
    'explore', 'reels', 'direct', 'accounts', 'stories', 'tv', 'p', 'reel',
    'create', 'settings', 'notifications', 'search', 'activity', 'about',
    'help', 'press', 'api', 'jobs', 'privacy', 'terms', 'locations', 'language'
  ];
  
  userLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Extract username (remove leading/trailing slashes and query params)
    const pathMatch = href.match(/^\/([^\/\?]+)/);
    if (!pathMatch) return;
    
    const username = pathMatch[1];
    
    // Skip if already seen or if it's a system path
    if (seenUsernames.has(username) || excludedPaths.includes(username)) {
      return;
    }
    
    // Basic validation: username should be alphanumeric with underscores/dots
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return;
    }
    
    seenUsernames.add(username);
    
    // Try to get additional info from nearby elements
    const container = link.closest('[role="button"], article, li');
    const img = container?.querySelector('img');
    
    users.push({
      id: username, // Using username as ID for simplicity
      username: username,
      profile_pic_url: img?.src || '',
      is_verified: container?.querySelector('[aria-label*="Verified"]') !== null,
      is_private: container?.textContent?.toLowerCase().includes('private') || false
    });
  });
  
  return users.slice(0, 50); // Limit to avoid performance issues
}

// Unfollow a user
async function unfollowUser(username) {
  const currentPath = window.location.pathname;
  const userProfilePath = `/${username}/`;
  
  // Check if we're already on the profile
  if (currentPath !== userProfilePath && currentPath !== `/${username}`) {
    throw new Error(`Please navigate to ${username}'s profile first to unfollow them.`);
  }
  
  // Find and click the Following button
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const buttons = Array.from(document.querySelectorAll('button'));
  const followingButton = buttons.find(btn => 
    btn.textContent.includes('Following') || 
    btn.textContent.includes('Requested')
  );
  
  if (!followingButton) {
    throw new Error('Could not find Following button. Please navigate to the user\'s profile.');
  }
  
  // Click the button
  followingButton.click();
  
  // Wait for confirmation dialog
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find and click the Unfollow confirmation button
  const confirmButtons = Array.from(document.querySelectorAll('button'));
  const unfollowButton = confirmButtons.find(btn => 
    btn.textContent.includes('Unfollow')
  );
  
  if (unfollowButton) {
    unfollowButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    throw new Error('Could not find Unfollow confirmation button');
  }
}

// Block Reels from the feed
function blockReels() {
  // Hide reels section in the feed
  const reelsSelectors = [
    'section[role="main"] svg[aria-label*="Reel"]',
    'article svg[aria-label*="Reel"]',
    'a[href*="/reels/"]',
    'div[role="button"] svg[aria-label*="Reel"]'
  ];
  
  reelsSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const article = el.closest('article, div[style*="flex-direction: column"]');
      if (article) {
        article.style.display = 'none';
        article.setAttribute('data-blocked-by-extension', 'reels');
      }
    });
  });
  
  // Also hide the Reels navigation link
  const navLinks = document.querySelectorAll('a[href*="/reels"]');
  navLinks.forEach(link => {
    link.style.display = 'none';
    link.setAttribute('data-blocked-by-extension', 'reels-nav');
  });
}

// Unblock Reels
function unblockReels() {
  const elements = document.querySelectorAll('[data-blocked-by-extension="reels"]');
  elements.forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-blocked-by-extension');
  });
  
  const navElements = document.querySelectorAll('[data-blocked-by-extension="reels-nav"]');
  navElements.forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-blocked-by-extension');
  });
}

// Block Explore from the feed
function blockExplore() {
  // Hide explore posts and navigation
  const exploreSelectors = [
    'a[href*="/explore"]',
    'a[href^="/explore/"]'
  ];
  
  exploreSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Hide the navigation link
      if (el.getAttribute('href') === '/explore/' || el.getAttribute('href') === '/explore') {
        el.style.display = 'none';
        el.setAttribute('data-blocked-by-extension', 'explore-nav');
      }
      
      // Hide suggested posts in feed
      const article = el.closest('article');
      if (article) {
        const suggestedText = article.textContent;
        if (suggestedText.includes('Suggested') || suggestedText.includes('suggested')) {
          article.style.display = 'none';
          article.setAttribute('data-blocked-by-extension', 'explore');
        }
      }
    });
  });
  
  // Hide "Suggestions For You" section
  const suggestionHeaders = Array.from(document.querySelectorAll('div, span, h2')).filter(el => 
    el.textContent.includes('Suggestions') || 
    el.textContent.includes('Suggested')
  );
  
  suggestionHeaders.forEach(header => {
    const container = header.closest('div[style*="flex-direction"]');
    if (container) {
      container.style.display = 'none';
      container.setAttribute('data-blocked-by-extension', 'explore');
    }
  });
}

// Unblock Explore
function unblockExplore() {
  const elements = document.querySelectorAll('[data-blocked-by-extension="explore"]');
  elements.forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-blocked-by-extension');
  });
  
  const navElements = document.querySelectorAll('[data-blocked-by-extension="explore-nav"]');
  navElements.forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-blocked-by-extension');
  });
}

// Add unfollow button to profile pages
function addUnfollowButtonToProfile() {
  const pathMatch = window.location.pathname.match(/^\/([^\/]+)\/?$/);
  if (!pathMatch) {
    return; // Not a profile page
  }
  
  const buttons = document.querySelectorAll('button');
  const followingButton = Array.from(buttons).find(btn => 
    btn.textContent.includes('Following')
  );
  
  if (followingButton && !document.querySelector('.extension-unfollow-btn')) {
    const username = pathMatch[1];
    
    const unfollowBtn = document.createElement('button');
    unfollowBtn.className = 'extension-unfollow-btn';
    unfollowBtn.textContent = 'Quick Unfollow';
    unfollowBtn.style.cssText = `
      margin-left: 8px;
      padding: 7px 16px;
      background: white;
      border: 1px solid #dbdbdb;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    `;
    
    unfollowBtn.addEventListener('click', async () => {
      // Note: Using confirm() as per spec, though custom modal would be better UX
      if (confirm(`Unfollow @${username}?`)) {
        unfollowBtn.disabled = true;
        unfollowBtn.textContent = 'Unfollowing...';
        try {
          await unfollowUser(username);
          // Show success message instead of alert
          unfollowBtn.textContent = 'Unfollowed!';
          unfollowBtn.style.background = '#4caf50';
          unfollowBtn.style.color = 'white';
          unfollowBtn.style.borderColor = '#4caf50';
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          unfollowBtn.disabled = false;
          unfollowBtn.textContent = 'Quick Unfollow';
          // Show error in console instead of alert
          console.error('Unfollow error:', error.message);
        }
      }
    });
    
    followingButton.parentElement.appendChild(unfollowBtn);
  }
}

// Watch for navigation changes (Instagram is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      addUnfollowButtonToProfile();
      if (blockReelsEnabled) blockReels();
      if (blockExploreEnabled) blockExplore();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Initial setup
setTimeout(() => {
  addUnfollowButtonToProfile();
}, 2000);
