# How to Get Google Maps API Key - Step by Step Guide

## 🎯 Quick Overview
You need a Google Maps API key to make the map work. It's free for development (up to $200/month credit).

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Open your browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account (Gmail account works)

---

### Step 2: Create a New Project

1. Click the **project dropdown** at the top (it might say "Select a project" or show a project name)
2. Click **"New Project"** button
3. Fill in:
   - **Project name**: `Krishak Maps` (or any name you like)
   - **Organization**: Leave as default (or select if you have one)
4. Click **"Create"** button
5. Wait a few seconds for the project to be created
6. **Select the new project** from the dropdown (it should auto-select)

---

### Step 3: Enable Required APIs

You need to enable two APIs:

#### Enable Maps JavaScript API:
1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type: **"Maps JavaScript API"**
3. Click on **"Maps JavaScript API"** from the results
4. Click the blue **"Enable"** button
5. Wait for it to enable (shows a checkmark when done)

#### Enable Geocoding API:
1. Still in the "Library" page, search for: **"Geocoding API"**
2. Click on **"Geocoding API"**
3. Click the blue **"Enable"** button
4. Wait for it to enable

✅ **Both APIs should now be enabled!**

---

### Step 4: Create API Key

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. At the top, click **"+ CREATE CREDENTIALS"** button
3. Select **"API key"** from the dropdown
4. **Your API key will be created!** It looks like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
5. **Copy the key** - click the copy icon or select and copy (Ctrl+C)
6. **IMPORTANT**: Don't close this window yet! You need to configure it.

---

### Step 5: Configure API Key (Security)

1. You should see a popup saying "API key created"
2. Click **"Restrict key"** (or click "Edit API key" if the popup closed)
3. You'll see two sections to configure:

#### A. Application Restrictions:
1. Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
2. Click **"+ ADD AN ITEM"**
3. Add these one by one (click "Add item" after each):
   - `http://localhost:5174/*`
   - `http://localhost:5173/*`
   - `http://localhost:3000/*`
   - `http://127.0.0.1:5174/*`
4. This allows the key to work on your local development server

#### B. API Restrictions:
1. Under **"API restrictions"**, select **"Restrict key"**
2. Check ONLY these two:
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API**
3. This limits what the key can do (security best practice)

4. Click **"Save"** button at the bottom
5. Wait for it to save

---

### Step 6: Add Payment Method (Required but Free)

**Don't worry!** Google gives you $200 free credit per month, which is plenty for development.

1. In the left sidebar, click **"Billing"**
2. If you don't have billing set up:
   - Click **"Link a billing account"** or **"Create billing account"**
   - Fill in your payment information (credit card)
   - **You won't be charged** unless you exceed $200/month (very unlikely for development)
3. If you already have billing, you're good!

**Note**: The free tier covers:
- ~28,000 map loads per month
- ~40,000 geocoding requests per month
- More than enough for testing and development!

---

### Step 7: Use Your API Key in the Project

1. Open your project file: `frontend/index.html`
2. Find line 9 that says:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKeyForDevelopment&libraries=places" async defer></script>
   ```
3. Replace `AIzaSyDemoKeyForDevelopment` with **your actual API key**
4. It should look like:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567&libraries=places" async defer></script>
   ```
5. **Save the file**

---

### Step 8: Test It!

1. **Restart your frontend server** (if it's running):
   - Stop it (Ctrl+C)
   - Start it again: `cd frontend && npm run dev`
2. **Hard refresh your browser**: Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Go to the Checkout page
4. Select **"Select on Map"**
5. **The map should now load!** 🎉

---

## 🎯 Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Maps JavaScript API
- [ ] Enabled Geocoding API
- [ ] Created API key
- [ ] Configured HTTP referrer restrictions
- [ ] Configured API restrictions
- [ ] Added payment method (for free tier)
- [ ] Updated `frontend/index.html` with real key
- [ ] Restarted frontend server
- [ ] Tested map loads successfully

---

## ❓ Troubleshooting

### "This API key is not authorized"
- Make sure you enabled both APIs (Maps JavaScript API and Geocoding API)
- Check that API restrictions allow these APIs

### "RefererNotAllowedMapError"
- Make sure you added localhost URLs to HTTP referrer restrictions
- Format should be: `http://localhost:5174/*` (with `/*` at the end)
- Wait 5 minutes after saving - changes can take time to propagate

### Map still shows blank
- Check browser console (F12) for specific errors
- Verify the API key is correct in `index.html`
- Make sure you saved the file
- Hard refresh browser (Ctrl+Shift+R)
- Wait a few minutes - API key changes can take time

### "Billing account required"
- You need to add a payment method
- You won't be charged unless you exceed $200/month
- This is required even for the free tier

---

## 💡 Pro Tips

1. **Keep your API key secret** - Don't commit it to public GitHub repos
2. **Use environment variables** for production (see `GOOGLE_MAPS_API_KEY_SETUP.md`)
3. **Monitor usage** in Google Cloud Console → APIs & Services → Dashboard
4. **Set up billing alerts** to get notified if you approach limits

---

## 📞 Need More Help?

- Check browser console (F12) for specific error messages
- Google Cloud Console has a help section
- Google Maps API documentation: https://developers.google.com/maps/documentation/javascript

---

**That's it!** Once you complete these steps, your map should work perfectly! 🗺️

