MUDFEST DRIVER TIMER — OFFLINE ANDROID PWA

FILES
- index.html
- manifest.webmanifest
- service-worker.js
- icons/

IMPORTANT
A PWA service worker cannot be installed from a local file:// URL.
Host this folder on HTTPS first. GitHub Pages, Firebase Hosting, or
another HTTPS static host will work.

ANDROID INSTALLATION
1. Upload the entire folder to your HTTPS website.
2. On each marshal's Android phone, open the timer URL using CHROME.
3. Let the page finish loading once while internet is available.
4. Tap Chrome's menu (three dots).
5. Tap "Install app" or "Add to Home screen".
6. Confirm installation.
7. Launch "MUDFEST Timer" from the new app icon.
8. Open it once while still online so the offline cache is confirmed.
9. Test it:
   - Enable Airplane Mode.
   - Fully close the timer.
   - Reopen MUDFEST Timer from the Home Screen/app drawer.
   - The timer should still load and function.

RACE-DAY RECOMMENDATION
Install and test the PWA on every marshal Android device before event day.
Keep the standalone index.html as an emergency backup.

UPDATING THE APP
When changing files later, update this line in service-worker.js:

const CACHE_NAME = "mudfest-driver-timer-android-v1";

For example:
const CACHE_NAME = "mudfest-driver-timer-android-v2";

Then upload the changed files. This prompts the browser to cache the new version.

CURRENT TIMER FEATURES
- Configurable raw-time DNF limit
- START / STOP-RESUME
- +5 sec / +20 sec penalties
- Reset icon
- Manual DNF with confirmation
- Automatic DNF stop at time limit
- Start timestamp
- Responsive Android layout
- Fully offline after successful PWA installation/cache
- Android maskable app icons

Source code remains unminified.
