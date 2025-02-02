# Claude Assistant UI

A modern web interface for interacting with the Claude Assistant.

## Features

- 💬 Chat-like interface for natural interactions
- 🎨 Modern Material-UI design
- 🔒 JWT-based authentication
- 🚀 Real-time responses
- 📱 Responsive layout
- ⚡ Fast development with Vite

## Getting Started

1. **Installation**
```bash
# Install dependencies
npm install
```

2. **Development**
```bash
# Start development server
npm run dev
```
The development server will start at http://localhost:5173

3. **Build**
```bash
# Build for production
npm run build
```

## Project Structure

```
src/
├── components/        # React components
│   ├── Chat.tsx      # Main chat interface
│   └── Login.tsx     # Authentication screen
├── App.tsx           # Root component
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

## Authentication

The UI uses JWT tokens for authentication. The login flow:
1. User enters credentials
2. Backend generates JWT token
3. Token is stored in localStorage
4. Token is included in all API requests

## Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in parent component
3. Add styles using Material-UI's `sx` prop or styled components

### API Integration

The UI communicates with the backend at `http://localhost:3000` with these endpoints:

- `POST /api/auth/token` - Generate authentication token
- `POST /api/command` - Send commands to the assistant
- `POST /api/tool/:name` - Execute specific tools

### Environment Variables

Create `.env` file for environment-specific settings:
```env
VITE_API_URL=http://localhost:3000
```

## Styling

- Uses Material-UI components
- Custom theme in `App.tsx`
- Global styles in `index.css`
- Responsive design for all screen sizes

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Dependencies

- React
- Material-UI
- Axios
- TypeScript
- Vite
- @fontsource/roboto

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
