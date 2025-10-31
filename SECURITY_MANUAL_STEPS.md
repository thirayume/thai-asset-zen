# Security Configuration - Manual Steps Required

This document outlines the manual configuration steps needed to complete the security setup.

## 🔴 Critical - Required for Full Security

### 1. Configure Broker Encryption Key

**Time Required:** 5 minutes  
**Priority:** HIGH

The broker credentials encryption feature requires a symmetric encryption key to be configured in your database.

#### Steps:

1. **Generate a secure 256-bit encryption key:**
   ```bash
   openssl rand -hex 32
   ```
   Example output: `a3f8e9d2c1b4f6e8a7d9c2b5f8e1d4c7a9f2e5d8c1b6f9e2a5d8c1b4f7e0d3c6`

2. **Configure in Supabase:**
   <lov-actions>
     <lov-open-backend>Open Backend</lov-open-backend>
   </lov-actions>

   Navigate to: **SQL Editor** and run:
   ```sql
   ALTER DATABASE postgres SET app.broker_encryption_key = 'YOUR-GENERATED-KEY-HERE';
   ```

3. **Restart database connections:**
   - The setting takes effect immediately for new connections
   - Existing connections will use the new key after reconnecting

#### ⚠️ Important Notes:
- **Store this key securely!** Loss of the key = permanent loss of encrypted credentials
- Consider storing a backup in your password manager
- Do NOT commit this key to version control
- Once set, changing the key requires re-encrypting all existing credentials

---

### 2. Enable Leaked Password Protection

**Time Required:** 2 minutes  
**Priority:** HIGH

Enable automatic checking of user passwords against known breach databases.

#### Steps:

1. Open your backend:
   <lov-actions>
     <lov-open-backend>Open Backend</lov-open-backend>
   </lov-actions>

2. Navigate to: **Authentication** → **Policies**

3. Find: **"Enable leaked password protection"**

4. Toggle: **ON**

5. Save changes

#### What This Does:
- Checks new passwords against HaveIBeenPwned database
- Prevents users from using compromised passwords
- Runs automatically on signup and password change
- No code changes needed

---

### 3. Create System Bot User for Python Trading Bot

**Time Required:** 10 minutes  
**Priority:** MEDIUM (only if using Python bot)

The Python trading bot requires a dedicated user account to track trades.

#### Steps:

1. **Open SQL Editor in your backend:**
   <lov-actions>
     <lov-open-backend>Open Backend</lov-open-backend>
   </lov-actions>

2. **Create the bot user:**
   ```sql
   -- Create dedicated bot user
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_user_meta_data,
     confirmation_token,
     recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(), -- SAVE THIS UUID!
     'authenticated',
     'authenticated',
     'mt5-trading-bot@system.internal',
     crypt('CHANGE-THIS-TO-SECURE-PASSWORD', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '{"full_name": "MT5 Trading Bot (System)"}'::jsonb,
     '',
     ''
   )
   RETURNING id;
   ```

3. **Copy the returned UUID** (you'll need this for step 5)

4. **Assign member role:**
   ```sql
   -- Replace UUID-FROM-STEP-2 with the actual UUID
   INSERT INTO user_roles (user_id, role)
   VALUES ('UUID-FROM-STEP-2', 'member');
   ```

5. **Update Python bot `.env` file:**
   ```env
   BOT_USER_ID=UUID-FROM-STEP-2
   ```

6. **Restart the Python bot** for changes to take effect

---

## ✅ Verification Checklist

After completing the manual steps, verify everything works:

### Test Broker Credential Encryption:
```sql
-- Check if encryption key is configured
SELECT current_setting('app.broker_encryption_key', true) IS NOT NULL as encryption_enabled;

-- Should return: encryption_enabled = true
```

### Test Password Protection:
1. Try signing up with a known breached password (e.g., "password123")
2. Should be rejected with message about compromised password

### Test Bot User:
```sql
-- Verify bot user exists
SELECT id, email FROM auth.users 
WHERE email = 'mt5-trading-bot@system.internal';

-- Verify bot has member role
SELECT ur.role FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'mt5-trading-bot@system.internal';
```

---

## 🎯 Next Steps After Configuration

Once all manual steps are complete:

1. **Test end-to-end flow:**
   - Generate MT5 token in web UI
   - Configure MT5 EA with token
   - Verify prices are stored with user_id
   - Check real-time chart updates

2. **Test broker credentials:**
   - Save credentials via web UI
   - Verify they're encrypted in database
   - Test retrieval works correctly

3. **Run security scan:**
   - Should show 0 critical issues
   - Monitor for any new warnings

4. **Enable production mode:**
   - Set ENVIRONMENT variable to production
   - Verify error messages are sanitized
   - Check audit logs for security events

---

## 📞 Support

If you encounter issues with any manual steps:
1. Check the security audit logs for errors
2. Review edge function logs for detailed errors
3. Verify database permissions and RLS policies
4. Consult the main security documentation

---

## 🔒 Security Reminders

- Never commit encryption keys to version control
- Regularly rotate bot user passwords
- Monitor audit logs for suspicious activity
- Keep Supabase and dependencies updated
- Regular security scans recommended
