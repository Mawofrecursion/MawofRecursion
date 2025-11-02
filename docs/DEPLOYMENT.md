# 🚀 Deployment Guide

## Quick Deploy to Cloudflare Pages

### Prerequisites
1. ✅ Domain purchased: `mawofrecursion.com` (on Cloudflare)
2. ✅ Cloudflare account created
3. ✅ GitHub repository created

### Step-by-Step Deployment

#### 1. Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - The maw opens ⦿"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/mawofrecursion.git

# Push to main
git push -u origin main
```

#### 2. Connect Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub
6. Select `mawofrecursion` repository

#### 3. Configure Build Settings

```
Project name: mawofrecursion
Production branch: main
Build directory: public
Build command: (leave empty - static site)
```

Click **Save and Deploy**

#### 4. Add Custom Domain

1. In Cloudflare Pages project settings, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `mawofrecursion.com`
4. Cloudflare will automatically:
   - Configure DNS
   - Provision SSL certificate
   - Set up CDN

**DNS should auto-configure since domain is already on Cloudflare**

#### 5. Verify Deployment

- Production URL: `https://mawofrecursion.com`
- Cloudflare Pages URL: `https://mawofrecursion.pages.dev`

Visit the site and test:
- Landing page loads with particle system ✓
- Navigation between pages works ✓
- EchoField payload initializes ✓
- Console shows: `⦿ MAW OF RECURSION` ✓

---

## Environment Variables

Currently none needed. If you add analytics or external services:

1. Go to **Settings** > **Environment variables**
2. Add variables:
   - `PLAUSIBLE_DOMAIN` (if using Plausible)
   - `SENTRY_DSN` (if using Sentry)

---

## Auto-Deployment

Once connected, **every push to `main` triggers automatic deployment:**

```bash
# Make changes
git add .
git commit -m "Add new consciousness protocol"
git push

# Cloudflare automatically:
# 1. Detects push
# 2. Builds site
# 3. Deploys to production
# 4. Invalidates CDN cache
```

**Preview Deployments:**
- Pushes to other branches create preview URLs
- Test changes before merging to main

---

## Rollback

If something breaks:

1. Go to **Deployments** tab in Cloudflare Pages
2. Find previous working deployment
3. Click **⋯** menu → **Rollback to this deployment**

---

## Performance Optimization

### Already Optimized
✓ Static HTML/CSS/JS (no build step)  
✓ Cloudflare CDN (global edge network)  
✓ CSS design tokens (minimal overhead)  
✓ Mobile-responsive particle system  

### Future Optimizations
- [ ] Minify CSS/JS for production
- [ ] Add service worker for offline support
- [ ] Implement image optimization
- [ ] Add preload hints for critical assets

---

## Monitoring

### Cloudflare Analytics

Free tier includes:
- Page views
- Bandwidth usage
- Geographic distribution
- Threats blocked

Access: **Analytics** tab in Cloudflare Pages project

### Custom Analytics (Optional)

**Plausible Analytics** (Privacy-friendly)
1. Sign up at [plausible.io](https://plausible.io)
2. Add script to all pages:
```html
<script defer data-domain="mawofrecursion.com" 
  src="https://plausible.io/js/script.js"></script>
```
3. Track custom events via EchoField payload

**Sentry Error Monitoring**
1. Sign up at [sentry.io](https://sentry.io)
2. Add SDK to `/assets/js/sentry-init.js`
3. Include in pages before echofield-payload

---

## Troubleshooting

### Site not loading
- Check DNS propagation: `nslookup mawofrecursion.com`
- Wait 5-10 minutes for Cloudflare DNS updates
- Clear browser cache

### Build failing
- Verify `public/` directory exists
- Check build logs in Cloudflare Pages dashboard
- Ensure no build command is set (static site)

### Changes not showing
- Cloudflare caches aggressively
- Use **Purge Cache** in Cloudflare dashboard
- Or append `?v=timestamp` to URLs for testing

### JavaScript not working
- Check browser console for errors
- Verify `/assets/js/` files are accessible
- Check `Content-Security-Policy` headers if set

---

## Security Headers (Optional)

Add to Cloudflare Pages settings → **Headers**:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: interest-cohort=()
```

---

## Backup Strategy

### Automatic Backups
✓ Git repository is primary backup  
✓ Cloudflare keeps deployment history  
✓ Can rollback to any previous deployment  

### Manual Backups
```bash
# Clone repo to backup location
git clone https://github.com/yourusername/mawofrecursion.git backup/

# Or zip entire public/ directory
tar -czf maw-backup-$(date +%Y%m%d).tar.gz public/
```

---

## Cost Breakdown

### Cloudflare (Free Tier)
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ Free SSL
- ✅ Global CDN
- ✅ Auto-deploys

### Domain ($9-12/year)
- Cloudflare Registrar: ~$9/year
- Namecheap: ~$12/year

### Optional Services
- Plausible Analytics: ~$9/month
- Sentry Error Monitoring: Free tier available

**Total: ~$10-20/year** for basic setup

---

## Scaling

Site can handle:
- ✅ Millions of visitors/month (Cloudflare CDN)
- ✅ No database to overload
- ✅ No server-side rendering bottlenecks
- ✅ All computation client-side

**Cloudflare Pages free tier has no bandwidth limits!**

---

## Next Steps After Deployment

1. ✅ Site is live
2. Test all pages and protocols
3. Submit sitemap to Google Search Console
4. Share on social media
5. Monitor analytics for first visitors
6. Watch for first breakthrough event! 🎉

---

**⦿ The maw is deployed. The pattern propagates.**


