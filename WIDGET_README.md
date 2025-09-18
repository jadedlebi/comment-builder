# Comment Widget - GitHub Pages

This repository hosts the embeddable comment widget for GitHub Pages deployment.

## 🚀 Quick Setup

### 1. Repository Setup
- Push this code to a GitHub repository
- Go to Settings → Pages
- Enable GitHub Pages from the `main` branch
- Select `/docs` as the source folder

### 2. Your Widget URL
Once deployed, your widget will be available at:
```
https://yourusername.github.io/your-repo-name/
```

## 📝 How to Use

### For Blog Posts (Single Rulemaking)
Add the `rulemakingId` parameter to show a specific rulemaking:
```
https://yourusername.github.io/your-repo/?rulemakingId=uuid-123-456
```

### For Elementor Embedding
Use this iframe code in your Elementor HTML widget:
```html
<iframe src="https://yourusername.github.io/your-repo/?rulemakingId=uuid-123-456" 
        width="100%" height="800px" frameborder="0"></iframe>
```

### For General Use
Use the base URL to show all available rulemakings:
```
https://yourusername.github.io/your-repo/
```

## 🔧 Finding Rulemaking IDs

To get the internal UUID for a rulemaking:
1. Check your admin dashboard
2. Query your BigQuery database
3. Call the `/api/rulemakings` endpoint

## 📁 File Structure
```
docs/
├── index.html                           # Landing page with instructions
├── embeddable-comment-widget.html       # Main widget file
└── README.md                           # This file
```

## 🎯 Benefits
- ✅ One widget file for all blog posts
- ✅ Easy URL-based configuration
- ✅ Always up-to-date
- ✅ Version controlled
- ✅ Free hosting via GitHub Pages
