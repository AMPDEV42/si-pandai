# 🔧 Google Drive Domain Authorization Fix

## Problem Identified
The Google Drive API is failing to initialize because the current domain is not authorized in Google Cloud Console.

**Current Domain:** `https://b9336ce132d447108bf102651e77ea46-95c86a90e3364f9e810d493bb.fly.dev`

## Error Analysis
- GAPI client initialization fails with empty error objects
- Domain authorization error (though not explicitly shown due to poor error serialization)
- The fly.dev domain needs to be whitelisted in Google Cloud Console

## Solution Steps

### 1. Update Google Cloud Console OAuth Configuration

1. **Open Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services > Credentials
3. **Find your OAuth 2.0 Client ID** (the one with ID: `47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com`)
4. **Click Edit** on the OAuth client
5. **Add to "Authorized JavaScript origins"**:
   ```
   https://b9336ce132d447108bf102651e77ea46-95c86a90e3364f9e810d493bb.fly.dev
   ```
6. **Keep existing domains** (for development):
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. **Save** the changes

### 2. Wait for Propagation
- Changes can take **5-10 minutes** to propagate
- Google's servers need time to update the authorization list

### 3. Test the Integration
1. Open the test page: `/test/google-drive`
2. Run the debug test to see detailed domain information
3. Try the authentication flow

## Alternative Solutions

### Option A: Use a Custom Domain
If you have a custom domain, configure it instead:
1. Set up custom domain in fly.io
2. Add the custom domain to Google Cloud Console
3. Use HTTPS (required for OAuth)

### Option B: Development Mode
For testing, you can temporarily use localhost:
1. Run the app locally: `npm run dev`
2. Access via `http://localhost:5173`
3. This domain should already be authorized

## Debugging Tools

### Console Debug Command
Run this in browser console to check domain authorization:
```javascript
debugGoogleDrive()
```

### Manual Domain Check
```javascript
console.log('Current domain:', window.location.origin);
console.log('Is HTTPS:', window.location.protocol === 'https:');
```

## Prevention for Future Deployments

When deploying to new domains:
1. **Always add the new domain** to Google Cloud Console BEFORE deployment
2. **Use environment variables** for domain-specific configurations
3. **Test authentication** immediately after deployment
4. **Set up monitoring** for authentication failures

## Common Issues

### Issue: "Origin not allowed"
- **Cause**: Domain not in authorized JavaScript origins
- **Fix**: Add exact domain to Google Cloud Console

### Issue: "Empty error objects"
- **Cause**: GAPI error serialization issue
- **Fix**: Use improved error handling (already implemented)

### Issue: "Popup blocked"
- **Cause**: Browser blocking OAuth popup
- **Fix**: User needs to allow popups for the domain

## Current Status
- ✅ Environment variables configured correctly
- ✅ API key and Client ID present
- ✅ Improved error handling implemented
- ❌ **Domain authorization missing** ← THIS IS THE MAIN ISSUE
- ❌ Need to update Google Cloud Console

## Next Steps
1. **Immediately**: Add the fly.dev domain to Google Cloud Console
2. **Wait**: 5-10 minutes for propagation
3. **Test**: Use the Google Drive test page
4. **Monitor**: Check for successful authentication

---

**Note**: The specific fly.dev subdomain changes with each deployment. For production, consider using a custom domain with predictable URLs.
