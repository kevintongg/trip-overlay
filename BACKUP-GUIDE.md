# 💾 Trip Overlay Backup & Restore Guide

**Complete step-by-step instructions for backing up and restoring your trip progress**

## 🎯 When Do You Need This?

- **Switching hosting methods** (local file → cloud hosting)
- **Moving between computers** (laptop → desktop)
- **Changing browsers** (Chrome → OBS Browser Source)
- **Setting up overlay on new device**
- **Creating safety backups** before major changes
- **Transferring progress** between different URLs/domains

## 📤 How to Backup Your Progress (Save Your Data)

### Method 1: Browser Console Backup (Recommended)

**Step 1: Open Your Overlay**

1. **Visit your overlay** in any web browser (Chrome, Firefox, Edge)
   - Cloud hosting: `https://yoursite.com/trip-overlay/`
   - Local file: Double-click your `index.html` file
   - Local server: `http://localhost:8000`

**Step 2: Open Developer Console**

1. **Windows users:** Press `F12` OR `Ctrl + Shift + I`
2. **Mac users:** Press `Cmd + Option + I`
3. **Alternative method:** Right-click anywhere → "Inspect" → Click "Console" tab

**Step 3: Run Backup Command**

1. **Type this command exactly:**
   ```javascript
   exportTripData();
   ```
