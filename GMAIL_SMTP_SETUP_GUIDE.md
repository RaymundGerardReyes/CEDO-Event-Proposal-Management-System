# Gmail SMTP Setup Guide

## 🔧 Issue Identified
The email service is failing with error: `Invalid login: 535-5.7.8 Username and Password not accepted`

This happens because Gmail requires **App Passwords** for SMTP authentication, not your regular password.

## 📧 Gmail SMTP Configuration Steps

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on **2-Step Verification**
3. Follow the setup process to enable 2FA

### Step 2: Generate App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under **2-Step Verification**, click **App passwords**
3. Select **Mail** as the app
4. Select **Other (Custom name)** as the device
5. Enter "CEDO Email Service" as the name
6. Click **Generate**
7. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
Replace your current `.env` file with:

```bash
# Gmail SMTP Configuration
EMAIL_USER=yloww222@gmail.com
EMAIL_PASSWORD=your-16-character-app-password-here
FRONTEND_URL=http://localhost:3000
```

**Important**: Use the App Password, NOT your regular Gmail password.

## 🧪 Testing the Configuration

### Test Email Service
```bash
cd backend
node test-email-demo.js
```

### Expected Output (Success)
```
✅ Email service initialized: YES
✅ Email service working with real SMTP
```

### Expected Output (Still Demo Mode)
```
✅ Email service initialized: NO (Demo Mode)
⚠️ Email service not configured. Running in demo mode.
```

## 🔒 Security Notes

### App Password Security
- App passwords are **application-specific**
- They can be **revoked** if compromised
- They're **different** from your main password
- They're **16 characters** with spaces (remove spaces when using)

### Environment Variable Security
- Never commit `.env` files to version control
- Use different passwords for development/production
- Rotate app passwords regularly

## 🚨 Common Issues

### Issue 1: "Username and Password not accepted"
**Solution**: Use App Password, not regular password

### Issue 2: "Less secure app access"
**Solution**: Enable 2FA and use App Password (more secure)

### Issue 3: "App passwords not available"
**Solution**: Enable 2FA first, then App passwords will be available

## 📋 Quick Checklist

- [ ] 2-Factor Authentication enabled
- [ ] App Password generated for "Mail"
- [ ] App Password copied (16 characters)
- [ ] Environment variables updated
- [ ] Server restarted
- [ ] Email service tested

## 🎯 Expected Result

Once properly configured, you should see:
```
✅ Email service initialized successfully
📧 SMTP configured for: yloww222@gmail.com
✅ Email service working with real SMTP
```

And emails will actually be sent to users when they submit proposals!

