# Database Schema Alignment Refactoring Summary

## 🎯 **Technical Context & Goal**

The `Section4_CommunityEvent.jsx` component has been completely refactored to align with the exact MySQL `proposals` table schema. The previous implementation used frontend-friendly field names that didn't match the database column names, causing data inconsistency and storage issues.

**Objective Achieved**: ✅ Direct alignment between component state and database schema for seamless data flow.

---

## 📊 **Key Fields for Section4_CommunityEvent.jsx**

### **Event Information (Core Fields)**
| Database Column | Type | Component Field | Description |
|----------------|------|----------------|-------------|
| `event_name` | varchar(255) | `event_name` | Event/Activity name |
| `event_venue` | varchar(500) | `event_venue` | Venue/platform |
| `event_start_date` | date | `event_start_date` | Start date |
| `event_end_date` | date | `event_end_date` | End date |
| `event_start_time` | time | `event_start_time` | Start time |
| `event_end_time` | time | `event_end_time` | End time |
| `event_mode` | enum | `event_mode` | Event mode (offline/online/hybrid) |

### **Community Event Specific Fields**
| Database Column | Type | Component Field | Description |
|----------------|------|----------------|-------------|
| `community_event_type` | enum | `community_event_type` | Event type |
| `community_sdp_credits` | enum | `community_sdp_credits` | SDP credits (1 or 2) |
| `community_target_audience` | json | `community_target_audience` | Target audience array |

### **File Upload Fields**
| Database Column | Type | Component Field | Description |
|----------------|------|----------------|-------------|
| `community_gpoa_file_name` | varchar(255) | `community_gpoa_file_name` | GPOA file name |
| `community_gpoa_file_path` | varchar(500) | `community_gpoa_file_path` | GPOA file path |
| `community_proposal_file_name` | varchar(255) | `community_proposal_file_name` | Proposal file name |
| `community_proposal_file_path` | varchar(500) | `community_proposal_file_path` | Proposal file path |

### **Additional Fields**
| Database Column | Type | Component Field | Description |
|----------------|------|----------------|-------------|
| `objectives` | text | `objectives` | Event objectives |
| `budget` | decimal(10,2) | `budget` | Budget amount |
| `volunteers_needed` | int | `volunteers_needed` | Number of volunteers |

---

## 🔧 **Refactored fieldMapping Structure**

### **Before (Misaligned)**
```javascript
const fieldMapping = {
  communityEventName: 'name',
  communityVenue: 'venue',
  communityStartDate: 'start_date',
  // ... more mappings
};
```

### **After (Direct Database Alignment)**
```javascript
// ✅ NO FIELD MAPPING NEEDED - Direct database column names
const getInitialFormState = (draftData = {}) => ({
  // Event Information (matches database column names exactly)
  event_name: draftData.event_name || "",
  event_venue: draftData.event_venue || "",
  event_start_date: draftData.event_start_date ? new Date(draftData.event_start_date) : null,
  event_end_date: draftData.event_end_date ? new Date(draftData.event_end_date) : null,
  event_start_time: draftData.event_start_time || "",
  event_end_time: draftData.event_end_time || "",
  event_mode: draftData.event_mode || "",
  
  // Community Event Specific Fields
  community_event_type: draftData.community_event_type || "",
  community_sdp_credits: draftData.community_sdp_credits || "",
  community_target_audience: Array.isArray(draftData.community_target_audience) ? draftData.community_target_audience : [],
  
  // File Upload Fields
  community_gpoa_file_name: draftData.community_gpoa_file_name || "",
  community_gpoa_file_path: draftData.community_gpoa_file_path || "",
  community_proposal_file_name: draftData.community_proposal_file_name || "",
  community_proposal_file_path: draftData.community_proposal_file_path || "",
  
  // Additional Fields
  objectives: draftData.objectives || "",
  budget: draftData.budget || "",
  volunteers_needed: draftData.volunteers_needed || "",
  
  // File objects for upload handling
  community_gpoa_file: draftData.community_gpoa_file || null,
  community_proposal_file: draftData.community_proposal_file || null,
});
```

