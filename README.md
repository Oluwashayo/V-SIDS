# V-SIDS - AI-Powered Skin Condition Analysis

A modern, AI-powered web application for analyzing skin conditions using advanced computer vision and natural language processing. Built with pyhton, Next.js, TypeScript, and Tailwind CSS.

## 🌟 Features

- **AI-Powered Analysis**: Upload images of skin concerns and get instant AI-powered analysis
- **Real-time Processing**: Fast, accurate skin condition assessment using LoRA (Low-Rank Adaptation) fine-tuned  LLaVA (Large Language and Vision Assistant)
- **Modern UI/UX**: Beautiful, responsive interface with dark/light theme support
- **Mobile-First Design**: Optimized for both desktop and mobile devices
- **Conversation History**: Save and review previous analyses
- **Export Functionality**: Export conversation history for medical consultations
- **Offline Support**: Progressive Web App (PWA) capabilities

## 🚀 Live Demo

Visit the live application: [V-SIDS App](https://v-sids.vercel.app)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI + shadcn/ui
- **AI Integration**: LLaVA RAG API
- **Deployment**: Vercel
- **PWA**: Service Worker with Serwist

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Oluwashayo/V-SIDS.git
cd V-SIDS
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📱 Usage

1. **Upload an Image**: Click the image icon to upload a photo of your skin concern
2. **Describe Your Concern**: Add a description of your symptoms or questions
3. **Get AI Analysis**: Receive instant AI-powered analysis and recommendations
4. **Review Results**: View detailed analysis with medical disclaimers
5. **Export if Needed**: Save your conversation for medical consultations

## 🏗️ Project Structure

```
v-sids-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── diagnose/      # Skin analysis endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── theme-provider.tsx # Theme context
│   └── theme-toggle.tsx  # Theme switcher
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── api-service.ts    # API integration
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── styles/               # Additional stylesheets
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add any required environment variables here
# Currently using public API endpoints
```

### API Integration

The application integrates with the LLaVA RAG API for skin analysis. The API endpoint is configured in `app/api/diagnose/route.ts`.

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**: Your code is already on GitHub
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

**Important**: V-SIDS is for informational purposes only and should not replace professional medical advice. Always consult with a qualified dermatologist or healthcare provider for proper diagnosis and treatment.

- The AI analysis is not a substitute for professional medical evaluation
- Results may not be 100% accurate
- Seek immediate medical attention for serious skin concerns
- Use this tool as a preliminary screening only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need support:

- **Issues**: [GitHub Issues](https://github.com/Oluwashayo/V-SIDS/issues)
- **Email**: Contact through GitHub profile

## 🙏 Acknowledgments

- **LLaVA Team**: For the powerful vision-language model
- **shadcn/ui**: For the beautiful UI components
- **Vercel**: For seamless deployment
- **Next.js Team**: For the amazing framework

## 📈 Roadmap

- [ ] Multi-language support
- [ ] Full fine tuning with more datasets
- [ ] Advanced image preprocessing
- [ ] Integration with medical databases
- [ ] Mobile app version
- [ ] Telemedicine integration
- [ ] Advanced analytics dashboard

---

**Built with ❤️ by [Oluwashayo](https://github.com/Oluwashayo)** 
