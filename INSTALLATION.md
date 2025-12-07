# Installation & Testing Guide

## Installation Steps

### Prerequisites
- Google Chrome browser (or any Chromium-based browser)
- Active Instagram account

### Installing the Extension

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/prasanna-aryal/Unfollower-Checker-Instagram.git
   cd Unfollower-Checker-Instagram
   ```

2. **Install Dependencies** (Optional - only if you want to regenerate icons)
   ```bash
   npm install
   ```

3. **Load Extension in Chrome**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle switch in top-right corner)
   - Click **Load unpacked**
   - Select the `Unfollower-Checker-Instagram` directory
   - The extension icon should appear in your Chrome toolbar

## Testing the Extension

### Test 1: Basic Installation
✓ Extension loads without errors
✓ Extension icon appears in toolbar
✓ No console errors in extension pages

**Steps:**
1. After loading the extension, check `chrome://extensions/` for any errors
2. Click the extension icon to open the popup
3. Verify the popup displays correctly

### Test 2: Popup Interface
✓ Popup opens and displays correctly
✓ "Refresh" button is visible
✓ Toggle switches for "Block Reels" and "Block Explore" are present
✓ Unfollower count shows "0" initially

**Steps:**
1. Click the extension icon
2. Verify all UI elements are present and styled correctly
3. Check that toggle switches can be toggled on/off

### Test 3: Instagram Page Integration
✓ Content script loads on Instagram pages
✓ No console errors on Instagram
✓ Page functionality remains intact

**Steps:**
1. Navigate to https://www.instagram.com
2. Log in to your Instagram account
3. Open browser console (F12) and check for errors
4. Verify Instagram works normally

### Test 4: Block Reels Feature
✓ Toggle "Block Reels" on
✓ Reels content is hidden from feed
✓ Reels navigation link is hidden
✓ Toggle "Block Reels" off
✓ Reels content reappears

**Steps:**
1. Go to Instagram home feed
2. Open extension popup
3. Toggle "Block Reels" ON
4. Verify Reels content disappears
5. Toggle "Block Reels" OFF
6. Verify Reels content reappears

### Test 5: Block Explore Feature
✓ Toggle "Block Explore" on
✓ Explore/Suggested content is hidden
✓ Explore navigation link is hidden
✓ Toggle "Block Explore" off
✓ Explore content reappears

**Steps:**
1. Go to Instagram home feed
2. Open extension popup
3. Toggle "Block Explore" ON
4. Verify Explore/Suggested content disappears
5. Toggle "Block Explore" OFF
6. Verify content reappears

### Test 6: Unfollower Detection
✓ Click "Refresh" button
✓ Extension attempts to fetch data
✓ Status message updates
✓ Unfollowers list populates (if any exist)

**Steps:**
1. Navigate to your Instagram profile page
2. Open extension popup
3. Click "Refresh" button
4. Wait for data to load
5. Check if unfollowers are displayed

**Note:** Due to Instagram's API restrictions, the unfollower detection may require:
- Being on your own profile page
- Manual interaction to view followers/following lists
- The extension works best when you've recently viewed your followers/following

### Test 7: Unfollow Button on Profile
✓ Navigate to a user's profile you follow
✓ "Quick Unfollow" button appears next to "Following" button
✓ Clicking button shows confirmation
✓ Confirming unfollows the user

**Steps:**
1. Navigate to any user's profile that you follow
2. Look for the "Quick Unfollow" button
3. Click it and confirm
4. Verify the unfollow action completes

### Test 8: Unfollow from Popup
✓ Unfollower list displays users
✓ Each user shows: username, avatar, status badges
✓ "Unfollow" button is present for each user
✓ Clicking unfollow shows confirmation
✓ Successful unfollow removes user from list

**Steps:**
1. After detecting unfollowers (Test 6)
2. Click "Unfollow" button next to a user
3. Confirm the action
4. Verify user is removed from list
5. Verify count decreases

### Test 9: User Status Display
✓ Username is displayed correctly
✓ Profile picture is shown (or default avatar)
✓ "Following" badge is visible
✓ "Private" or "Public" badge shows correct status
✓ Verified badge (✓) appears for verified accounts

**Steps:**
1. Check each user in the unfollower list
2. Verify all status badges are present and correct
3. Click on a user to navigate to their profile

### Test 10: Settings Persistence
✓ Toggle "Block Reels" ON
✓ Close popup
✓ Reopen popup
✓ "Block Reels" is still ON
✓ Same for "Block Explore"

**Steps:**
1. Toggle both switches ON
2. Close the popup
3. Refresh Instagram page
4. Reopen popup
5. Verify switches are still ON
6. Verify content is still blocked

## Known Limitations

1. **Instagram API Restrictions**: Instagram doesn't provide a public API for extensions, so the extension uses DOM parsing which may be affected by Instagram layout changes.

2. **Rate Limiting**: Instagram may rate-limit requests if the extension is used too frequently.

3. **Large Follower Lists**: Accounts with thousands of followers may take longer to process or may not complete due to Instagram's pagination.

4. **Profile Access**: The unfollower detection works best when you manually navigate to your profile and have recently viewed your followers/following lists.

## Troubleshooting

### Extension doesn't load
- Make sure Developer mode is enabled
- Check for errors in `chrome://extensions/`
- Try reloading the extension

### Popup doesn't open
- Right-click the extension icon and check for errors
- Reload the extension
- Restart Chrome

### Unfollower detection doesn't work
- Make sure you're logged into Instagram
- Navigate to your profile page first
- Try refreshing the Instagram page
- The feature may require manual viewing of followers/following lists first

### Content blocking doesn't work
- Refresh the Instagram page after toggling
- Check browser console for errors
- Instagram layout changes may affect the selectors

### Unfollow button doesn't work
- Make sure you're on the user's profile page
- The page must be fully loaded
- Check for Instagram rate limiting

## Reporting Issues

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Check the extension background page console:
   - Go to `chrome://extensions/`
   - Click "Inspect views: background page"
3. Include error messages and steps to reproduce when reporting

## Security Notes

- The extension only has access to Instagram pages
- All data is stored locally in your browser
- No data is sent to external servers
- The extension cannot access other websites or your personal data beyond Instagram
