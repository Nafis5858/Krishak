# KRISHAK PROJECT - STARTUP GUIDE

## ✅ Project Status
- Backend: ✓ Configured (Port 5000)
- Frontend: ✓ Configured (Port 5174)
- Database: ✓ MongoDB Atlas Connected
- Environment Variables: ✓ All set

## 🚀 HOW TO START YOUR PROJECT

### EASIEST WAY - Run This File:
Simply double-click: **`run-project-complete.bat`**

This script will:
1. ✓ Check and install dependencies if needed
2. ✓ Verify .env files exist
3. ✓ Start backend server (Port 5000)
4. ✓ Start frontend server (Port 5174)
5. ✓ Open browser automatically to http://localhost:5174

### MANUAL WAY - Open Two Command Terminals:

**Terminal 1 - Backend:**
```cmd
cd f:\Krishak-main\backend
npm install
npm run dev
```

Expected output:
```
--- DEBUG START ---
JWT_SECRET is: Loaded
MONGO_URI is: Loaded
--- DEBUG END ---
MongoDB Connected: krishak-cluster.fxbz06y.mongodb.net
Database: krishak
Server running in development mode on port 5000
```

**Terminal 2 - Frontend:** (after backend starts)
```cmd
cd f:\Krishak-main\frontend
npm install
npm run dev
```

Expected output:
```
VITE v7.2.7  ready in XXX ms

➜  Local:   http://localhost:5174/
```

Then open browser to: **http://localhost:5174**

## ✅ What You Should See

1. **Krishak Homepage** - Agricultural marketplace
2. **Features Available:**
   - ✓ Product browsing
   - ✓ User login/registration
   - ✓ Shopping cart
   - ✓ Order management
   - ✓ Dashboards for all roles
   - ✓ Product images display
   - ✓ Admin panel

## 🔧 Troubleshooting

### Backend won't start:
```cmd
cd f:\Krishak-main\backend
npm install
npm run dev
```

### Frontend won't start:
```cmd
cd f:\Krishak-main\frontend
npm install
npm run dev
```

### Port 5000 already in use:
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Browser shows blank or errors:
1. Check backend is running (http://localhost:5000)
2. Check frontend is running (http://localhost:5174)
3. Check browser console for errors (F12)
4. Clear browser cache and reload

## 📝 Project Details

- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite + TailwindCSS
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** JWT Token Based
- **API Base:** http://localhost:5000/api

---

**Ready to start? Double-click `run-project-complete.bat` now!**
