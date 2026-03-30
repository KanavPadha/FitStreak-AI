# Fitness & Nutrition AI App

This is a full-stack application built with React, Vite, Express, and Google Gemini AI.

## Features

- **BMI Calculator**: Calculate your Body Mass Index and get AI-powered health advice.
- **Meal Calculator**: Estimate calories and macronutrients from food descriptions using AI.
- **AI Trainer**: Get personalized workout plans and fitness advice.
- **Exercise Library**: Explore a collection of exercises with AI-generated details.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A Google Gemini API Key (Get one at [Google AI Studio](https://aistudio.google.com/app/apikey))

## Getting Started

1. **Clone the repository** (if you haven't already):
   ```bash
   # If you downloaded the ZIP, just extract it and open the folder in VS Code
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Open the `.env` file in the root directory.
   - Add your Gemini API Key to the `VITE_GEMINI_API_KEY` variable.

4. **Authorize Localhost in Firebase (Crucial for Login)**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select your project.
   - Go to **Authentication** > **Settings** > **Authorized domains**.
   - Click **Add domain** and enter `localhost`.
   - This allows the Google Sign-In popup to work on your local machine.

5. **Run the application**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   - Navigate to `http://localhost:3000` in your browser.

## Project Structure

- `src/`: Frontend React application.
- `server.ts`: Backend Express server with Vite middleware.
- `vite.config.ts`: Vite configuration.
- `tailwind.config.ts`: Tailwind CSS configuration.

## Scripts

- `npm run dev`: Starts the development server (Frontend + Backend).
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server (after building).
- `npm run lint`: Runs TypeScript type checking.
