# SpendSense

SpendSense is a personal finance management web application designed to help users track their income and expenses, visualize their financial data through charts and overviews, and receive AI-powered budget advice. The app leverages Firebase for authentication and data storage, and provides a user-friendly interface built with React, Next.js, and Tailwind CSS.

## Features

- User authentication with Firebase Auth
- Real-time transaction tracking with Firestore
- Record income and expenses with detailed categories
- Monthly and year-to-date financial overviews
- Interactive spending and income vs. expense charts
- Recent transactions list with edit and delete functionality
- AI-powered budget advisor for personalized financial insights
- Responsive and accessible UI with dialogs and toast notifications

## Technologies Used

- React 18 with Next.js 13 (App Router)
- TypeScript for type safety
- Firebase Authentication and Firestore database
- Tailwind CSS for styling
- Lucide React icons
- Custom UI components for dialogs, cards, buttons, charts, and forms

## Project Structure

- `src/app/` - Main application pages and layouts
- `src/components/` - Reusable UI components, including budgetwise-specific components and layout components
- `src/contexts/` - React context providers, including authentication context
- `src/hooks/` - Custom React hooks for toast notifications and other utilities
- `src/lib/` - Utility functions and Firebase configuration
- `src/types/` - TypeScript type definitions
- `src/ai/` - AI-related logic and budget advisor flows

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SpendSense
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy the `.env.local.example` file to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Update the `.env.local` file with your Firebase and Gemini API credentials.

4. Configure Firebase:
   - Set up a Firebase project.
   - Enable Authentication and Firestore.
   - Add your Firebase config to `src/lib/firebase.ts`.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Register or log in to your account.
- Add income and expense transactions using the provided forms.
- View your financial overviews and charts.
- Use the AI Budget Advisor for personalized tips.
- Edit or delete transactions as needed.

## Authentication

- Uses Firebase Authentication to manage user sign-in and sign-out.
- User preferences such as currency and budgets are stored in Firestore.

## Data Storage

- Transactions and user preferences are stored in Firestore under each user's document.
- Real-time updates are reflected in the UI using Firestore's onSnapshot listener.

## AI Budget Advisor

- Provides AI-powered budget advice based on user transactions.
- Implemented in the `src/components/budgetwise/ai-budget-advisor.tsx` and related AI flow files.

## UI and Styling

- Built with React and Next.js using the App Router.
- Styled with Tailwind CSS and custom UI components.
- Includes dialogs, toast notifications, charts, and responsive layouts.

## License

This project is licensed under the MIT License.

## Author

Created with care by jule.