---

## 🔄 **Integration Instructions**

### **1. State Management Updates**
```javascript
// ✅ Updated state initialization
const [formState, setFormState] = useState(() => getInitialFormState());

// ✅ Updated form input binding
<Input
  id="event_name"
  name="event_name"  // Direct database column name
  value={formState.event_name}
  onChange={handleLocalInputChange}
/>
```

### **2. Form Input Name Attributes**
All form inputs now use database column names directly:
- `event_name` instead of `communityEventName`
- `event_venue` instead of `communityVenue`
- `event_start_date` instead of `communityStartDate`
- `community_event_type` instead of `communityEventType`
- `community_sdp_credits` instead of `communitySDPCredits`

### **3. Data Type Handling**

#### **Enum Fields**
```javascript
// Event Mode (offline, online, hybrid)
<RadioGroup
  value={formState.event_mode}
  onValueChange={(value) => handleRadioChange("event_mode", value)}
>
  {["offline", "online", "hybrid"].map(mode => (
    <RadioGroupItem value={mode} />
  ))}
</RadioGroup>

// Community Event Type
{["academic-enhancement", "seminar-webinar", "general-assembly", "leadership-training", "others"].map(type => (
  <RadioGroupItem value={type} />
))}

// SDP Credits (1, 2)
{["1", "2"].map(credit => (
  <RadioGroupItem value={credit} />
))}
```

#### **JSON Fields**
```javascript
// Target Audience (stored as JSON array)
const handleTargetAudienceChange = (audience, checked) => {
  setFormState(prev => {
    const currentAudiences = Array.isArray(prev.community_target_audience) ? prev.community_target_audience : [];
    const newAudiences = checked
      ? [...currentAudiences, audience]
      : currentAudiences.filter(item => item !== audience);
    return { ...prev, community_target_audience: newAudiences };
  });
};
```

#### **Date/Time Fields**
```javascript
// Date fields use DatePickerComponent
<DatePickerComponent
  fieldName="event_start_date"
  value={formState.event_start_date}
  onChange={handleDateChange}
/>

// Time fields use HTML5 time input
<Input
  name="event_start_time"
  type="time"
  value={formState.event_start_time}
/>
```

#### **File Upload Fields**
```javascript
// File upload updates both file object and metadata
const handleFileUpload = (e, fieldName) => {
  setFormState(prev => ({ 
    ...prev, 
    [fieldName]: file,                    // File object
    [`${fieldName}_name`]: file.name,     // File name
    [`${fieldName}_path`]: ''             // File path (set by backend)
  }));
};
```

### **4. Validation Updates**
```javascript
const requiredFields = [
  'event_name', 'event_venue', 'event_start_date',
  'event_end_date', 'event_start_time', 'event_end_time',
  'event_mode', 'community_event_type', 'community_sdp_credits',
  'objectives', 'budget', 'volunteers_needed'
];

// Enhanced validation for specific data types
if (formState.community_sdp_credits) {
  const credits = parseInt(formState.community_sdp_credits);
  if (isNaN(credits) || credits < 1 || credits > 2) {
    validationErrors.community_sdp_credits = 'SDP credits must be 1 or 2';
  }
}
```

---

## 📝 **Code Snippets**

### **1. Initial Form State Object**
```javascript
const getInitialFormState = (draftData = {}) => ({
  // Event Information
  event_name: draftData.event_name || "",
  event_venue: draftData.event_venue || "",
  event_start_date: draftData.event_start_date ? new Date(draftData.event_start_date) : null,
  event_end_date: draftData.event_end_date ? new Date(draftData.event_end_date) : null,
  event_start_time: draftData.event_start_time || "",
  event_end_time: draftData.event_end_time || "",
  event_mode: draftData.event_mode || "",
  
  // Community Event Specific
  community_event_type: draftData.community_event_type || "",
  community_sdp_credits: draftData.community_sdp_credits || "",
  community_target_audience: Array.isArray(draftData.community_target_audience) ? draftData.community_target_audience : [],
  
  // File Uploads
  community_gpoa_file_name: draftData.community_gpoa_file_name || "",
  community_gpoa_file_path: draftData.community_gpoa_file_path || "",
  community_proposal_file_name: draftData.community_proposal_file_name || "",
  community_proposal_file_path: draftData.community_proposal_file_path || "",
  
  // Additional Fields
  objectives: draftData.objectives || "",
  budget: draftData.budget || "",
  volunteers_needed: draftData.volunteers_needed || "",
  
  // File objects
  community_gpoa_file: draftData.community_gpoa_file || null,
  community_proposal_file: draftData.community_proposal_file || null,
});
```

