# 🚀 KRISHAK PROJECT - COMPLETE STARTUP GUIDE

## Project Status: ✅ READY TO RUN

All systems are configured and ready. Your project has:

✓ Backend configured (Node.js + Express + MongoDB)
✓ Frontend configured (React + Vite)
✓ Database connection ready (MongoDB Atlas)
✓ Environment variables set correctly
✓ All dependencies configured

---

## 🎯 START YOUR PROJECT IN 30 SECONDS

### Option 1: AUTOMATIC (Recommended)
**Double-click this file:**
```
f:\Krishak-main\startup-with-diagnostics.bat
```

This will:
1. Check everything is installed
2. Install missing dependencies automatically
3. Start both servers
4. Open your browser to http://localhost:5174

### Option 2: QUICK START
**Double-click this file:**
```
f:\Krishak-main\run-project-complete.bat
```

---

## 📋 MANUAL START (if scripts don't work)

**Terminal 1 - Backend:**
```batch
cd f:\Krishak-main\backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```batch
cd f:\Krishak-main\frontend
npm install
npm run dev
```

Then open: http://localhost:5174

---

## ✅ What You'll See

1. **Krishak Homepage** - Agricultural marketplace interface
2. **Full Features:**
   - Browse farmer products
   - User login/registration
   - Shopping cart
   - Order management
   - Role-based dashboards
   - Product images
   - Admin panel

---

## 🔗 Important URLs

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:5000/api |
| Backend Health | http://localhost:5000 |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** JWT Tokens
- **File Upload:** Multer (Local storage)

---

## 📂 Project Structure

```
krishak-main/
├── backend/          (Node.js/Express)
│   ├── routes/       (API endpoints)
│   ├── controllers/  (Business logic)
│   ├── models/       (MongoDB schemas)
│   ├── middleware/   (Auth, uploads)
│   └── server.js     (Main entry point)
├── frontend/         (React/Vite)
│   ├── src/
│   │   ├── pages/    (Page components)
│   │   ├── services/ (API calls)
│   │   ├── context/  (Global state)
│   │   └── App.jsx   (Root component)
│   └── vite.config.js
└── Documentation files
```

---

## ⚡ Quick Troubleshooting

### Issue: "Connection Refused"
- Make sure both servers are running
- Check backend is on port 5000: `netstat -ano | findstr :5000`
- Check frontend is on port 5174: `netstat -ano | findstr :5174`

### Issue: "MongoDB Connection Failed"
- MONGO_URI is already configured
- Check internet connection (MongoDB Atlas is cloud-based)

### Issue: "Port already in use"
```batch
REM Find process using port 5000
netstat -ano | findstr :5000

REM Kill it (replace PID with actual number)
taskkill /PID 12345 /F
```

### Issue: "npm install fails"
```batch
cd f:\Krishak-main\backend
rm -r node_modules package-lock.json
npm install
```

---

## 🎓 Next Steps

1. **Start the project** using one of the scripts above
2. **Create an account** on the frontend
3. **Explore features:**
   - As Farmer: Add products
   - As Buyer: Browse & buy
   - As Admin: View dashboard
4. **Check the backend API** at http://localhost:5000/api

---

## 📞 Debug Tips

If something goes wrong, check:
1. **Backend Console** - Shows MongoDB connection and API logs
2. **Frontend Console** - Press F12 in browser, check Console tab
3. **Network Tab** - Check API requests are reaching backend

---

## ✨ Configuration Files

- **Backend Config:** `backend/.env` (MongoDB, JWT, Server)
- **Frontend Config:** `frontend/.env` (API URL, Google OAuth)
- **Server Entry:** `backend/server.js`
- **App Entry:** `frontend/src/App.jsx`

---

**Ready? Double-click `startup-with-diagnostics.bat` to start!** 🚀
