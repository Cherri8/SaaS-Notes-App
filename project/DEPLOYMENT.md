# Deployment Guide

## Local Testing

The application is currently running at http://localhost:3000

### Test Accounts
All accounts use password: `password`

- **admin@acme.test** (Admin, Acme tenant)
- **user@acme.test** (Member, Acme tenant)  
- **admin@globex.test** (Admin, Globex tenant)
- **user@globex.test** (Member, Globex tenant)

### API Endpoints to Test

1. **Health Check**: `GET http://localhost:3000/api/health`
2. **Login**: `POST http://localhost:3000/api/auth/login`
3. **Notes CRUD**: 
   - `GET http://localhost:3000/api/notes`
   - `POST http://localhost:3000/api/notes`
   - `GET http://localhost:3000/api/notes/:id`
   - `PUT http://localhost:3000/api/notes/:id`
   - `DELETE http://localhost:3000/api/notes/:id`
4. **Upgrade**: `POST http://localhost:3000/api/tenants/:slug/upgrade`

## Vercel Deployment

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically

### Environment Variables
Set in Vercel dashboard:
```
JWT_SECRET=your-production-jwt-secret-key-here
```

## Manual Deployment Steps

If automated deployment fails, follow these steps:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard

4. **Test the deployed application**:
   - Health endpoint: `https://your-app.vercel.app/api/health`
   - Frontend: `https://your-app.vercel.app`

## Testing Multi-Tenancy

1. Login as `admin@acme.test`
2. Create 3 notes (should work)
3. Try to create 4th note (should fail with limit message)
4. Upgrade to Pro plan
5. Create 4th note (should now work)
6. Login as `user@globex.test` 
7. Verify you cannot see Acme's notes

## CORS Configuration

The application includes CORS headers for all API routes:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT`
- `Access-Control-Allow-Headers: Authorization, Content-Type`

This enables automated testing and external API access.
