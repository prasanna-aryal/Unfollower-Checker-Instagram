# Instagram Unfollower Checker

A Chrome extension that helps you identify and manage Instagram users who don't follow you back. The extension also provides options to block Reels and Explore content from your feed.

## Features

### 🎯 Core Features
- **Unfollower Detection**: Displays a list of users you follow who are not following you back
- **User Status Display**: Shows each user's:
  - Follow Status (Following)
  - Account Type (Private/Public)
  - Verification Status (Verified badge if applicable)
- **Quick Unfollow**: Unfollow button directly in the extension popup and on profile pages

### 🚫 Content Blocking
- **Block Reels**: Toggle to hide Reels content from your Instagram feed
- **Block Explore**: Toggle to hide Explore/Suggested content from your feed

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/prasanna-aryal/Unfollower-Checker-Instagram.git
   cd Unfollower-Checker-Instagram
   ```

2. Install dependencies (for icon generation):
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

## Usage

### Finding Unfollowers

1. Navigate to Instagram (https://www.instagram.com)
2. Make sure you're logged in
3. Click the extension icon in your Chrome toolbar
4. Click the "Refresh" button in the popup
5. The extension will analyze your followers and following lists
6. View the list of users who don't follow you back

### Unfollowing Users

#### From the Extension Popup:
- Click the "Unfollow" button next to any user in the list
- Confirm the action when prompted

#### From Profile Pages:
- Navigate to any user's profile
- If you're following them, you'll see a "Quick Unfollow" button
- Click it to unfollow

### Blocking Content

#### Block Reels:
- Toggle the "Block Reels" switch in the extension popup
- Reels content will be hidden from your feed
- Toggle off to show Reels again

#### Block Explore:
- Toggle the "Block Explore" switch in the extension popup
- Explore/Suggested content will be hidden from your feed
- Toggle off to show suggested content again

## How It Works

The extension consists of three main components:

1. **Popup Interface** (`popup.html`, `popup.js`, `popup.css`):
   - Provides the user interface for viewing unfollowers
   - Displays user information with status badges
   - Contains toggle switches for blocking content

2. **Content Script** (`content.js`, `content.css`):
   - Runs on Instagram pages
   - Analyzes followers/following data
   - Implements content blocking
   - Adds unfollow buttons to profiles

3. **Background Service Worker** (`background.js`):
   - Manages extension settings
   - Coordinates between popup and content script

## Privacy & Permissions

This extension requires the following permissions:

- **storage**: To save your preferences (Reels/Explore blocking settings) and unfollower data
- **activeTab**: To interact with the active Instagram tab
- **host_permissions (instagram.com)**: To read and modify Instagram pages for unfollower detection and content blocking

**Privacy Note**: All data is stored locally on your device. No information is sent to external servers.

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Supported Browser**: Google Chrome (and Chromium-based browsers)
- **Instagram Compatibility**: Works with the current Instagram web interface

## Limitations

- The extension works with Instagram's web interface and may break if Instagram significantly changes their layout
- Fetching complete follower/following lists may take time for accounts with many followers
- Instagram's rate limiting may affect the functionality if used too frequently

## Development

To modify the extension:

1. Make your changes to the source files
2. If you modify icon SVGs, regenerate PNGs:
   ```bash
   node generate-icons.js
   ```
3. Reload the extension in Chrome (`chrome://extensions/` → click reload icon)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the terms specified in the LICENSE file.

## Disclaimer

This extension is for educational purposes. Please use responsibly and in accordance with Instagram's Terms of Service. Excessive automated actions may result in account restrictions.