# 🎥 **IRLToolkit Streaming Guide**

_Professional motorbike trip overlay for cloud streaming_

## **Setup Overview**

This guide covers using the trip overlay in **IRLToolkit cloud OBS** with **GitHub Pages hosting** - the optimal combination for professional IRL streaming without technical hassles.

## **🚀 One-Time Setup**

### **1. Deploy to GitHub Pages**

```bash
1. Fork/create repository: your-username/trip-overlay
2. Upload overlay files (index.html, css/, js/, assets/)
3. Enable GitHub Pages in Settings > Pages > Deploy from main branch
4. Your overlay URL: https://your-username.github.io/trip-overlay/
```

### **2. Configure IRLToolkit**

```
Browser Source Settings:
- URL: https://your-username.github.io/trip-overlay/
- Width: 900px
- Height: 200px
- ✅ Shutdown source when not visible
- ✅ Refresh browser when scene becomes active
```

### **3. Pre-Stream Testing**

```
Local Browser Test:
1. Open https://your-username.github.io/trip-overlay/
2. Check RTIRL connection (should see GPS coordinates in console)
3. Verify distance calculations work
4. Export backup: Open console (F12) → run exportTripData()
```

## **📱 Live Streaming Workflow**

### **Normal Streaming**

```
IRLToolkit Browser Source URL:
https://your-username.github.io/trip-overlay/
```

**What viewers see:** Clean progress tracking overlay with animated motorbike

### **Management Actions During Stream**

#### **Daily Distance Reset** _(Most Common)_

```
When: Starting new travel day
How: Change URL to: ?reset=today
Wait: 5 seconds
Return: Remove ?reset=today parameter
Result: Today = 0km, total progress preserved
Viewer impact: ~5 second overlay refresh
```

#### **Emergency Backup**

```
When: Want to save progress mid-stream
How: Change URL to: ?export=true
Wait: 10 seconds (file downloads)
Return: Remove ?export=true parameter
Result: Backup file saved to IRLToolkit system
Viewer impact: ~10 second overlay refresh
```

#### **GPS Location Fix**

```
When: Start location seems wrong, distances off
How: Change URL to: ?reset=location
Wait: 5 seconds
Return: Remove ?reset=location parameter
Result: Auto-start will re-detect from next GPS reading
Viewer impact: ~5 second overlay refresh
```

#### **Complete Trip Reset**

```
When: Starting entirely new journey
How: Change URL to: ?export=true&reset=trip
Wait: 15 seconds (backup + reset)
Return: Remove parameters
Result: Backup saved, overlay reset to 0km
Viewer impact: ~15 second overlay refresh
```

## **🎛️ IRLToolkit Dashboard Optimization**

### **Method 1: URL Presets (Recommended)**

Create multiple Browser Sources with different URLs:

```
Source 1: "Trip Overlay - Normal"
URL: https://your-username.github.io/trip-overlay/

Source 2: "Trip Overlay - Daily Reset"
URL: https://your-username.github.io/trip-overlay/?reset=today

Source 3: "Trip Overlay - Backup"
URL: https://your-username.github.io/trip-overlay/?export=true

Source 4: "Trip Overlay - GPS Fix"
URL: https://your-username.github.io/trip-overlay/?reset=location
```

**Live Management:**

1. **Disable Source 1**, **Enable Source 2** (5 seconds)
2. **Disable Source 2**, **Enable Source 1** (back to normal)
3. **Faster than editing URLs** and less error-prone

### **Method 2: Quick URL Bookmarks**

Save these URLs in IRLToolkit dashboard bookmarks:

```
Normal: https://your-username.github.io/trip-overlay/
Daily:  https://your-username.github.io/trip-overlay/?reset=today
Backup: https://your-username.github.io/trip-overlay/?export=true
GPS:    https://your-username.github.io/trip-overlay/?reset=location
New:    https://your-username.github.io/trip-overlay/?export=true&reset=trip
```

## **🛡️ Best Practices for Live Streaming**

### **Pre-Stream Checklist**

- ✅ **Test locally first** - verify RTIRL connection in regular browser
- ✅ **Export backup** - run `exportTripData()` in local console
- ✅ **Verify GitHub Pages** - ensure overlay loads correctly
- ✅ **Check IRLToolkit** - confirm browser source working
- ✅ **Plan route** - set correct total distance in config

### **During Stream Management**

- 🎯 **Communicate actions**: "Just updating the travel tracker for you guys"
- ⏱️ **Wait full duration**: Don't rush parameter changes
- 🔄 **Return quickly**: Back to normal URL to minimize disruption
- 📱 **Watch feedback**: Success messages appear in overlay
- 💬 **Engage viewers**: "Ok, daily distance reset - ready for today's ride!"

