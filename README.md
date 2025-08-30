# Crypto Payroll Platform

A modern, full-featured cryptocurrency payroll management platform built with Next.js, featuring Avalanche (AVAX) support, dark/light mode, and responsive design.

## Features

- 🚀 **Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui components
- 🌙 **Dark/Light Mode**: Complete theme switching with next-themes
- 📱 **Responsive Design**: Mobile-first design with professional navigation
- 💰 **Multi-Token Support**: Support for ETH, MATIC, OP, ARB, SOL, and AVAX (Avalanche Fuji Testnet)
- 👥 **Employee Management**: Complete employee onboarding and management system
- 📊 **AI-Powered Insights**: Budget forecasting and compliance monitoring
- 🔒 **Compliance Tools**: Built-in compliance checks and reporting
- ⚡ **Real-time Updates**: Live payroll execution and status tracking

## Getting Started

First, install the dependencies:

```bash
npm install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Automatic Deployment with Vercel + GitHub Actions

This project includes GitHub Actions workflows for automatic deployment to Vercel.

#### Setup Instructions:

1. **Connect to Vercel:**
   - Import your project to Vercel
   - Note down your Project ID and Org ID from Vercel dashboard

2. **Set GitHub Secrets:**
   Go to your GitHub repository settings > Secrets and variables > Actions, and add:
   - `VERCEL_TOKEN`: Your Vercel API token (get from Vercel dashboard > Settings > Tokens)
   - `ORG_ID`: Your Vercel organization ID
   - `PROJECT_ID`: Your Vercel project ID

3. **Push to main/master branch:**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

The GitHub Action will automatically deploy your app to Vercel on every push to the main branch.

### Manual Deployment

You can also deploy manually using the Vercel CLI:

```bash
npm install -g vercel
vercel --prod
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and theme variables
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Main payroll application
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── theme-provider.tsx   # Theme context provider
│   └── theme-toggle.tsx     # Theme toggle button
└── ...
```

## Environment Variables

Create a `.env.local` file for local development (optional):

```env
# Add any environment variables here
NEXT_PUBLIC_APP_NAME=Crypto Payroll Platform
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## License

This project is for demonstration purposes. 

---

Built with ❤️ using Next.js and modern web technologies.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
