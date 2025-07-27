# Section 3 School Event - Modular Architecture

This directory contains a fully modularized version of the Section 3 School Event form component, designed for better maintainability, debugging, and separation of concerns.

## 📁 Directory Structure

```
school-event/
├── hooks/                          # Custom hooks for logic separation
│   ├── useSection3State.js         # State management and data recovery
│   ├── useSection3Handlers.js      # Event handlers and form interactions
│   ├── useSection3Save.js          # Save functionality and validation
│   ├── useSection3Navigation.js    # Navigation and next step logic
│   ├── useSection3Files.js         # File operations and downloads
│   ├── useSection3Debug.js         # Debug utilities and testing
│   └── index.js                    # Hook exports
├── components/                     # UI components for form sections
│   ├── BasicInfoSection.jsx        # Event name and venue fields
│   ├── DateTimeSection.jsx         # Date and time selection
│   ├── EventSpecificsSection.jsx   # Event type, audience, mode, credits
│   ├── AttachmentsSection.jsx      # File upload and management
│   ├── DebugPanel.jsx              # Development debug panel
│   └── index.js                    # Component exports
├── Section3_SchoolEvent.jsx        # Main component (refactored)
├── schoolEventUtils.js             # Utility functions
└── README.md                       # This documentation
```

## 🎯 Benefits of Modular Architecture

### 1. **Separation of Concerns**
- **State Management**: `useSection3State` handles all state logic
- **Event Handling**: `useSection3Handlers` manages user interactions
- **Save Logic**: `useSection3Save` handles validation and API calls
- **Navigation**: `useSection3Navigation` manages form progression
- **File Operations**: `useSection3Files` handles file uploads/downloads
- **Debug Tools**: `useSection3Debug` provides testing utilities

### 2. **Easier Debugging**
- Each hook has a specific responsibility
- Debug panel provides comprehensive testing tools
- Clear separation makes it easier to isolate issues
- Detailed console logging for each operation

### 3. **Maintainability**
- Smaller, focused files are easier to understand
- Changes to one aspect don't affect others
- Clear interfaces between modules
- Reusable hooks and components

### 4. **Testing**
- Each hook can be tested independently
- Debug utilities allow quick testing of specific functionality
- Mock data and auto-fill features for development

## 🔧 Usage

### Main Component
```jsx
import Section3_SchoolEvent from './Section3_SchoolEvent';

<Section3_SchoolEvent
  formData={formData}
  handleInputChange={handleInputChange}
  onNext={onNext}
  onPrevious={onPrevious}
  disabled={false}
  validationErrors={{}}
/>
```

### Individual Hooks
```jsx
import { useSection3State, useSection3Handlers } from './hooks';

// Use specific hooks as needed
const { localFormData, isSaving } = useSection3State(formData, disabled);
const { handleLocalInputChange } = useSection3Handlers({...});
```

### Individual Components
```jsx
import { BasicInfoSection, DateTimeSection } from './components';

// Use specific form sections
<BasicInfoSection
  localFormData={localFormData}
  handleLocalInputChange={handleLocalInputChange}
  validationErrors={validationErrors}
  disabled={disabled}
/>
```

## 🧪 Debug Features

### Development Mode Debug Panel
When `NODE_ENV === 'development'`, a debug panel appears with:

- **Auto-Fill All Fields**: Populates form with test data
- **Clear All Fields**: Resets form to empty state
- **Quick Test**: Auto-fills and saves data
- **Test Navigation**: Tests the complete flow
- **Test Navigation Only**: Tests navigation without save
- **Test Backend**: Checks backend connectivity
- **Test Save Function**: Tests save functionality
- **Analyze Parent State**: Detailed state analysis
- **Force Recovery**: Manual data recovery

### Console Logging
Each hook provides detailed console logging:
- `📦 Section3 MOUNT/UNMOUNT`: Component lifecycle
- `💾 SAVE DATA`: Save operation details
- `🚀 HANDLE NEXT`: Navigation process
- `📁 LOAD EXISTING FILES`: File operations
- `🔧 RECOVERY`: Data recovery process

## 🔄 Data Flow

1. **State Management**: `useSection3State` manages local form data and recovery
2. **User Input**: `useSection3Handlers` processes user interactions
3. **Validation**: `useSection3Save` validates data before saving
4. **File Operations**: `useSection3Files` handles file uploads/downloads
5. **Navigation**: `useSection3Navigation` manages form progression
6. **Debug**: `useSection3Debug` provides testing utilities

## 🛠️ Customization

### Adding New Fields
1. Update `useSection3State` to include new field in `localFormData`
2. Add validation in `useSection3Save`
3. Create or update appropriate component
4. Add to form sections in main component

### Adding New Hooks
1. Create new hook file in `hooks/` directory
2. Export from `hooks/index.js`
3. Import and use in main component

### Adding New Components
1. Create new component file in `components/` directory
2. Export from `components/index.js`
3. Import and use in main component

## 🚨 Error Handling

Each hook includes comprehensive error handling:
- Network errors with user-friendly messages
- Validation errors with field-specific feedback
- Timeout handling for API calls
- Graceful degradation when services are unavailable

## 📝 Notes

- All hooks are memoized to prevent unnecessary re-renders
- File operations include proper cleanup and error handling
- Debug features are only available in development mode
- The modular structure maintains the same API as the original component 