# Google Maps API Key Setup - Quick Guide

## ⚠️ Current Issue
The map is showing blank because the demo API key `AIzaSyDemoKeyForDevelopment` is **not a valid key**. You need to get a real API key from Google Cloud Console.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name it "Krishak Maps" (or any name)
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ **Maps JavaScript API**
     - ✅ **Geocoding API**
   - Click "Enable" for each

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key (it looks like: `AIzaSy...`)

### Step 2: Update Your Code

Open `frontend/index.html` and replace line 9:

```html
<!-- OLD (Demo Key - Not Working) -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKeyForDevelopment&libraries=places" async defer></script>

<!-- NEW (Your Real Key) -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places" async defer></script>
```

**Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual key from Step 1.**

### Step 3: Configure API Key Restrictions (Recommended)

1. In Google Cloud Console, go to "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add these referrers:
     - `http://localhost:5174/*`
     - `http://localhost:5173/*`
     - `http://localhost:3000/*`
     - (Add your production domain when ready)
4. Under "API restrictions":
   - Select "Restrict key"
   - Check only:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
5. Click "Save"

### Step 4: Test

1. Save `frontend/index.html`
2. Refresh your browser (hard refresh: Ctrl+Shift+R)
3. Go to Checkout page
4. Select "Select on Map"
5. The map should now load! 🎉

## 💰 Billing Note

- Google Maps has a **free tier**: $200 credit per month
- This covers ~28,000 map loads per month (free)
- For development/testing, you likely won't exceed this
- You need to add a payment method, but won't be charged unless you exceed the free tier

## 🔍 Troubleshooting

### Map Still Shows Blank

1. **Check browser console** (F12) for errors
2. **Verify API key** is correct in `index.html`
3. **Check API restrictions** - make sure localhost is allowed
4. **Verify APIs are enabled** in Google Cloud Console
5. **Wait 5 minutes** - API key changes can take a few minutes to propagate

### "This API key is not authorized"

- Check API restrictions in Google Cloud Console
- Make sure Maps JavaScript API and Geocoding API are enabled
- Verify HTTP referrers include your localhost URL

### "RefererNotAllowedMapError"

- Add your localhost URL to HTTP referrer restrictions
- Format: `http://localhost:5174/*` (with the `/*` at the end)

## 📝 Alternative: Use Environment Variable (Optional)

If you want to keep the API key out of the HTML file:

1. Create `frontend/.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

2. Update `frontend/index.html`:
```html
<script>
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDemoKeyForDevelopment';
</script>
<script src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`} async defer></script>
```

## ✅ Success Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Maps JavaScript API
- [ ] Enabled Geocoding API
- [ ] Created API key
- [ ] Updated `frontend/index.html` with real key
- [ ] Configured API restrictions
- [ ] Tested map loads successfully
- [ ] Can click on map to pin location
- [ ] Address auto-fills correctly

---

**Need Help?** Check the browser console (F12) for specific error messages.

