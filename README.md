# Spaced Repetition Flashcard App

A full-stack web application for creating and studying flashcards using spaced repetition algorithms to optimize learning retention.

## Overview

This application combines a modern React frontend with a FastAPI backend to provide an efficient study platform. Users can create flashcards, organize them into courses, and study using scientifically-proven spaced repetition techniques powered by the FSRS (Forgetting Curve Spaced Repetition System).

## Features

- **User Authentication**: Register and login with email and password
- **Course Management**: Create courses (educators only) and join courses with class codes
- **Flashcard Management**: 
  - Create and edit personal flashcards
  - Delete local flashcards
  - Promote flashcards to public cards (educators only)
  - Support for mathematical notation using LaTeX
- **Spaced Repetition**: Optimized learning schedule based on FSRS algorithm
- **Role-Based Access**: Different permissions for regular users and educators

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Spaced Repetition**: FSRS (Forgetting Curve Spaced Repetition System)
- **Language**: Python 3

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Math Rendering**: KaTeX
- **Icons**: Lucide React
- **Styling**: CSS

## Project Structure

```
.
├── backend/                    # FastAPI backend server
│   ├── app/
│   │   ├── model.py
│   │   ├── db.py
│   │   └── [[ongoing work for authentication, upload data, store data, plus some issues]]
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # Context providers (Auth, Theme)
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── store.js
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── nginx.conf
├── podman-compose.yml         # Docker Compose configuration
└── Specification.txt          # API specifications
```

## Getting Started

### Prerequisites
- Podman (or Docker)
- Podman Compose

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd Decksterity
```

2. Build and run the application:
```bash
podman compose up --build --force-recreate --detach
```

This will start both the backend and frontend services in containers, and replace previous builds if exists.

3. Access the application:
- **Frontend**: `http://localhost:3000` (or configured port)
- **Backend API**: `http://localhost:8000`

### Stopping the Application

```bash
podman-compose -f podman-compose.yml down
```

### Building Images

To build the Docker images without running:
```bash
podman-compose -f podman-compose.yml build
```

### Running Services

Run specific service:
```bash
podman-compose -f podman-compose.yml up backend
podman-compose -f podman-compose.yml up frontend
```

### Development with Podman

For development, you can view logs:
```bash
podman-compose -f podman-compose.yml logs -f
```

For a specific service:
```bash
podman-compose -f podman-compose.yml logs -f backend
```

## Container Services

### Backend Service
- Built from `backend/Dockerfile`
- FastAPI application running on port 8000
- Handles API requests and spaced repetition logic

### Frontend Service
- Built from `frontend/Dockerfile`
- React application with Nginx
- Serves the web interface
- Uses nginx.conf for server configuration

## API Endpoints

### Authentication
- `POST /login` - Authenticate user (returns access token)
- `POST /register` - Create new user account
- `POST /auto-login` - Auto-login with access token

### Courses
- `POST /courses` - Create a new course (educators only)
- `POST /courses/join` - Join an existing course

### Flashcards
- `POST /cards` - Create a new flashcard
- `PUT /cards/{id}` - Edit a flashcard
- `DELETE /cards/{id}` - Delete a flashcard
- `POST /cards/{id}/promote` - Promote to public card (educators only)

## Components

### Frontend Components
- **AccountMenu** - User account dropdown menu
- **CourseCard** - Course display component
- **FlashCard** - Individual flashcard display
- **Sidebar** - Navigation sidebar
- **AuthProvider** - Authentication context
- **ThemeProvider** - Theme context

### Pages
- **Login** - User login page
- **Dashboard** - Main dashboard with courses
- **CourseDetail** - Course details and flashcards
- **Study** - Study interface for learning
- **Editor** - Flashcard editor
- **Error404** - 404 error page

## Contributing

Contributions are welcome! Please ensure code follows the ESLint rules defined in the project.

## License

See [LICENSE](LICENSE) file for details.

## Development Notes

- Mathematical notation in flashcards is supported using KaTeX
- The FSRS algorithm optimizes review schedules based on user performance
- Authentication uses token-based sessions with cookies
