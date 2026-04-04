-- 1. Contact Messages tablosunu (eğer yoksa) oluştur:
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Newsletter Subscribers tablosunu (eğer yoksa) oluştur:
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS (Row Level Security) katmanını devre dışı bırak.
-- (Böylece Admin panelinden "görme" ve formdan "gönderme" işlemleri engellenmez)
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers DISABLE ROW LEVEL SECURITY;
