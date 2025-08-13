# 🔍 Submit Event Flow Analysis & Refactoring Plan

## 📋 **Current Flow Analysis**

### **Sequence Process:**
1. **Overview** (`@/overview`) → User starts proposal, views existing proposals
2. **Organization** (`@/organization`) → Collects organization information  
3. **Event Type** (`@/event-type`) → User selects School vs Community event
4. **Event Sections** → Routes to specific event type:
   - **School Event** (`@/SchoolEvent`) → School-based event details
   - **Community Event** (`@/CommunityEvent`) → Community-based event details
5. **Reporting** (`@/reporting`) → Final reporting and submission

### **Event Type Routing Logic:**
```javascript
// Event Type Selection → Event Section Routing
if (mappedType === "school-based") {
    targetRoute = `/student-dashboard/submit-event/${draftId}/school-event`;
} else if (mappedType === "community-based") {
    targetRoute = `/student-dashboard/submit-event/${draftId}/community-event`;
}
```

## 🔧 **Issues Identified**

### 1. **Flow Connectivity Issues**
- ❌ **Missing validation between sections**
- ❌ **No data persistence validation**
- ❌ **Inconsistent navigation patterns**
- ❌ **No flow state management**

### 2. **Code Duplication**
- ❌ **Similar form logic in School/Community events**
- ❌ **Duplicate validation patterns**
- ❌ **Repeated file handling logic**
- ❌ **Common UI components not shared**

### 3. **State Management Issues**
- ❌ **Inconsistent state handling**
- ❌ **No centralized flow state**
- ❌ **Missing progress tracking**
- ❌ **Poor error recovery**

### 4. **Navigation Problems**
- ❌ **No back/forward validation**
- ❌ **Missing required field checks**
- ❌ **No draft state preservation**
- ❌ **Inconsistent routing patterns**

## 💡 **Refactoring Strategy**

### **Phase 1: Create Unified Flow Manager**
```javascript
// New: Flow State Manager
const useSubmitEventFlow = (draftId) => {
  const [flowState, setFlowState] = useState({
    currentStep: 'overview',
    completedSteps: [],
    eventType: null,
    formData: {},
    validationErrors: {},
    canProceed: false
  });
  
  // Flow navigation logic
  const navigateToStep = (step, data) => { /* ... */ };
  const validateStep = (step) => { /* ... */ };
  const canProceedToStep = (step) => { /* ... */ };
  
  return { flowState, navigateToStep, validateStep, canProceedToStep };
};
```

### **Phase 2: Unified Event Form Component**
```javascript
// New: Shared Event Form Component
const EventFormSection = ({ eventType, formData, onNext, onPrevious }) => {
  const isSchoolEvent = eventType === 'school-based';
  const isCommunityEvent = eventType === 'community-based';
  
  // Shared form logic
  const { formState, validation, handlers } = useEventForm({
    eventType,
    initialData: formData
  });
  
  return (
    <div>
      {/* Shared form fields */}
      <BasicInfoSection {...sharedProps} />
      <DateTimeSection {...sharedProps} />
      <TargetAudienceSection {...sharedProps} />
      
      {/* Event-specific sections */}
      {isSchoolEvent && <SchoolSpecificSection {...schoolProps} />}
      {isCommunityEvent && <CommunitySpecificSection {...communityProps} />}
      
      {/* Shared actions */}
      <FormActions onNext={onNext} onPrevious={onPrevious} />
    </div>
  );
};
```

### **Phase 3: Enhanced Validation System**
```javascript
// New: Unified Validation System
const useEventValidation = (eventType, formData) => {
  const baseValidation = {
    organizationName: required,
    contactEmail: email,
    eventName: required,
    startDate: required,
    endDate: required
  };
  
  const eventSpecificValidation = {
    'school-based': {
      schoolVenue: required,
      schoolEventType: required
    },
    'community-based': {
      communityVenue: required,
      communityEventType: required,
      communityPartners: optional
    }
  };
  
  return validateForm(formData, {
    ...baseValidation,
    ...eventSpecificValidation[eventType]
  });
};
```

## 🧪 **Comprehensive Testing Strategy**

### **1. Flow Integration Tests**
```javascript
describe('Submit Event Flow Integration', () => {
  it('should complete full school event flow', async () => {
    // 1. Start from overview
    await user.click(screen.getByText('Start New Proposal'));
    
    // 2. Fill organization info
    await user.type(screen.getByLabelText('Organization Name'), 'Test School');
    await user.click(screen.getByText('Next'));
    
    // 3. Select event type
    await user.click(screen.getByText('School-Based Event'));
    await user.click(screen.getByText('Continue'));
    
    // 4. Fill school event details
    await user.type(screen.getByLabelText('Event Name'), 'School Event');
    await user.click(screen.getByText('Next'));
    
    // 5. Complete reporting
    await user.click(screen.getByText('Submit Report'));
    
    // Assertions
    expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
  });
  
  it('should complete full community event flow', async () => {
    // Similar test for community event flow
  });
});
```

