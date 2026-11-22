# 🤖 Personal AI Assistant

An AI-powered Personal Assistant built using **Python, MCP (Model Context Protocol), Gemini AI, FastAPI, and PostgreSQL**. This application helps users manage their daily tasks, notes, and reminders while interacting with an AI assistant powered by Google's Gemini API.

## 🌟 Project Overview

The Personal AI Assistant is designed to simplify everyday task management through an interactive web dashboard and AI-powered conversations.

It combines MCP-based tool integration with a FastAPI backend and a responsive frontend, allowing users to organize their activities and interact with Gemini AI.

## ✨ Features

- **Task Management:** Create, view, update, complete, and delete tasks.
- **Notes Management:** Add, edit, view, and delete personal notes.
- **Reminder Management:** Create, update, track, and delete reminders.
- **AI Chat Assistant:** Interact with Google Gemini AI through a chat interface.
- **MCP Integration:** Uses the Model Context Protocol to expose assistant tools.
- **Database Integration:** Stores application data in PostgreSQL.
- **REST API:** FastAPI provides endpoints for frontend and backend communication.
- **Delete Confirmation:** Confirmation-based deletion to prevent accidental removal.
- **Responsive Dashboard:** User-friendly interface for desktop and mobile devices.
- **Dark/Light Mode:** Switch between different dashboard themes.
- **3D Visual Effects:** Animated background and interactive UI elements using Three.js.

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Programming Language | Python |
| AI Integration | Google Gemini API |
| AI Tool Integration | Model Context Protocol (MCP) |
| Backend | FastAPI, Uvicorn |
| Database | PostgreSQL (Neon), SQLite for initial local storage |
| Database Connectivity | Psycopg |
| Frontend | HTML, CSS, JavaScript |
| 3D Effects | Three.js |
| Version Control | Git, GitHub |
| Deployment | Render |
| Environment Management | Python Virtual Environment, python-dotenv |

## 🏗️ Project Architecture

```text
                 USER
                   |
                   v
        FRONTEND (HTML, CSS, JS)
                   |
                   v
          FASTAPI REST BACKEND
                   |
          +--------+--------+
          |                 |
          v                 v
    GEMINI AI API       DATABASE
          |             (NEON)
          |
          v
    AI CONVERSATION
          |
          v
    MCP TOOL INTEGRATION
          |
          v
    TASKS / NOTES / REMINDERS
```

**Architecture explanation:**
- **Frontend:** Provides the interactive dashboard and user interface.
- **FastAPI:** Handles HTTP requests and connects the frontend with backend functionality.
- **Gemini AI:** Processes user messages and generates intelligent responses.
- **MCP Server:** Provides tools that allow the AI assistant to interact with application functionality.
- **PostgreSQL:** Stores tasks, notes, and reminders persistently.
- **Render:** Hosts the frontend and backend application.

## 📁 Project Structure

```text
Personal_AI_Assistant/
│
├── server.py              # MCP server and assistant tools
├── api.py                 # FastAPI application and REST endpoints
├── database.py            # PostgreSQL database connection
├── gemini_client.py       # Gemini API integration
├── migrate_data.py        # SQLite to PostgreSQL migration
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not uploaded)
├── .gitignore             # Git ignored files
│
├── data/
│   └── assistant.db       # Initial SQLite database
│
└── frontend/
    ├── index.html         # Dashboard structure
    ├── style.css          # Dashboard styling
    └── script.js          # Frontend functionality
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Personal-AI-Assistant.git
```

### 2. Navigate to the Project Directory

```bash
cd Personal-AI-Assistant
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
```

Replace the placeholder values with your own credentials. Never upload your `.env` file or expose API keys and database credentials.

### 6. Run the Backend

```bash
uvicorn api:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

### 7. Open the Frontend

Open `frontend/index.html` in your browser or use the VS Code Live Server extension.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check API status |
| GET | `/api/tasks` | Retrieve tasks |
| GET | `/api/notes` | Retrieve notes |
| GET | `/api/reminders` | Retrieve reminders |
| POST | `/api/chat` | Interact with Gemini AI |

Additional CRUD operations are available for managing tasks, notes, and reminders.

## ☁️ Deployment

The application uses the following cloud services:

- **GitHub:** Source code management and version control.
- **Neon PostgreSQL:** Cloud database hosting.
- **Render Web Service:** FastAPI backend hosting.
- **Render Static Site:** Frontend hosting.

## 🔐 Security

- API keys and database credentials are stored in environment variables.
- Sensitive configuration files are excluded using `.gitignore`.
- Database operations are handled through backend functionality.

## 🚀 Future Enhancements

- Voice-controlled AI assistant.
- User authentication and personalized accounts.
- Email and push notifications for reminders.
- Advanced AI-powered productivity suggestions.
- Additional MCP tools and integrations.
- Improved security and access control.

## 👨‍💻 Developer

**Aditya Kumar Bal**

BCA Student | Aspiring Software Developer

Interested in Python, AI, Backend Development, Cloud Computing, and Full Stack Development.

## ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub!

---

**Built with Python, MCP, Gemini AI, FastAPI, and PostgreSQL.**
