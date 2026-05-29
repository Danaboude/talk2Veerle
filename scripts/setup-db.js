const { neon } = require('@neondatabase/serverless');


async function setup() {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Creating tables...');
    
    await sql`
        CREATE TABLE IF NOT EXISTS surveys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company VARCHAR(255) NOT NULL,
            data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    await sql`
        CREATE TABLE IF NOT EXISTS responses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
            data JSONB NOT NULL DEFAULT '{}',
            emails_sent JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    await sql`
        CREATE TABLE IF NOT EXISTS email_templates (
            id VARCHAR(255) PRIMARY KEY,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    console.log('Tables created successfully.');
}

setup().catch(console.error);
