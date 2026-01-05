# Transporter Base Location Update Feature

## Overview
Existing transporters can now add or update their base location (address and GPS coordinates) through their profile page. This is essential for the 50km radius delivery job filtering system.

## What Was Changed

### Frontend Changes (Profile.jsx)

1. **Added State Fields**
   - `transporterVillage` - Transporter's village/area
   - `transporterThana` - Transporter's thana/upazila
   - `transporterDistrict` - Transporter's district
   - Coordinates stored in existing `mapCoordinates` state

2. **Updated Data Loading**
   - `fetchProfile()` now loads `baseLocation` data from API
   - Sets `mapCoordinates` from either `farmLocation` (farmers) or `baseLocation` (transporters)

3. **Added UI Section**
   - New "Base Location" section for transporters (blue background)
   - Contains:
     - Village/Area input field
     - Thana/Upazila input field
     - District input field
     - MapSelector integration for GPS coordinates
     - Warning message: "You'll only see delivery jobs within 50km of this address"
     - Shows current coordinates when set
     - Orange warning if no location set: "⚠️ No GPS location set - you won't see delivery jobs until you set your location"

4. **Updated Form Submission**
   - `handleSubmit()` now includes `baseLocation` in `updateData` for transporters
   - Structure: `{ village, thana, district, coordinates: { lat, lng } }`

5. **Updated Cancel Handler**
   - Resets transporter base location fields to saved values
   - Restores correct coordinates (farmer or transporter based on role)

### Backend Changes (userController.js)

1. **Updated `updateProfile()` Function**
   - Now accepts `baseLocation` in request body for transporters
   - Saves `baseLocation` to user document
   - Returns `baseLocation` in response data

## How It Works

### For New Transporters (Registration)
- Already implemented in Register.jsx
- Transporters provide base location during registration
- Immediately get 50km radius filtering

### For Existing Transporters (Profile Update)
1. Transporter logs in
2. Goes to Profile page
3. Clicks "Edit Profile" button
4. Sees new "Base Location" section
5. Fills in:
   - Village/Area
   - Thana/Upazila
   - District
6. Clicks "Set Location on Map" button
7. MapSelector opens
8. Clicks on map to set GPS coordinates
9. Coordinates display below map
10. Clicks "Save Changes"
11. Location saved to database
12. Now sees only jobs within 50km radius in "Available Jobs"

## Testing Checklist

### Test Case 1: Existing Transporter Without Location
- [ ] Log in as existing transporter
- [ ] Go to Profile page
- [ ] Verify orange warning shows: "No GPS location set"
- [ ] Click "Edit Profile"
- [ ] Verify "Base Location" section appears (blue background)
- [ ] Fill in village, thana, district
- [ ] Click "Set Location on Map"
- [ ] Select location on map
- [ ] Verify coordinates display (e.g., "📍 Location: 23.8103, 90.4125")
- [ ] Click "Save Changes"
- [ ] Verify success message: "Profile updated successfully!"
- [ ] Verify green message shows: "📍 Location: [coordinates]"

### Test Case 2: Update Existing Location
- [ ] Log in as transporter with location already set
- [ ] Go to Profile page
- [ ] Verify current location shows in green
- [ ] Click "Edit Profile"
- [ ] See current village, thana, district pre-filled
- [ ] See current coordinates displayed
- [ ] Click "Update Location"
- [ ] Select new location on map
- [ ] Verify new coordinates display
- [ ] Click "Save Changes"
- [ ] Verify location updated successfully

### Test Case 3: Cancel Without Saving
- [ ] Log in as transporter
- [ ] Go to Profile page
- [ ] Click "Edit Profile"
- [ ] Change village/thana/district
- [ ] Change location on map
- [ ] Click "Cancel"
- [ ] Verify changes are discarded
- [ ] Verify original location still shows

### Test Case 4: Job Filtering After Setting Location
- [ ] Log in as transporter without location
- [ ] Go to "Available Jobs"
- [ ] Verify no jobs show or all jobs show as "Too Far"
- [ ] Go to Profile page
- [ ] Set base location (e.g., Dhaka - 23.8103, 90.4125)
- [ ] Save changes
- [ ] Go back to "Available Jobs"
- [ ] Verify jobs within 50km show with green "Within Service Area" badge
- [ ] Verify distant jobs show orange warning: "This job is outside your 50km service radius"
- [ ] Verify "Accept" button disabled for distant jobs

### Test Case 5: Distance Calculation Accuracy
- [ ] Set transporter location to known coordinates
- [ ] Create test order with farmer and buyer at known distances
- [ ] Verify distance calculations shown are accurate
- [ ] Verify jobs sort correctly (closest first)

## Important Notes

1. **GPS Coordinates Required**: Transporters MUST set GPS coordinates (not just address text) for the 50km filtering to work
2. **Both Distances Checked**: Distance calculated to BOTH farmer (pickup) AND buyer (delivery) locations
3. **Fixed Radius**: 50km radius for all transporters (not configurable per transporter)
4. **Map Required**: Coordinates cannot be entered manually - must use MapSelector
5. **Backwards Compatible**: Existing transporters without location can still log in, but won't see filtered jobs until they set location

## Files Modified

### Frontend
- `frontend/src/pages/Profile.jsx` - Added transporter base location update UI and logic

### Backend
- `backend/controllers/userController.js` - Added baseLocation handling in updateProfile

### Previously Modified (From Registration Implementation)
- `backend/models/User.js` - baseLocation schema
- `frontend/src/pages/Register.jsx` - base location during registration
- `backend/controllers/authController.js` - saves baseLocation during registration
- `backend/controllers/transporterController.js` - filters jobs by distance
- `frontend/src/pages/transporter/AvailableJobs.jsx` - displays distance info

## API Endpoints

### GET /api/users/profile
**Response includes:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Transporter",
    "role": "transporter",
    "vehicleType": "truck",
    "vehicleNumber": "DH-1234",
    "licenseNumber": "DL123456",
    "baseLocation": {
      "village": "Mirpur",
      "thana": "Mirpur",
      "district": "Dhaka",
      "coordinates": {
        "lat": 23.8103,
        "lng": 90.4125
      }
    }
  }
}
```

### PUT /api/users/profile
**Request body (for transporter):**
```json
{
  "name": "John Transporter",
  "phone": "01712345678",
  "vehicleType": "truck",
  "vehicleNumber": "DH-1234",
  "licenseNumber": "DL123456",
  "baseLocation": {
    "village": "Mirpur",
    "thana": "Mirpur",
    "district": "Dhaka",
    "coordinates": {
      "lat": 23.8103,
      "lng": 90.4125
    }
  }
}
```

## Next Steps

1. Test the profile update feature thoroughly
2. Verify job filtering works correctly after location update
3. Consider adding validation:
   - Require coordinates if village/thana/district are filled
   - Validate coordinates are within Bangladesh bounds
4. Consider adding features:
   - "My Service Area" map view showing 50km radius circle
   - Location history (track when location was last updated)
   - Multiple base locations (for transporters who operate from multiple areas)

## Support

If a transporter reports not seeing any jobs:
1. Check if they have set their base location in Profile
2. Check if coordinates are valid (not null/undefined)
3. Check if there are any jobs within 50km of their location
4. Verify distance calculator is working correctly