### **2. Form Input Example**
```javascript
// Text Input
<Input
  id="event_name"
  name="event_name"
  value={formState.event_name}
  onChange={handleLocalInputChange}
  placeholder="e.g., Community Skills Workshop"
  className={getFieldClasses("event_name", localValidationErrors, "...")}
  disabled={disabled}
  required
/>

// Enum Radio Group
<RadioGroup
  value={formState.event_mode}
  onValueChange={(value) => handleRadioChange("event_mode", value)}
  className={`grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1 ${hasFieldError("event_mode", localValidationErrors) ? "p-3 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20" : ""}`}
  disabled={disabled}
>
  {["offline", "online", "hybrid"].map(mode => (
    <div className="flex items-center space-x-2" key={mode}>
      <RadioGroupItem value={mode} id={`community-mode-${mode}`} disabled={disabled} />
      <Label htmlFor={`community-mode-${mode}`}>{mode}</Label>
    </div>
  ))}
</RadioGroup>

// Number Input
<Input
  id="budget"
  name="budget"
  type="number"
  step="0.01"
  min="0"
  value={formState.budget}
  onChange={handleLocalInputChange}
  placeholder="0.00"
  className={getFieldClasses("budget", localValidationErrors, "...")}
  disabled={disabled}
  required
/>
```

### **3. Handle Change Function**
```javascript
const handleLocalInputChange = useCallback((e) => {
  if (disabled) return;
  const { name, value } = e.target;
  setFormState(prev => ({ ...prev, [name]: value }));

  // Clear validation error for this field when user starts typing
  if (localValidationErrors[name]) {
    setLocalValidationErrors(prev => ({ ...prev, [name]: undefined }));
  }

  // Call parent handler
  if (handleInputChange) {
    handleInputChange(e);
  }
}, [disabled, handleInputChange, localValidationErrors]);
```

---

## 🎉 **Benefits Achieved**

### **✅ Data Integrity**
- Direct mapping between component state and database schema
- No field name translation errors
- Consistent data types across frontend and backend

### **✅ Maintainability**
- Single source of truth for field names
- Easier debugging and troubleshooting
- Reduced complexity in data transformation

### **✅ Performance**
- No field mapping overhead
- Direct database column access
- Optimized data flow

### **✅ User Experience**
- Enhanced validation with specific error messages
- Real-time field validation
- Improved form completion tracking

---

## 🔍 **Backend Impact**

### **API Integration**
- No field mapping required in backend
- Direct database column access
- Simplified data processing

### **Database Operations**
- Direct INSERT/UPDATE operations
- No data transformation needed
- Improved query performance

### **Validation**
- Database-level constraints work seamlessly
- Enum validation at database level
- JSON field validation

---

## 📋 **Summary**

The `Section4_CommunityEvent.jsx` component has been successfully refactored to achieve perfect alignment with the MySQL `proposals` table schema:

1. ✅ **Eliminated field mapping** - Direct database column names
2. ✅ **Updated all form inputs** - Consistent naming convention
3. ✅ **Enhanced validation** - Database-aligned validation rules
4. ✅ **Added missing fields** - objectives, budget, volunteers_needed
5. ✅ **Improved file handling** - Proper metadata management
6. ✅ **Enhanced user experience** - Better error handling and feedback

The component now provides a seamless, maintainable, and performant solution for community event proposal management that perfectly aligns with the database schema! 🚀 