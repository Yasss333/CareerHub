# SeniorConnect Deployment Guide - Render

## Overview
Deploy your SeniorConnect mentorship platform on Render with MongoDB Atlas for the database.

## Prerequisites
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- GitHub repository with your code

## Part 1: MongoDB Atlas Setup (Database)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new project (e.g., "SeniorConnect")

### 2. Create Database Cluster
1. Click "Build a Database"
2. Choose "M0 Free" (512MB storage - perfect for development)
3. Select region closest to your users
4. Cluster name: "SeniorConnect"
5. Click "Create"

### 3. Get Connection String
1. Go to Database → Connect
2. Choose "Connect your application"
3. Select Node.js version
4. Copy the connection string
5. Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/seniorconnect`

### 4. Create Database User
1. Go to Database Access → Add New Database User
2. Username: `seniorconnect` (or your choice)
3. Password: Generate strong password
4. Database User Privileges: Read and write to any database
5. Click "Create User"

### 5. Network Access
1. Go to Network Access → Add IP Address
2. Choose "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

## Part 2: Backend Deployment (Render)

### 1. Prepare Backend Files

#### Create `render.yaml` in server directory:
```yaml
services:
  - type: web
    name: seniorconnect-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: CLIENT_ORIGIN
        sync: false
      - key: PORT
        value: 5000
```

#### Update `server/package.json` (if needed):
```json
{
  "name": "seniorconnect-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "jsonwebtoken": "^9.0.0",
    "express-validator": "^6.15.0"
  }
}
```

#### Ensure `.gitignore` in server directory:
```
node_modules
.env
.DS_Store
```

### 2. Deploy Backend on Render

#### Option A: Using Render Dashboard (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the `SeniorConnect` repository
5. **Root Directory**: `server`
6. **Build Command**: `npm install`
7. **Start Command**: `node server.js`
8. **Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/seniorconnect
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   CLIENT_ORIGIN=https://your-frontend-url.onrender.com
   PORT=5000
   ```
9. Click "Deploy Web Service"

#### Option B: Using `render.yaml` (Automated)
1. Push your code to GitHub with the `render.yaml` file
2. Go to Render Dashboard → "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect and deploy using the YAML file

### 3. Verify Backend Deployment
1. Wait for deployment to complete
2. Copy the backend URL (e.g., `https://seniorconnect-backend.onrender.com`)
3. Test health endpoint: `https://your-backend-url.onrender.com/health`
4. Should return: `{"status":"ok"}`

## Part 3: Frontend Deployment (Render)

### 1. Update Frontend Configuration

#### Update `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Remove proxy for production - use API URL directly
    // proxy: {
    //   '/auth':         'http://localhost:5000',
    //   '/seniors':      'http://localhost:5000',
    //   '/sessions':     'http://localhost:5000',
    //   '/availability': 'http://localhost:5000',
    //   '/profile':      'http://localhost:5000',
    //   '/credibility':  'http://localhost:5000',
    // },
  },
});
```

#### Create `frontend/.env.production`:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

#### Update `frontend/package.json` (if needed):
```json
{
  "name": "seniorconnect-frontend",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. Deploy Frontend on Render

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Start Command**: `npm run preview` (or use Static Site option)
6. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
7. Click "Deploy Web Service"

### Alternative: Static Site Deployment (Better for Frontend)
1. Go to Render Dashboard → "New" → "Static Site"
2. Connect your GitHub repository
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Publish Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
7. Click "Deploy Static Site"

## Part 4: CORS Configuration

### Update Backend CORS
In `server/server.js`, update the CORS configuration:

```javascript
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true 
}));
```

Make sure `CLIENT_ORIGIN` in Render environment variables is set to your frontend URL.

## Part 5: Final Configuration

### Update Environment Variables

#### Backend Environment Variables (Render):
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/seniorconnect
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_make_it_long_and_random
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-frontend-url.onrender.com
PORT=5000
```

#### Frontend Environment Variables (Render):
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Part 6: Testing the Deployment

### 1. Test Backend
```bash
curl https://your-backend-url.onrender.com/health
# Expected: {"status":"ok"}
```

### 2. Test Frontend
1. Open your frontend URL
2. Navigate to landing page
3. Try to sign up/login
4. Test the full workflow

### 3. Test Meeting Integration
1. Book a session
2. Accept as mentor
3. Start meeting
4. Verify Jitsi meeting opens correctly

## Part 7: Troubleshooting

### Common Issues:

#### 1. MongoDB Connection Error
- **Solution**: Check IP whitelist in MongoDB Atlas (0.0.0.0/0)
- **Solution**: Verify username/password in connection string
- **Solution**: Ensure database user has correct permissions

#### 2. CORS Errors
- **Solution**: Update `CLIENT_ORIGIN` to match your frontend URL exactly
- **Solution**: Include http/https correctly

#### 3. Frontend Build Errors
- **Solution**: Ensure all dependencies are in package.json
- **Solution**: Check for TypeScript errors locally first
- **Solution**: Verify VITE_API_URL is set correctly

#### 4. API Connection Issues
- **Solution**: Test backend health endpoint first
- **Solution**: Check browser console for network errors
- **Solution**: Verify VITE_API_URL in frontend env vars

## Part 8: Free Tier Limits

### Render Free Tier:
- **Web Services**: 750 hours/month
- **Static Sites**: Unlimited
- **Build Minutes**: 1,500/month
- **Sleep Time**: 15 minutes of inactivity

### MongoDB Atlas Free Tier:
- **Storage**: 512MB
- **RAM**: Shared
- **Connections**: Limited but sufficient for development

## Part 9: Custom Domain (Optional)

### Add Custom Domain:
1. Go to your service settings in Render
2. Add custom domain
3. Update DNS records with your domain provider
4. SSL certificate automatically provisioned

## Quick Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Backend deployed on Render
- [ ] Backend health endpoint working
- [ ] Frontend deployed on Render
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Jitsi integration tested
- [ ] Full user workflow tested

## Cost Summary

### Free Tier (Current):
- **Render**: $0/month
- **MongoDB Atlas**: $0/month
- **Jitsi Meet**: $0/month (public servers)
- **Total**: $0/month

### When to Upgrade:
- More than 100 users/month
- Need custom domain
- Faster performance required
- More storage needed

Your SeniorConnect application is now ready for production deployment on Render!