### **Viewer Experience Priority**

- ✨ **Minimal disruption** - actions take 5-15 seconds max
- 🎨 **Clean overlay** - no management buttons visible to viewers
- 📺 **Professional quality** - smooth transitions, reliable tracking
- 🏍️ **Engaging content** - progress tracking adds to travel narrative

## **🚨 Emergency Scenarios**

### **Overlay Shows Wrong Numbers**

```
Problem: Distances look completely incorrect
Quick Fix:
1. ?export=true (10 sec - backup current data)
2. ?reset=trip (5 sec - fresh start)
3. Return to normal URL
Total downtime: ~15 seconds
Explanation to viewers: "Just fixing a GPS glitch, back in a moment!"
```

### **Progress Not Updating**

```
Problem: Numbers stuck, avatar not moving
Quick Fix:
1. ?reset=location (5 sec - restart GPS detection)
2. Return to normal URL
Total downtime: ~5 seconds
Explanation: "Refreshing GPS connection"
```

### **Need Mid-Stream Backup**

```
Problem: Something feels wrong, want to save progress
Quick Fix:
1. ?export=true (10 sec - downloads backup)
2. Return to normal URL
Total downtime: ~10 seconds
Explanation: "Just saving our progress"
```

### **Starting New Travel Day**

```
Problem: Yesterday's distance still showing
Quick Fix:
1. ?reset=today (5 sec - zero daily counter)
2. Return to normal URL
Total downtime: ~5 seconds
Explanation: "Resetting for today's adventure!"
```

## **📈 Multi-Day Tour Example**

### **Prague → Vienna → Budapest Tour**

**Day 1: Prague to Vienna (205km)**

```
Config: TOTAL_DISTANCE_KM = 205
Stream: Normal overlay URL
Progress: 0km → 180km (didn't quite make it)
End of day: Export backup for safety
```

**Day 2: Complete to Vienna + Start to Budapest (25km + 214km)**

```
Stream start: Use ?reset=today (keeps 180km total, zeros daily)
Progress: Daily 0km → 25km (reach Vienna) → 239km (toward Budapest)
Total: 180km → 419km
Config update: Change TOTAL_DISTANCE_KM = 419 for new endpoint
```

**Day 3: Continue to Budapest**

```
Stream start: Use ?reset=today again (keeps total, fresh daily)
Progress: Complete remaining distance to Budapest
```

## **⚙️ Technical Deep Dive**

### **IRLToolkit Cloud Environment**

- **Browser Context**: Isolated Chrome instance on IRLToolkit servers
- **localStorage**: Persists within IRLToolkit's cloud browser
- **Downloads**: Backup files saved to IRLToolkit system storage
- **Performance**: Generally excellent, servers optimized for streaming

### **GitHub Pages Hosting Benefits**

- **Reliability**: 99.9% uptime SLA
- **Speed**: Global CDN ensures fast loading
- **Security**: HTTPS included (required for browser sources)
- **Cost**: Free forever for public repositories
- **Maintenance**: Automatic SSL renewal, no server management

### **URL Parameter System**

- **Execution Speed**: 1-5 seconds for most actions
- **Error Handling**: Graceful failures with console warnings
- **Visual Feedback**: Success/error messages shown in overlay
- **Safety**: Parameters auto-clear after action completion

### **Data Persistence Strategy**

- **Primary**: localStorage in IRLToolkit cloud browser
- **Backup**: Manual export/import via URL parameters
- **Sync**: Not automatic - requires manual backup/restore
- **Redundancy**: Export before major changes recommended

## **🎯 Why This Setup Works**

**For Streamers:**

- ✅ **Professional quality** without technical complexity
- ✅ **Reliable hosting** that won't go down mid-stream
- ✅ **Quick management** without breaking viewer experience
- ✅ **Emergency recovery** options for any situation

**For Viewers:**

- ✅ **Clean, engaging overlay** that enhances travel content
- ✅ **Minimal disruptions** for management actions
- ✅ **Professional appearance** with smooth animations
- ✅ **Real-time progress** that builds excitement

**Technical Benefits:**

- ✅ **Cloud infrastructure** handles all hosting complexity
- ✅ **Version control** via GitHub for easy updates
- ✅ **Global accessibility** works from anywhere
- ✅ **Cost-effective** completely free hosting solution

This combination of **IRLToolkit cloud streaming** + **GitHub Pages hosting** + **URL parameter management** provides the optimal balance of **professional quality**, **ease of use**, and **reliable performance** for IRL motorcycle streaming.

---

**Happy streaming! 🏍️📺**

_Built for the IRL community with ❤️_