### **2. Event Type Routing Tests**
```javascript
describe('Event Type Routing', () => {
  it('should route to school event section', async () => {
    await user.click(screen.getByText('School-Based Event'));
    await user.click(screen.getByText('Continue'));
    
    expect(window.location.pathname).toContain('/school-event');
  });
  
  it('should route to community event section', async () => {
    await user.click(screen.getByText('Community-Based Event'));
    await user.click(screen.getByText('Continue'));
    
    expect(window.location.pathname).toContain('/community-event');
  });
});
```

### **3. Data Persistence Tests**
```javascript
describe('Data Persistence', () => {
  it('should preserve form data across navigation', async () => {
    // Fill form data
    await user.type(screen.getByLabelText('Event Name'), 'Test Event');
    
    // Navigate away and back
    await user.click(screen.getByText('Previous'));
    await user.click(screen.getByText('Next'));
    
    // Verify data is preserved
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
  });
});
```

## 🗂️ **File Structure Refactoring**

### **Current Structure:**
```
submit-event/[draftId]/
├── overview/
│   └── Section1_Overview.jsx (845 lines!)
├── organization/
│   └── OrganizationSection.jsx (382 lines)
├── event-type/
│   ├── page.jsx
│   └── EventTypeSelection.jsx
├── event-sections/
│   ├── SchoolEvent/
│   │   ├── SchoolEventSection.jsx (271 lines)
│   │   └── useSchoolEventForm.js (284 lines)
│   └── CommunityEvent/
│       ├── CommunityEventSection.jsx (413 lines!)
│       └── useCommunityEventForm.js (107 lines)
└── reporting/
    └── components/
        └── ReportingMain.jsx
```

### **Proposed Structure:**
```
submit-event/[draftId]/
├── flow/
│   ├── useSubmitEventFlow.js (Flow state management)
│   ├── useEventValidation.js (Unified validation)
│   └── useEventNavigation.js (Navigation logic)
├── components/
│   ├── shared/
│   │   ├── EventFormSection.jsx (Unified form)
│   │   ├── BasicInfoSection.jsx
│   │   ├── DateTimeSection.jsx
│   │   └── TargetAudienceSection.jsx
│   ├── school/
│   │   └── SchoolSpecificSection.jsx
│   └── community/
│       └── CommunitySpecificSection.jsx
├── sections/
│   ├── overview/
│   ├── organization/
│   ├── event-type/
│   ├── event-form/
│   └── reporting/
└── utils/
    ├── eventValidation.js
    ├── formPersistence.js
    └── navigationHelpers.js
```

## 🚀 **Implementation Plan**

### **Step 1: Create Flow Manager**
- [ ] Implement `useSubmitEventFlow` hook
- [ ] Add flow state management
- [ ] Create navigation helpers
- [ ] Add progress tracking

### **Step 2: Unified Event Form**
- [ ] Extract shared form components
- [ ] Create `EventFormSection` component
- [ ] Implement unified validation
- [ ] Add event-specific sections

### **Step 3: Enhanced Testing**
- [ ] Write integration tests
- [ ] Add flow validation tests
- [ ] Test data persistence
- [ ] Add error handling tests

### **Step 4: Code Cleanup**
- [ ] Remove duplicate code
- [ ] Consolidate validation logic
- [ ] Standardize error handling
- [ ] Improve performance

## 📊 **Benefits of Refactoring**

### **1. Improved Maintainability**
- ✅ Single source of truth for form logic
- ✅ Consistent validation patterns
- ✅ Reduced code duplication
- ✅ Clear separation of concerns

### **2. Better User Experience**
- ✅ Consistent navigation flow
- ✅ Proper validation feedback
- ✅ Data persistence across steps
- ✅ Clear progress indication

### **3. Enhanced Testing**
- ✅ Comprehensive integration tests
- ✅ Isolated unit tests
- ✅ Better error coverage
- ✅ Automated flow validation

### **4. Developer Experience**
- ✅ Clear component structure
- ✅ Reusable components
- ✅ Type-safe validation
- ✅ Better debugging tools

## 🎯 **Success Metrics**

- **Code Reduction:** 40% less duplicate code
- **Test Coverage:** 90%+ integration test coverage
- **Performance:** 50% faster form rendering
- **Maintainability:** 60% fewer bugs in form logic
- **User Experience:** 80% fewer validation errors

---

**Next Steps:** Implement the flow manager and unified event form components to create a robust, maintainable submit event flow. 