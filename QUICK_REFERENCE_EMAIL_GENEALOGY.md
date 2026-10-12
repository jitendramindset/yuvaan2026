# Quick Reference - Email & Genealogy Features

## 🚀 Getting Started (3 Steps)

### Step 1: Configure Email (.env)
Add to `botmantra-backend/.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```
💡 **Tip**: For Gmail, generate [app-specific password](https://myaccount.google.com/apppasswords)

### Step 2: Create Database Tables
Run in Supabase SQL Editor:
```sql
CREATE TABLE user_family_lineage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  family_name VARCHAR(255),
  gotra VARCHAR(255),
  generation VARCHAR(100),
  ancestry_level VARCHAR(100),
  ancestor_names TEXT[] DEFAULT '{}',
  branch VARCHAR(255),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_family_lineage_user_id 
  ON user_family_lineage(user_id);
```

### Step 3: Start Server
```bash
cd botmantra-backend
npm start
```
✅ Server runs on http://localhost:3000

---

## 📧 Email Features

### Password Reset Email
When user clicks "Forgot Password":
1. ✉️ Email sent with reset code
2. 🔗 Includes clickable reset link
3. ⏱️ Valid for 1 hour

**Test It**:
```bash
# Create test user
node setup-test-user.js

# Login as: test@example.com / Test@123
# Click Forgot Password
# Check email inbox
```

### OTP Email
When user requests password reset:
1. 📨 6-digit OTP sent to email
2. ⏱️ Valid for 10 minutes
3. ✅ Enter to verify and reset

---

## 🌳 Genealogy (Vanshawali) Features

### What You Get
- Family name and clan (gotra) information
- Generation tracking
- Ancestor name registry
- Family tree relationships
- Search by family/gotra
- Statistical overview

### Frontend Display
Automatically shows on dashboard with 3 tabs:

**Tab 1: Your Lineage**
- Family name card
- Gotra card  
- Generation card
- Connected ancestors list

**Tab 2: Family Tree**
- Family relationships
- Member list
- Hierarchy view

**Tab 3: Statistics**
- Total users with family info
- Unique families count
- List of registered families

### API Endpoints

#### Get User Genealogy
```bash
GET /api/vanshawali/user-lineage/{userId}

Response: {
  success: true,
  data: {
    familyName: "Sharma",
    gotra: "Kashyap",
    generation: "5th",
    ancestryLevel: "Great-grandfather",
    connectedAncestors: ["Ram Sharma", "Mohan Sharma"],
    branch: "North"
  }
}
```

#### Create Family Entry
```bash
POST /api/vanshawali/create-lineage

Body: {
  userId: "uuid",
  familyName: "Sharma",
  gotra: "Kashyap",
  generation: "5th",
  ancestorNames: ["Ram Sharma", "Mohan Sharma"],
  branch: "North",
  details: {}
}
```

#### Search Families
```bash
GET /api/vanshawali/search?query=Sharma&gotra=Kashyap

Response: {
  success: true,
  data: [
    { familyName: "Sharma", gotra: "Kashyap", generation: "5th", ... }
  ],
  count: 1
}
```

#### Get Family Tree
```bash
GET /api/vanshawali/family-tree/{familyId}

Response: {
  success: true,
  data: {
    familyName: "Sharma",
    members: [...],
    rootMember: "Ram Sharma"
  }
}
```

#### Get Statistics
```bash
GET /api/vanshawali/statistics

Response: {
  success: true,
  data: {
    totalUsersWithFamily: 42,
    uniqueFamilies: 15,
    families: [...]
  }
}
```

#### Update Lineage
```bash
PUT /api/vanshawali/update-lineage/{userId}

Body: {
  familyName: "Updated",
  gotra: "NewGotra",
  ...
}
```

---

## 🧪 Testing Checklist

### Email Testing
- [ ] Configure .env with email credentials
- [ ] Restart backend server
- [ ] Create test user: `node setup-test-user.js`
- [ ] Go to login, click "Forgot Password"
- [ ] Enter: test@example.com
- [ ] Check inbox for reset email
- [ ] Click link in email
- [ ] Set new password
- [ ] Login with new password ✅

### Genealogy Testing
- [ ] Login to dashboard
- [ ] See Vanshawali component at top
- [ ] Click "Your Lineage" tab
- [ ] Should show "No genealogy information found"
- [ ] Use API to add family data:
  ```bash
  POST http://localhost:3000/api/vanshawali/create-lineage
  {
    "userId": "your-user-id",
    "familyName": "TestFamily",
    "gotra": "TestGotra",
    "generation": "1st",
    "ancestorNames": ["Ancestor1", "Ancestor2"]
  }
  ```
- [ ] Refresh dashboard
- [ ] See family information displayed ✅

---

## 🔧 Environment Variables

### Required for Email
```env
EMAIL_HOST=smtp.gmail.com          # SMTP server
EMAIL_PORT=587                     # SMTP port
EMAIL_USER=your-email@gmail.com    # Your email
EMAIL_PASSWORD=your-app-password   # App password
EMAIL_FROM=noreply@yuvaan.app      # From address
```

### Optional Email Settings
```env
EMAIL_SERVICE=gmail                # Email provider
EMAIL_SECURE=false                 # Use TLS
EMAIL_FROM_NAME=Yuvaan             # Display name
```

### Alternative Providers
```env
# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key

# Mailgun
EMAIL_SERVICE=mailgun
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_KEY=your-api-key

# Custom SMTP
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=username
EMAIL_PASSWORD=password
```

---

## 🎯 Common Workflows

### Add User to Family Tree
```javascript
// Frontend
const response = await axios.post(
  'http://localhost:3000/api/vanshawali/create-lineage',
  {
    userId: user.id,
    familyName: 'Sharma',
    gotra: 'Kashyap',
    generation: '5th',
    ancestorNames: ['Ram', 'Mohan'],
    branch: 'North'
  }
);
```

### Display User Genealogy
```javascript
// React Component
import VanshawaliDisplay from './components/VanshawaliDisplay';

function Dashboard({ user }) {
  return (
    <VanshawaliDisplay 
      userId={user.id} 
      userName={user.email}
    />
  );
}
```

### Send Password Reset Email
```javascript
// Backend - Already integrated
// Triggered when user clicks "Forgot Password"
await sendPasswordResetEmail(
  email,
  resetCode,
  resetLink
);
```

---

## 🐛 Troubleshooting

### Email Not Sending
**Problem**: Forgot password doesn't send email
- ✅ Check .env has EMAIL_USER and EMAIL_PASSWORD
- ✅ For Gmail: Use [app-specific password](https://myaccount.google.com/apppasswords)
- ✅ Verify EMAIL_HOST and EMAIL_PORT
- ✅ Check server logs for error messages
- ✅ Restart server after .env changes

**Check logs**:
```bash
# Server logs should show:
# ✅ Email service initialized
# or
# ⚠️ Email service not configured. Using console logging instead.
```

### Genealogy Not Showing
**Problem**: Dashboard doesn't show Vanshawali component
- ✅ Make sure user is logged in
- ✅ Check browser console for API errors
- ✅ Verify backend is running on port 3000
- ✅ Check database tables exist in Supabase
- ✅ Verify user_family_lineage table has data

**Check in browser console**:
```javascript
// Should not have errors about:
// - 404 Not Found /api/vanshawali/...
// - Cannot read property of undefined
```

### Database Error
**Problem**: "relation does not exist"
- ✅ Create tables in Supabase SQL Editor
- ✅ Run SQL migration scripts
- ✅ Check Supabase credentials in .env

---

## 📊 API Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/vanshawali/user-lineage | ✅ Live | Fetch genealogy |
| POST /api/vanshawali/create-lineage | ✅ Live | Add family |
| GET /api/vanshawali/family-tree | ✅ Live | Get tree |
| GET /api/vanshawali/search | ✅ Live | Search |
| GET /api/vanshawali/statistics | ✅ Live | Stats |
| PUT /api/vanshawali/update-lineage | ✅ Live | Update |
| POST /api/auth/forgot-password | ✅ Live | With email |

---

## 📚 Documentation Files
- `EMAIL_AND_GENEALOGY_IMPLEMENTATION.md` - Complete guide
- `setup-email-genealogy.sh` - Linux/Mac setup
- `setup-email-genealogy.bat` - Windows setup
- `setup-test-user.js` - Create test user

---

## 🎉 Success Indicators

### Email Working ✅
- [ ] User receives reset email
- [ ] Email has valid code
- [ ] Link in email works
- [ ] Can set new password

### Genealogy Working ✅
- [ ] Dashboard shows Vanshawali
- [ ] Three tabs visible (Lineage, Tree, Stats)
- [ ] Can search families
- [ ] User data displays correctly

---

## 💡 Pro Tips

1. **Test Email First**: Use "Forgot Password" to verify email setup
2. **Check Logs**: Server logs show if email service initialized
3. **Use Gmail**: Easiest to configure, just needs [app password](https://myaccount.google.com/apppasswords)
4. **Database First**: Create tables before testing genealogy
5. **Reload After Config**: Always restart server after .env changes

---

## 🆘 Need Help?

Check these in order:
1. Are you in the right directory? (`botmantra-backend`)
2. Does `.env` have email configuration?
3. Do database tables exist in Supabase?
4. Is server running? (`npm start`)
5. Check browser console for errors
6. Check server logs for details

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready 🚀
