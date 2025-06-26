# 🎨 Automated Layout Management System

Transform your React/Next.js/Tailwind CSS frontend automatically without manual coding! This system provides visual layout editing, preset generation, and responsive design automation.

## ✨ Features

- **Visual Layout Editor**: Real-time visual interface to adjust layouts
- **Automated Code Generation**: Generate React components and CSS automatically
- **Responsive Design**: Auto-responsive utilities for all screen sizes
- **Preset System**: Pre-built layout templates (Dashboard, Mobile, Compact)
- **Backup System**: Safe modifications with automatic backups
- **Live Preview**: See changes instantly across different device sizes

## 🚀 Quick Start

### 1. Generate All Layouts
```bash
npm run layout:generate
```
This creates:
- `/src/generated-layouts/dashboard/` - Dashboard layout preset
- `/src/generated-layouts/mobile/` - Mobile-optimized preset  
- `/src/generated-layouts/compact/` - Compact layout preset
- `/src/generated-layouts/auto-responsive.css` - Responsive utilities

### 2. Use the Visual Layout Manager

Add the AutoLayoutManager to any component:

```jsx
import AutoLayoutManager from '@/components/layout-automation/AutoLayoutManager'

export default function MyPage() {
  return (
    <AutoLayoutManager>
      <div className="auto-container">
        <div className="auto-card">
          <h1 className="auto-text-responsive-lg">Your Content</h1>
          <p className="auto-text-responsive">This will automatically adjust!</p>
          <button className="auto-btn">Auto Button</button>
        </div>
      </div>
    </AutoLayoutManager>
  )
}
```

### 3. Apply Auto-Responsive CSS

Import the generated responsive utilities:

```jsx
// In your _app.js or layout component
import '@/generated-layouts/auto-responsive.css'
```

## 🛠️ Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `npm run layout:generate` | Generate all layout presets | Creates complete layout system |
| `npm run layout:apply` | Apply preset to existing components | Modifies your components automatically |
| `npm run layout:responsive` | Generate responsive CSS only | Updates responsive utilities |
| `npm run layout:help` | Show help and options | View all available options |

## 🎯 Auto-Generated CSS Classes

### Layout Containers
```css
.auto-container        /* Responsive container with auto margins */
.auto-grid            /* Auto-responsive grid layout */
.auto-card            /* Responsive card component */
```

### Typography
```css
.auto-text-responsive    /* Responsive text (clamp sizing) */
.auto-text-responsive-lg /* Larger responsive text */
```

### Spacing & Layout
```css
.auto-responsive-p      /* Responsive padding */
.auto-responsive-m      /* Responsive margin */
.auto-responsive-gap    /* Responsive gap */
```

### Interactive Elements
```css
.auto-btn              /* Responsive button */
.auto-animate          /* Fade-in animation */
.auto-animate-delay-1  /* Delayed animation */
```

### Device-Specific
```css
.mobile-stack          /* Stack elements on mobile */
.mobile-center         /* Center on mobile */
.mobile-hide           /* Hide on mobile */
.desktop-show          /* Show only on desktop */
```

## 🎨 Visual Layout Manager Features

### Real-Time Editing
- **Spacing Control**: Adjust padding, margins, and gaps with sliders
- **Typography**: Change font sizes and line heights dynamically  
- **Color Themes**: Switch between color palettes instantly
- **Border Radius**: Adjust rounded corners visually
- **Device Preview**: Test mobile, tablet, and desktop layouts

### Layout Presets
- **Modern**: Spacious, rounded corners, elevated shadows
- **Compact**: Tight spacing, minimal borders
- **Professional**: Balanced spacing, moderate shadows

### Export/Import
- **Export Layouts**: Save configurations as JSON
- **Import Configurations**: Load saved layout settings
- **Generate CSS**: Copy generated CSS code
- **Live Preview**: See changes in real-time

## 📱 Responsive Design Features

### Automatic Scaling
All auto-classes use `clamp()` for fluid scaling:
```css
font-size: clamp(0.875rem, 2vw, 1.125rem);
padding: clamp(1rem, 3vw, 2rem);
```

### Device Breakpoints
- **Mobile**: < 640px (Stack layouts, simplified navigation)
- **Tablet**: 641px - 1024px (Collapsible sidebars)
- **Desktop**: > 1024px (Full layouts, hover effects)

### Auto-Grid System
```jsx
<div className="auto-grid">
  <div className="auto-card">Card 1</div>
  <div className="auto-card">Card 2</div>
  <div className="auto-card">Card 3</div>
</div>
```
Automatically creates responsive grids that stack on mobile.

## 🔧 Integration with Existing Code

### Method 1: Wrap Components
```jsx
import AutoLayoutManager from '@/components/layout-automation/AutoLayoutManager'

function Dashboard() {
  return (
    <AutoLayoutManager>
      <YourExistingContent />
    </AutoLayoutManager>
  )
}
```

### Method 2: Use Generated Components
```jsx
import { dashboardLayout } from '@/generated-layouts/dashboard/dashboardLayout'

function Dashboard() {
  return (
    <dashboardLayout
      sidebar={<YourSidebar />}
      header={<YourHeader />}
    >
      <YourMainContent />
    </dashboardLayout>
  )
}
```

