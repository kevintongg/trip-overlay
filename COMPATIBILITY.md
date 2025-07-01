# 🔧 **Feature Compatibility Guide**

## **Local OBS vs IRLToolkit Cloud: What Works Where**

### **🖥️ Local OBS Setup (Full Feature Access)**

When running OBS locally on your computer with a Browser Source pointing to the overlay:

**✅ ALL Features Available:**

**Console Commands (Most Reliable):**

```javascript
// Press F12 in browser → Console tab → run commands:
resetTripProgress(); // Reset entire trip to 0km
resetTodayDistance(); // Reset only today's distance
resetAutoStartLocation(); // Re-detect GPS start location
exportTripData(); // Download backup JSON file
importTripData(jsonString); // Import backup data
```

**Keyboard Hotkeys:**

```
Ctrl+H           - Show/hide control panel temporarily
Ctrl+Shift+R     - Quick daily distance reset
Ctrl+Shift+B     - Quick backup export
Ctrl+Shift+T     - Reset entire trip (with confirmation)
```

**URL Parameters:**

```
?reset=today     - Reset today's distance
?export=true     - Download backup file
?reset=location  - Reset auto-start GPS location
?reset=trip      - Reset entire trip
?controls=true   - Show control buttons permanently
?stream=true     - Enable hotkey support with clean overlay
```

**On-Screen Controls:**

```
https://yourdomain.com/trip-overlay/?controls=true
```

_Opens overlay with visible control buttons - use in separate browser window_

**Dual Browser Method:**

- **Stream browser:** Clean overlay URL for OBS capture
- **Control browser:** Same URL with `?controls=true` for management
- **Zero viewer interference**

### **☁️ IRLToolkit Cloud Setup (Limited Access)**

When using IRLToolkit's cloud OBS service:

**✅ What Works:**

**URL Parameter Switching (Primary Method):**

```
Normal:    https://yourdomain.com/trip-overlay/
Action:    https://yourdomain.com/trip-overlay/?reset=today
Return:    https://yourdomain.com/trip-overlay/
```

**Browser Source Presets (Recommended):**

```
Preset 1: "Normal Stream"  → https://yourdomain.com/trip-overlay/
Preset 2: "Daily Reset"    → https://yourdomain.com/trip-overlay/?reset=today
Preset 3: "Emergency Backup" → https://yourdomain.com/trip-overlay/?export=true
Preset 4: "GPS Fix"        → https://yourdomain.com/trip-overlay/?reset=location
```

**❌ What DOESN'T Work:**

**Console Commands:**

- ❌ Can't open F12 developer tools in IRLToolkit's cloud browser
- ❌ No access to JavaScript console
- ❌ Can't run `resetTripProgress()` or any console functions

**Keyboard Hotkeys:**

- ❌ Can't send Ctrl+H, Ctrl+Shift+R to cloud browser
- ❌ IRLToolkit doesn't forward keyboard input to Browser Sources
- ❌ All hotkey functionality is inaccessible

**On-Screen Controls:**

- ❌ Control buttons would be visible to stream viewers (unprofessional)
- ❌ No way to hide controls from audience
- ❌ Can't open separate browser window for private controls

**Dual Browser Setup:**

- ❌ IRLToolkit provides only one browser instance per source
- ❌ Can't open multiple browsers for separate control interface

## **Why These Limitations Exist**

**IRLToolkit Cloud Environment:**

- Runs in isolated cloud browser on their servers
- No direct interaction with browser beyond URL changes
- Optimized for streaming, not development/debugging
- Security restrictions prevent console/keyboard access

**Local OBS Environment:**

- Full control over browser instance
- Direct access to all browser features
- Can run multiple browsers simultaneously
- No security restrictions on local development

## **Recommended Workflows**

### **For Local OBS Users:**

```
Primary: Use keyboard hotkeys (Ctrl+Shift+R for daily resets)
Backup: Console commands for complex operations
Emergency: URL parameters if browser becomes unresponsive
```

### **For IRLToolkit Users:**

```
Primary: Browser Source presets (faster than URL editing)
Backup: URL parameter switching in dashboard
Planning: Test everything locally first, then deploy to cloud
```

## **Testing Before Going Live**

**Always test locally first:**

1. **Load overlay in regular browser** (not OBS)
2. **Test RTIRL connection** and GPS tracking
3. **Try all control methods** you plan to use
4. **Export backup** before switching to cloud
5. **Verify GitHub Pages hosting** is working

**This ensures your cloud setup will work smoothly during live streams.**

---

## **Backup & Restore Capability Comparison**

| Feature                    | Local OBS                     | IRLToolkit Cloud             |
| -------------------------- | ----------------------------- | ---------------------------- |
| **Create Backup**          | ✅ `exportTripData()`         | ✅ `?export=true`            |
| **Download Backup File**   | ✅ Direct to Downloads folder | ✅ To IRLToolkit file system |
| **Restore Full Backup**    | ✅ `easyImport()` + dialog    | ❌ **NOT POSSIBLE**          |
| **Manual Restore**         | ✅ `importTripData(json)`     | ❌ **NOT POSSIBLE**          |
| **Basic Progress Setting** | ✅ Console + URL parameters   | ✅ URL parameters only       |
| **Complex Data Restore**   | ✅ All data preserved         | ❌ **MAJOR LIMITATION**      |

### **What "Complex Data" Includes:**

- Auto-detected start location coordinates
- Precise timestamp data for intelligent daily resets
- Activity tracking for travel session continuity
- Unit preference with trip state

### **IRLToolkit Workarounds:**

- **Basic recovery:** Use `?setDistance=X&units=km` to manually recreate progress
- **Documentation only:** Treat backups as records, not restoration tools
- **Local restoration:** Temporarily set up locally to restore, then note values for manual recreation

### **Critical Decision Point:**

**For trips where backup/restore is essential → Use Local OBS**  
**For casual streaming with acceptable loss risk → IRLToolkit is fine**

---

**Bottom Line:** Local OBS = full control, IRLToolkit = URL parameters only. Plan accordingly! 🎯