2. **Press Enter**
3. **A file will automatically download** to your Downloads folder
   - File name: `trip-backup-2024-01-15.json` (with today's date)
   - This file contains ALL your progress data

**Step 4: Save Your Backup**

- **Move the file somewhere safe:** Google Drive, Dropbox, USB drive
- **Don't lose this file** - it's your only way to restore progress

### Method 2: IRLToolkit Cloud Backup

**For streamers using IRLToolkit's cloud OBS:**

1. **Change your Browser Source URL temporarily:**
   - Normal: `https://yoursite.com/trip-overlay/`
   - Backup: `https://yoursite.com/trip-overlay/?export=true`

2. **Wait 10 seconds** - the backup file downloads to IRLToolkit's system

3. **Change URL back to normal:** `https://yoursite.com/trip-overlay/`

4. **Access the file** through IRLToolkit's file manager/downloads

## 📥 How to Restore Your Progress (Load Your Data)

### Step 1: Prepare Your Backup Data

**Option A: Open Backup File**

1. **Find your backup file** (looks like `trip-backup-2024-01-15.json`)
2. **Open with text editor:**
   - **Windows:** Right-click → "Open with" → "Notepad"
   - **Mac:** Right-click → "Open with" → "TextEdit"
   - **Alternative:** Drag file into any web browser window
3. **Select ALL text** (`Ctrl+A` / `Cmd+A`) and **copy** (`Ctrl+C` / `Cmd+C`)

**What the backup data looks like:**

```json
{
  "totalDistanceTraveled": 87.5,
  "todayDistanceTraveled": 15.2,
  "date": "Mon Jan 15 2024",
  "lastActiveTime": "2024-01-15T14:30:00.000Z",
  "autoStartLocation": { "lat": 50.0755, "lon": 14.4378 },
  "useImperialUnits": false
}
```

### Step 2: Import to New Location

**Method 1: Easy Import (Recommended)**

1. **Open your overlay** in the NEW location (new computer, browser, etc.)
2. **Open developer console** (`F12` or `Ctrl+Shift+I`)
3. **Type this simple command:**
   ```javascript
   easyImport();
   ```
4. **A dialog box appears** - paste your backup data and click OK
5. **Success!** Green message appears and your progress is restored

**Method 2: Manual Import**

1. **Open your overlay** in the NEW location
2. **Open developer console** (`F12` or `Ctrl+Shift+I`)
3. **Type this command with your data:**
   ```javascript
   importTripData('PASTE_YOUR_BACKUP_DATA_HERE');
   ```
4. **Replace `PASTE_YOUR_BACKUP_DATA_HERE`** with your copied backup text
5. **Keep the single quotes** around your backup data
6. **Press Enter** - green success message appears

**Complete example:**

```javascript
importTripData(
  '{"totalDistanceTraveled":87.5,"todayDistanceTraveled":15.2,"date":"Mon Jan 15 2024","lastActiveTime":"2024-01-15T14:30:00.000Z","autoStartLocation":{"lat":50.0755,"lon":14.4378},"useImperialUnits":false}'
);
```

## ✅ Success Indicators

### Backup Successful

- ✅ **Green message appears:** "Backup downloaded successfully!"
- ✅ **File appears** in your Downloads folder
- ✅ **Console shows:** "Trip data exported successfully"

### Restore Successful

- ✅ **Green message appears:** "Data imported successfully!"
- ✅ **Your distance numbers reappear** in the overlay
- ✅ **Console shows:** "Trip data imported successfully"
- ✅ **Progress bar updates** to show correct completion percentage

## 🚨 Troubleshooting Common Issues

### "Nothing happened when I pressed F12"

**Solutions:**

- Try `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (Mac)
- Some browsers: Right-click → "Inspect Element" → "Console" tab
- Try different browser (Chrome usually works best)

### "Can't find the Console tab"

**Solutions:**

- Look for tabs at top: Elements, Console, Network, Sources, etc.
- Console tab might be hidden - look for `>>` to expand more tabs
- Click directly on "Console" - it should be next to "Elements"

### "Command not recognized" or "Function not defined"

**Solutions:**

- Make sure you're in the "Console" tab, not "Elements" or other tabs
- Type exactly: `exportTripData()` with parentheses
- Make sure your overlay page is fully loaded before trying commands
- Try refreshing the page and waiting 5 seconds before running commands

### "Import didn't work" or "No data appeared"

**Solutions:**

- Check that backup text is complete (starts with `{` and ends with `}`)
- Make sure you copied ALL the text from backup file (no missing parts)
- Try the `easyImport()` method instead of manual import
- Verify you're using single quotes around the backup data: `'backup data here'`
- If backup data contains single quotes, replace them with double quotes first

### "File won't open" or "Can't read backup file"

**Solutions:**

- Try dragging the `.json` file into a web browser window
- Use Notepad (Windows) or TextEdit (Mac) - avoid Word or fancy editors
- File should contain text starting with `{` - if it shows weird characters, try different text editor
- Make sure file extension is `.json` not `.txt`

### "Backup command worked but file is empty"

**Solutions:**

- Check if you have any trip progress to backup (non-zero distances)
- Try running `exportTripData()` again after traveling some distance
- Verify localStorage isn't disabled in your browser settings

### "Progress looks wrong after restore"

**Solutions:**

- Check if you imported the right backup file (check the date)
- Verify your trip configuration matches (total distance, start location settings)
- Try clearing localStorage and importing again: `resetTripProgress()` then import
- Make sure you're using the same unit system (km vs miles)

## 📊 What Data Gets Transferred

Your backup includes:

- ✅ **Total distance traveled** (main progress counter)
- ✅ **Today's distance** (daily travel counter)
- ✅ **Unit preference** (kilometers vs miles)
- ✅ **Auto-detected start location** (if using auto-start mode)
- ✅ **Last activity date/time** (for intelligent daily resets)
- ✅ **Travel session data** (prevents incorrect daily resets)

## 🎯 Real-World Scenarios

### Scenario 1: Local Development → Cloud Hosting

```
Problem: Tested overlay locally, now deploying to GitHub Pages
Solution:
1. exportTripData() from local file
2. Deploy to GitHub Pages
3. easyImport() on new GitHub Pages URL
4. Continue with same progress
```

### Scenario 2: Computer Crash During Trip

```
Problem: Laptop died, need to continue stream on backup computer
Solution:
1. Had backup from yesterday: trip-backup-2024-01-14.json
2. Set up overlay on backup computer
3. easyImport() with yesterday's backup
4. Manually add today's progress: addDistance(25.5)
```

### Scenario 3: OBS Browser Source vs Regular Browser

```
Problem: Progress different between OBS and regular browser
Solution:
1. exportTripData() from regular browser
2. Open overlay in OBS Browser Source
3. F12 in OBS Browser Source
4. easyImport() to sync progress
```

### Scenario 4: Multi-Day Tour Setup

```
Problem: Need to preserve progress across multiple streaming days
Solution:
1. End of Day 1: exportTripData() for safety
2. Start of Day 2: Overlay automatically preserves progress
3. If issues occur: easyImport() with Day 1 backup + addDistance() for Day 2
```

## 💡 Pro Tips for Streamers

### Daily Backup Routine

```javascript
// Before each stream, run:
exportTripData(); // Safety backup

// After each stream, run:
exportTripData(); // Progress backup
```

### Quick Progress Adjustments

```javascript
// Add missing distance:
addDistance(5.5); // Adds 5.5km to current total

// Fix incorrect total:
setDistance(127.3); // Sets total to exactly 127.3km
```

### Unit Switching

```javascript
// Switch to miles:
convertToMiles();

// Switch back to kilometers:
convertToKilometers();
```

### Emergency Reset Commands

```javascript
// Reset just today's distance:
resetTodayDistance();

// Reset everything (careful!):
resetTripProgress();
```

## 📱 Platform-Specific Notes

### OBS Browser Source

- **Storage isolation:** OBS Browser Source has separate localStorage from regular browser
- **Solution:** Always test and backup within OBS context
- **F12 access:** Works in OBS Browser Source for console commands

### IRLToolkit Cloud

- **Limited access:** No F12 console or keyboard shortcuts
- **Backup capability:** Use URL parameter method: `?export=true`
- **File access:** Downloads go to IRLToolkit's file system
- **⚠️ MAJOR LIMITATION:** Cannot easily restore complex backup data
- **Workaround:** Basic progress recreation with URL parameters (see below)

### GitHub Pages

- **Reliable hosting:** Best option for consistent URLs
- **localStorage:** Tied to the GitHub Pages domain
- **Cross-device:** Need manual backup/restore between devices

### Local Files

- **Path dependency:** localStorage tied to exact file location
- **Moving files:** Breaks localStorage, need backup/restore
- **Development:** Great for testing, backup before deploying

## 🔗 Related Guides

- **[README.md](./README.md)** - Main setup and usage guide
- **[IRLTOOLKIT-GUIDE.md](./IRLTOOLKIT-GUIDE.md)** - Cloud streaming workflow
- **[API.md](./API.md)** - Complete console commands reference
- **[COMPATIBILITY.md](./COMPATIBILITY.md)** - Feature matrix by setup type

---

## ⚠️ **IRLToolkit Backup Restore Limitation**

### **The Problem**

IRLToolkit cloud users can **backup easily** but **cannot restore complex backup data** due to cloud browser limitations:

- ❌ No console access for `easyImport()` or `importTripData()`
- ❌ URL import impractical (JSON data too long for URLs)
- ❌ No file upload capability to cloud browser

### **Workaround Solutions**

**Option 1: Basic Progress Recreation**
Use URL parameters to manually set key values:

```
https://yoursite.com/trip-overlay/?setDistance=150.5&units=km
```

Available parameters:

- `setDistance=X` - Set total distance traveled
- `addDistance=X` - Add distance to current total
- `units=km` or `units=miles` - Set unit preference
- `totalDistance=X` - Change total trip distance target
- `jumpTo=X` - Jump to X% completion

**Example recovery scenario:**

```
Day 1 backup showed: 87.5km traveled of 205km trip
Day 2 URL: ?setDistance=87.5&totalDistance=205&units=km
```

**Option 2: Local Setup for Restoration**

1. Set up overlay locally (temporary)
2. Use `easyImport()` to restore backup
3. Continue streaming, note current progress
4. Use URL parameters in IRLToolkit to match progress

**Option 3: Live with the Limitation**

- Accept that IRLToolkit backups are for documentation only
- Use daily resets and manual distance tracking
- Rely on automatic persistence (works unless you change domains)

### **What IRLToolkit Users Should Know**

**✅ You CAN backup reliably:**

```
Change URL to: ?export=true (wait 10 seconds) → back to normal
```

**❌ You CANNOT restore complex backups:**

- No auto-start location restoration
- No precise timestamp data restoration
- No complex trip state restoration

**🔄 You CAN do basic recovery:**

- Manual distance setting via URL parameters
- Unit preference restoration
- Trip target adjustment

### **Recommendation for IRLToolkit Users**

1. **Create backups regularly** (`?export=true`) for documentation
2. **Note key values** in your backup files for manual recreation
3. **Keep simple records** (distance traveled, trip total, units)
4. **Use local OBS for critical trips** where backup/restore is essential

This limitation is a **fundamental constraint** of cloud browser environments and cannot be easily solved without IRLToolkit adding specific file upload features.

---

**Remember:** Always backup before making major changes, and test the restore process once to make sure you understand it! 🛡️📱
