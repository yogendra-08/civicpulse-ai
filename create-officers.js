import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.resolve('./.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const officers = [
  { email: 'roads@govtnagpur.in', name: 'Suresh Kamble' },
  { email: 'water@govtnagpur.in', name: 'Mahesh Pawar' },
  { email: 'sanitation@govtnagpur.in', name: 'Imran Sheikh' },
  { email: 'electrical@govtnagpur.in', name: 'Farhana Ansari' },
  { email: 'drainage@govtnagpur.in', name: 'Kavita Rao' },
];

async function createOfficers() {
  console.log('Creating officer auth users...\n');

  for (const officer of officers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: officer.email,
        password: 'officer0808',
        email_confirm: true,
        user_metadata: {
          role: 'officer',
          full_name: officer.name,
        },
      });

      if (error) {
        console.error(`❌ Failed to create ${officer.email}:`, error.message);
      } else {
        console.log(`✅ Created ${officer.email} (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Error creating ${officer.email}:`, err.message);
    }
  }

  console.log('\n✅ Officer creation complete!');
  console.log('Password for all officers: officer0808');
}

createOfficers().catch(console.error);
