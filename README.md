# ShiptShots - Screenshot Browser

Browse, search, and organize UI component screenshots for design and engineering teams.

## 🎨 Property Controls (IMMUTABLE BEHAVIOR)

**⚠️ CRITICAL: This behavior is immutable and should never be changed**

The property controls implement Figma/Storybook-style variant behavior:

### Core Principles (IMMUTABLE)
1. **ALL property options are always available** - No filtering based on current selection
2. **Automatic property synchronization** - When a property changes, ALL other properties automatically adjust to match a valid variant
3. **Smart variant matching** - The system finds the best matching screenshot and updates all properties accordingly

### Example Workflow
```
Starting with: BadgeDescription_props_Type-ID-scan_User-Shopper
User selects: "Type: Large-route"
Result: Automatically changes to BadgeDescription_props_Type-Large-route_User-Driver
```

### Implementation Details
- **Function:** `updatePropertiesForValidCombination()` - Updates all properties when one changes
- **Function:** `groupPropertyControls()` - Always shows ALL available options (no filtering)
- **Behavior:** Users can select any property value and get a valid combination

### Why This Is Immutable
This behavior ensures users can always explore any property value without restrictions, exactly like Figma and Storybook variants. Changing this would break the core user experience.

## 🚀 Features

### Core Features
- **Screenshot Gallery**: Grid view of all screenshots with preview thumbnails
- **Search & Filter**: Search by component name, state, or tags with advanced filtering options
- **Component & State Context**: Display metadata alongside each screenshot
- **Grouping Options**: Group screenshots by component, state, or view all in a flat list
- **Detail View**: Click any screenshot to view larger version with full metadata
- **Shareable Links**: Copy direct links to any screenshot detail view

### Advanced Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Search**: Instant filtering as you type
- **Tag System**: Organize screenshots with custom tags
- **Metadata Display**: View component props, dates, and descriptions
- **Copy Functionality**: Copy screenshot links or metadata to clipboard

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Next.js built-in bundler

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wbraden/ShiptShots.git
   cd ShiptShots
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ShiptShots/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── ScreenshotCard.tsx # Individual screenshot card
│   ├── SearchAndFilter.tsx # Search and filter controls
│   ├── Sidebar.tsx        # Sidebar navigation
│   ├── MobileMenuButton.tsx # Mobile menu toggle
│   └── ScreenshotDetail.tsx # Detail modal
├── types/                 # TypeScript type definitions
│   └── screenshot.ts      # Screenshot data types
├── utils/                 # Utility functions
│   ├── screenshot.ts      # Screenshot processing utilities
│   └── cn.ts             # CSS class utilities
├── public/screenshots/    # Screenshot files (not tracked in git)
└── package.json          # Dependencies and scripts
```

## 📊 Data Model

The application dynamically generates metadata from screenshot filenames:

### File Naming Convention
Screenshots follow the naming pattern: `[Component]_[State]_[Props].png`

**Examples:**
- `Button_primary_default.png` → Component: "Button", State: "primary_default"
- `TabBar_twoTabs_withBadge_activeFirst.png` → Component: "TabBar", State: "twoTabs_withBadge_activeFirst"

### Automatic Metadata Generation
- **Component**: Extracted from filename prefix
- **State**: Extracted from middle section
- **Tags**: Automatically generated from component name and state parts
- **Description**: Human-readable description generated from component and state

## 🎯 Usage

### Browsing Screenshots
1. **View Gallery**: Screenshots are displayed in a responsive grid layout
2. **Sidebar Navigation**: Use the left sidebar to filter by component
3. **Click to View**: Click any screenshot to open the detail modal

### Searching and Filtering
1. **Search Bar**: Type to search across component names, states, and descriptions
2. **Component Filter**: Select specific components from the dropdown
3. **State Filter**: Filter by specific component states
4. **Tag Filter**: Click tags to filter by specific categories (counts update based on current filter)
5. **Clear Filters**: Use the "Clear filter" button to reset component filters

### Detail View
1. **Large Image**: View the full screenshot in high resolution
2. **Metadata**: See component props, creation date, and description
3. **Tags**: View all associated tags
4. **Actions**: Copy shareable links or metadata

## 🔧 Customization

### Adding New Screenshots
1. **Place your PNG files** in the `public/screenshots/` directory
2. **Follow the naming convention**: `[Component]_[State]_[Props].png`
   - Example: `Button_primary_disabled.png`
3. **Restart the development server** if needed

**Directory structure:**
```
public/
└── screenshots/
    ├── Button_primary_default.png
    ├── Button_primary_disabled.png
    ├── Input_text_focused.png
    └── ... (your actual screenshot files)
```

### Styling
- Modify `app/globals.css` for global styles
- Update `tailwind.config.js` for theme customization
- Component-specific styles are in each component file

### Data Structure
- Extend the types in `types/screenshot.ts` for additional metadata
- Update utility functions in `utils/screenshot.ts` for new features

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Static Export
```bash
npm run build
npm run export
```

### Environment Variables
No environment variables are required for the basic functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎨 Design Principles

- **Simplicity**: Clean, intuitive interface focused on browsing screenshots
- **Performance**: Fast loading and smooth interactions
- **Accessibility**: Keyboard navigation and screen reader support
- **Responsive**: Works on all device sizes
- **Extensible**: Easy to add new features and data sources

## 🔮 Future Enhancements

- **Visual Diffs**: Compare screenshots side-by-side
- **Batch Actions**: Download multiple screenshots
- **Integration**: Connect with Figma, Storybook, or Git
- **Version Control**: Track changes over time
- **Advanced Search**: Full-text search with filters
- **Export Options**: PDF reports, ZIP downloads
- **User Management**: Multi-user support with permissions
