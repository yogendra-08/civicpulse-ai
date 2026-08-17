# CivicPulse AI

AI-powered civic grievance reporting and resolution platform for municipal corporations. Citizens report issues using text and photos, AI automatically classifies complaints, determines severity, routes them to the appropriate department and officer, enables real-time status tracking, and provides analytics dashboards for municipal administrators.

## Features

- **Citizen Portal**
  - Submit complaints with text descriptions and photo uploads
  - Track complaint status in real-time
  - View complaint history and updates
  - Receive notifications on complaint resolution

- **Officer Dashboard**
  - View assigned complaints filtered by department
  - Update complaint status and add resolution notes
  - Filter by priority and status
  - Access complaint details and evidence

- **Admin Analytics**
  - Comprehensive analytics dashboard with visual charts
  - Track complaint trends by category, department, and time
  - Monitor resolution times and officer performance
  - Department-wise complaint distribution

- **AI-Powered Features**
  - Automatic complaint classification using AI
  - Severity assessment and priority assignment
  - Intelligent routing to appropriate departments
  - Smart department and officer assignment

## Tech Stack

- **Frontend Library**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: TailwindCSS 3.4.1
- **UI Utilities**: PostCSS 8.4.35 and Autoprefixer 10.4.18
- **Routing**: React Router DOM 7.18.2
- **Backend & Auth**: Supabase 2.57.4 (PostgreSQL database + authentication)
- **Database**: PostgreSQL via Supabase
- **Analytics & Charts**: Recharts 3.10.1
- **Icons**: Lucide React 0.446.0
- **AI Logic**: Custom AI service for complaint classification, severity detection, and department routing
- **Code Quality**: ESLint 9.9.1 and TypeScript ESLint 8.3.0
- **Runtime/Environment**: Node.js (v18+ recommended)
- **Deployment**: Netlify / Vercel friendly static frontend deployment
- **Version Control**: Git and GitHub

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yogendra-08/civicpulse-ai.git
cd civicpulse-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-1.5-flash
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Usage

### Running the Application

- Development: `npm run dev` - Starts Vite dev server at http://localhost:5173
- Build: `npm run build` - Creates optimized production build in `dist/`
- Preview: `npm run preview` - Preview production build locally
- Lint: `npm run lint` - Run ESLint for code quality checks
- Type Check: `npm run typecheck` - Run TypeScript type checking

### User Roles

The application supports three user roles:

1. **Citizen**: Can submit complaints, track status, and view their complaint history
2. **Officer**: Can view assigned complaints, update status, and add resolution notes
3. **Admin**: Can manage users, view comprehensive analytics, and oversee system operations

### Authentication

Authentication is handled through Supabase. Users can sign up and log in using email/password authentication. Role-based access control ensures users can only access features appropriate to their role.

## Project Structure

```
civicpulse-ai/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ComplaintComponents.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Logo.tsx
│   │   ├── RequireRole.tsx
│   │   └── ui/              # UI component library
│   ├── context/             # React context providers
│   │   └── AuthContext.tsx
│   ├── data/                # Static data and configurations
│   ├── pages/               # Page components
│   │   ├── AdminAnalytics.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── CitizenDashboard.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── OfficerDashboard.tsx
│   │   └── ReportComplaintPage.tsx
│   ├── services/            # API and business logic services
│   │   ├── aiService.ts
│   │   ├── authService.ts
│   │   └── complaintService.ts
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── docs/                    # Documentation
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # TailwindCSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Environment Variables

The following environment variables need to be configured:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key

These can be obtained from your Supabase project settings.

## Database Schema

The application uses Supabase PostgreSQL database with the following main tables:

- `profiles`: User profiles with role information
- `complaints`: Complaint records with status, priority, and assignment details
- `departments`: Department information for routing
- `officers`: Officer assignments and department associations

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Yogendra Bhange

## Acknowledgments

- Built for the Manthan Yuva Hackathon
- Uses modern web technologies for efficient civic engagement
- AI-powered complaint classification for faster resolution
