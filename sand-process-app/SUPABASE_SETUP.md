# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `sand-process-management`
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (2-3 minutes)

## 2. Get Your Credentials

1. Go to Project Settings (gear icon) → API
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 3. Set Environment Variables

1. In the `sand-process-app` folder, create a file named `.env`
2. Add your credentials:

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Never commit the `.env` file to git! It's already in `.gitignore`.

## 4. Run Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Open the file `database/schema.sql` from this project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify all tables were created successfully

## 5. Seed Initial Data (Optional)

You can add some initial data manually through the Supabase dashboard:

### Add Products:
```sql
INSERT INTO products (name, mesh_size, description) VALUES
('Frac Sand 30/50', '30/50', 'High quality frac sand, mesh size 30/50'),
('Frac Sand 40/70', '40/70', 'High quality frac sand, mesh size 40/70');
```

### Add Customers:
```sql
INSERT INTO customers (name, code, contact_person, email, phone, address) VALUES
('YPF', 'YPF-001', 'Roberto Silva', 'roberto.silva@ypf.com', '+54 11 1234-5678', 'Vaca Muerta, Neuquén, Argentina'),
('Vista Energy', 'VISTA-001', 'Patricia López', 'patricia.lopez@vistaenergy.com', '+54 11 2345-6789', 'Vaca Muerta, Neuquén, Argentina');
```

### Add Drivers:
```sql
INSERT INTO drivers (name, license_number, phone, hours_limit) VALUES
('Pedro Sánchez', 'DL-12345', '+54 9 11 1111-1111', 48),
('José Martínez', 'DL-23456', '+54 9 11 2222-2222', 48);
```

### Add Trucks:
```sql
INSERT INTO trucks (license_plate, capacity, type, status) VALUES
('ABC-123', 25, 'old', 'available'),
('DEF-456', 26, 'old', 'available'),
('GHI-789', 50, 'new', 'available'),
('JKL-012', 55, 'new', 'available');
```

## 6. Install Dependencies

```bash
cd sand-process-app
npm install
```

This will install `@supabase/supabase-js` and other dependencies.

## 7. Test the Connection

1. Start the development server:
```bash
npm start
```

2. Navigate to the Orders page
3. Try creating a new order
4. Check Supabase dashboard → Table Editor → orders to see if the order was created

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct values
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env`

### "Table does not exist" error
- Make sure you ran the `schema.sql` file in Supabase SQL Editor
- Check that all tables were created in the Table Editor

### RLS (Row Level Security) blocking operations
- The schema includes permissive policies, but if you have issues:
  - Go to Authentication → Policies in Supabase
  - Check that policies allow operations
  - Or temporarily disable RLS for testing (not recommended for production)

## Next Steps

- Set up authentication (if needed)
- Configure more restrictive RLS policies
- Set up real-time subscriptions for live updates
- Add file storage for certificates and signatures


