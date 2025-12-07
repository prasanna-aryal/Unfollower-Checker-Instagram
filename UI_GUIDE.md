# Extension Screenshots & UI Guide

## Extension Popup Interface

The extension popup is designed to match Instagram's visual style with a clean, modern interface.

### Main Interface Components

#### 1. Header Section
- **Title**: "Unfollower Checker"
- **Refresh Button**: Blue button to scan for unfollowers
  - Changes to "Refreshing..." when scanning
  - Disabled during operation

#### 2. Content Blocking Controls
Two toggle switches for content filtering:

**Block Reels Toggle**
- When ON: Slider turns blue, Reels content hidden from feed
- When OFF: Slider is gray, Reels content visible

**Block Explore Toggle**
- When ON: Slider turns blue, Explore/Suggested content hidden
- When OFF: Slider is gray, Suggested content visible

#### 3. Statistics Section
- **Not Following Back Counter**: Shows number of unfollowers found
- Large, bold number display
- Updates automatically after scan

#### 4. Status Messages
Color-coded status bar:
- **Yellow**: Info messages (e.g., "Click Refresh to scan")
- **Green**: Success messages (e.g., "Successfully updated")
- **Red**: Error messages (e.g., "Please navigate to Instagram")

#### 5. Unfollower List
Scrollable list of users not following back. Each item shows:

**User Avatar**
- Circular profile picture (44x44px)
- Default gray avatar if no image available
- Border matching Instagram style

**User Information**
- **Username**: Bold, black text
- **Verified Badge**: Blue checkmark for verified accounts
- **Status Badges**:
  - Blue "Following" badge (you follow them)
  - Orange "Private" badge OR green "Public" badge
  - Small, rounded rectangle style

**Unfollow Button**
- White background with gray border
- "Unfollow" text
- Hover effect: darker border
- Disabled state: Grayed out with "Unfollowing..." text

### Color Scheme
Matches Instagram's design:
- Primary Blue: `#0095f6` (Instagram blue)
- Background: `#fafafa` (Light gray)
- Text: `#262626` (Dark gray/black)
- Borders: `#dbdbdb` (Medium gray)
- Success: `#28a745` (Green)
- Warning: `#ffc107` (Yellow)
- Error: `#dc3545` (Red)

### Typography
- Font Family: System fonts matching Instagram
  - `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- Font Sizes:
  - Title: 18px bold
  - Body text: 14px
  - Buttons: 14px bold
  - Badges: 11px

### Dimensions
- **Popup Width**: 400px
- **Popup Height**: Auto (min 500px)
- **Max List Height**: 400px (scrollable)

## Extension Icons

### Icon Sizes
Three sizes for different contexts:
- **16x16**: Browser toolbar (small)
- **48x48**: Extension management page
- **128x128**: Chrome Web Store and large displays

### Icon Design
- Gradient background: Purple to orange (Instagram colors)
- White camera icon (Instagram-style)
- Small red X mark (indicating "unfollower")

## On-Page Features

### Quick Unfollow Button (Profile Pages)
When viewing someone's profile you follow:

**Location**: Next to the "Following" button
**Appearance**:
- White background
- Gray border
- "Quick Unfollow" text
- Same styling as Instagram's native buttons
- Hover effect: Light gray background

**Behavior**:
- Appears only on profile pages where you follow the user
- Click triggers confirmation dialog
- Success: Page reloads to show updated status

### Content Blocking (Feed)

**Blocked Reels**:
- Reels posts: Hidden with `display: none`
- Reels navigation icon: Hidden
- Applied dynamically as feed loads

**Blocked Explore/Suggested**:
- Suggested posts: Hidden
- "Suggestions For You" section: Hidden
- Explore navigation icon: Hidden
- Applied dynamically as content appears

## User Flow Examples

### Flow 1: Finding Unfollowers
1. User clicks extension icon
2. Popup opens showing controls
3. User clicks "Refresh" button
4. Status shows "Fetching data from Instagram..."
5. Extension analyzes followers/following
6. List populates with unfollowers
7. Counter updates with total number
8. Status shows "Successfully updated"

### Flow 2: Unfollowing a User
1. User sees unfollower in list
2. User clicks "Unfollow" button
3. Confirmation dialog: "Are you sure you want to unfollow @username?"
4. User confirms
5. Button shows "Unfollowing..."
6. Action completes
7. User removed from list
8. Counter decreases by 1
9. Status shows "Successfully unfollowed @username"

### Flow 3: Blocking Content
1. User toggles "Block Reels" ON
2. Switch slides to right and turns blue
3. Instagram feed updates (Reels disappear)
4. User navigates around Instagram
5. Reels remain hidden
6. User closes and reopens popup
7. Setting persists (toggle still ON)

## Accessibility Features

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels on interactive elements
- **Color Contrast**: Meets WCAG AA standards
- **Focus Indicators**: Visible focus states for keyboard navigation
- **Clear Labels**: Descriptive text for all controls

## Responsive Design

The extension popup maintains its layout across different display densities:
- Standard displays (1x)
- Retina/HiDPI displays (2x, 3x)
- Icons scale appropriately
- Text remains crisp and readable

## Animation & Transitions

Subtle animations for better UX:
- Toggle switches: 0.3s smooth slide
- Buttons: 0.2s hover effect
- Status messages: Fade in/out
- List items: Smooth removal animation

All animations use CSS transitions for performance.
