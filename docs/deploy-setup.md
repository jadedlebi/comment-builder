# GitHub Pages Deployment Setup

## 🎯 Step-by-Step Instructions

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it something like `comment-widget` or `cfpb-widget`
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README (we already have files)

### Step 2: Upload Files
1. Copy these files to your repository root:
   - `embeddable-comment-widget.html`
   - `index.html` 
   - `README.md`

2. You can either:
   - **Option A**: Upload via GitHub web interface
   - **Option B**: Use Git commands (if you have Git installed)

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select:
   - Source: **Deploy from a branch**
   - Branch: **main** (or **master**)
   - Folder: **/ (root)**
5. Click **Save**

### Step 4: Wait for Deployment
- GitHub will build and deploy your pages
- This usually takes 1-2 minutes
- You'll see a green checkmark when it's ready

### Step 5: Test Your Widget
Your widget will be available at:
```
https://yourusername.github.io/your-repo-name/
```

## 🔧 Testing Different URLs

### Test General Widget:
```
https://yourusername.github.io/your-repo-name/
```

### Test Specific Rulemaking:
```
https://yourusername.github.io/your-repo-name/?rulemakingId=your-uuid-here
```

### Test Elementor Embedding:
```html
<iframe src="https://yourusername.github.io/your-repo-name/?rulemakingId=your-uuid-here" 
        width="100%" height="800px" frameborder="0"></iframe>
```

## 🎉 You're Done!

Your widget is now hosted on GitHub Pages and ready to embed in your blog posts!

## 📝 Pro Tips

1. **Bookmark the URLs** for easy access
2. **Test each URL** before using in blog posts
3. **Keep the repository public** for free GitHub Pages
4. **Update files** by pushing changes to the repository
5. **Use meaningful repository names** for easier URLs

## 🆘 Troubleshooting

### Widget Not Loading?
- Check that `embeddable-comment-widget.html` is in the repository
- Verify the file path is correct
- Make sure GitHub Pages is enabled

### API Errors?
- The widget connects to your existing API
- Make sure your API server is running
- Check CORS settings if needed

### URL Not Working?
- Wait a few minutes for GitHub Pages to update
- Check the repository name in the URL
- Make sure the repository is public