### Method 3: Apply CSS Classes
```jsx
// Replace static classes with auto-responsive ones
<div className="p-4 bg-white rounded-lg">         {/* Before */}
<div className="auto-card">                       {/* After */}

<button className="px-4 py-2 bg-blue-500">       {/* Before */}
<button className="auto-btn bg-blue-500">        {/* After */}
```

## 🎛️ Advanced Configuration

### Custom Color Themes
```javascript
const customTheme = {
  primary: '#your-primary-color',
  secondary: '#your-secondary-color',
  background: '#your-background',
  surface: '#your-surface',
  border: '#your-border'
}

// Apply in AutoLayoutManager
<AutoLayoutManager theme={customTheme}>
```

### Custom Breakpoints
Edit `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    screens: {
      'xs': '475px',    // Custom extra small
      'sm': '640px',    // Small devices
      'md': '768px',    // Medium devices  
      'lg': '1024px',   // Large devices
      'xl': '1280px',   // Extra large
      '2xl': '1536px'   // 2X large
    }
  }
}
```

## 📦 File Structure

After running `npm run layout:generate`:

```
src/
  components/
    layout-automation/
      AutoLayoutManager.jsx     # Main visual editor
      LayoutPresetGenerator.js  # Code generation engine
  scripts/
    auto-layout-generator.js   # CLI tool
  generated-layouts/
    dashboard/
      dashboardLayout.jsx      # Dashboard component
      dashboard-layout.css     # Dashboard styles
      dashboard-theme.json     # Theme configuration
      README.md               # Usage instructions
    mobile/
      [mobile layout files]
    compact/
      [compact layout files]
    auto-responsive.css       # Global responsive utilities
    layout-config.json       # Configuration file
```

## 🎯 Use Cases

### 1. Rapid Prototyping
```jsx
// Quickly create responsive layouts
<div className="auto-container">
  <div className="auto-grid">
    <div className="auto-card auto-animate">
      <h2 className="auto-text-responsive-lg">Feature 1</h2>
      <p className="auto-text-responsive">Description</p>
      <button className="auto-btn">Learn More</button>
    </div>
  </div>
</div>
```

### 2. Dashboard Creation
```jsx
import { DashboardLayout } from '@/generated-layouts/dashboard/dashboardLayout'

function AdminDashboard() {
  return (
    <DashboardLayout
      sidebar={<AdminSidebar />}
      header={<AdminHeader />}
    >
      <div className="auto-grid">
        <div className="auto-card">Metrics</div>
        <div className="auto-card">Charts</div>
        <div className="auto-card">Tables</div>
      </div>
    </DashboardLayout>
  )
}
```

### 3. Mobile-First Design
```jsx
<div className="auto-container mobile-stack">
  <div className="auto-card mobile-center">
    <h1 className="auto-text-responsive-lg">Mobile Optimized</h1>
    <button className="auto-btn mobile-hide">Desktop Only</button>
  </div>
</div>
```

## 🐛 Troubleshooting

### Layout Manager Not Showing
- Ensure AutoLayoutManager is imported correctly
- Check that the component is wrapped properly
- Verify CSS is imported

### Responsive Classes Not Working
- Import `auto-responsive.css` in your main CSS file
- Check Tailwind CSS configuration
- Verify PostCSS processing

### Generated Files Missing
- Run `npm run layout:generate` first
- Check file permissions
- Verify Node.js version (requires Node 14+)

### Backup Files Created
- Automatic backups are created when applying presets
- Files end with `.backup` extension
- Safe to delete after confirming changes

## 🎨 Customization Examples

### Custom Animation Delays
```jsx
<div className="auto-animate auto-animate-delay-1">First</div>
<div className="auto-animate auto-animate-delay-2">Second</div>
<div className="auto-animate auto-animate-delay-3">Third</div>
```

### Responsive Image Galleries
```jsx
<div className="auto-grid">
  {images.map((img, i) => (
    <div key={i} className="auto-card auto-animate">
      <img src={img.src} className="w-full auto-responsive-m" />
      <h3 className="auto-text-responsive">{img.title}</h3>
    </div>
  ))}
</div>
```

### Mobile-Adaptive Navigation
```jsx
<nav className="auto-container">
  <div className="mobile-stack desktop-show">
    <a href="#" className="auto-btn">Home</a>
    <a href="#" className="auto-btn">About</a>
    <a href="#" className="auto-btn mobile-hide">Contact</a>
  </div>
</nav>
```

## 🚀 Next Steps

1. **Generate your first layout**: `npm run layout:generate`
2. **Add AutoLayoutManager** to a test component
3. **Import responsive CSS** in your main layout
4. **Experiment** with the visual editor
5. **Apply presets** to existing components
6. **Customize themes** and breakpoints
7. **Share layouts** using export/import

## 💡 Pro Tips

- Use the visual editor for rapid iteration
- Combine auto-classes with your existing Tailwind classes
- Export configurations before major changes
- Test across all device sizes using the preview
- Start with generated presets and customize from there

---

**Generated by Auto Layout System** - Transform your layouts without coding! 🎨✨ 