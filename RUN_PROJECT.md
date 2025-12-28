# KRISHAK PROJECT - RUN GUIDE

## Project Status
✅ All configuration files are in place
✅ Environment variables are set for MongoDB Atlas
✅ Backend and Frontend dependencies are installed
✅ Code is at stable commit (72a8e61)

## To Run Your Project:

### TERMINAL 1 - Start Backend Server:
```
cd f:\Krishak-main\backend
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

### TERMINAL 2 - Start Frontend Server:
```
cd f:\Krishak-main\frontend
npm run dev
```

Expected output:
```
VITE v7.2.7  ready in XXX ms
➜  Local:   http://localhost:5174/
```

## Once Running:

1. Open browser to: http://localhost:5174
2. You should see the Krishak homepage
3. Test by:
   - Click "Browse Products" - shows farmer listings
   - Login/Register - creates users
   - Add to cart - tests shopping
   - View Dashboard - shows your order metrics (dynamically calculated)

## Database:
- Connected to: MongoDB Atlas (Cloud Database)
- Database name: krishak
- Has all required collections: users, products, orders, carts, etc.

## Features Working:
✅ Product browsing and listing
✅ User authentication (JWT)
✅ Shopping cart
✅ Order management
✅ Buyer dashboard with dynamic metrics
✅ Product images display
✅ Admin functionality
✅ Farmer product management
✅ Transporter delivery assignment

## Troubleshooting:
If backend won't start:
- Check MONGO_URI in backend/.env is correct
- Check port 5000 is not in use
- Run: npm install in backend folder

If frontend won't start:
- Check VITE_API_URL in frontend/.env is correct
- Clear browser cache
- Run: npm install in frontend folder
