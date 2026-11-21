
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import server as assistant
from database import get_connection


app = FastAPI(title="Personal AI Assistant API")


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class TaskData(BaseModel):
    title: str
    description: str = ""


class TaskUpdate(TaskData):
    pass


class StatusData(BaseModel):
    status: str


class NoteData(BaseModel):
    title: str
    content: str


class ReminderData(BaseModel):
    title: str
    reminder_time: str
    description: str = ""


class ChatData(BaseModel):
    message: str


# ---------------- TASK APIs ----------------

@app.get("/api/tasks")
def get_all_tasks():

    with get_connection() as connection:
        tasks = connection.execute(
            """
            SELECT id, title, description, status, created_at
            FROM tasks
            ORDER BY id DESC
            """
        ).fetchall()

        return tasks


@app.post("/api/tasks")
def create_task(data: TaskData):
    return {
        "message": assistant.add_task(
            data.title, data.description
        )
    }


@app.put("/api/tasks/{task_id}")
def edit_task(task_id: int, data: TaskUpdate):
    return {
        "message": assistant.update_task(
            task_id, data.title, data.description
        )
    }


@app.patch("/api/tasks/{task_id}/status")
def change_task_status(task_id: int, data: StatusData):
    return {
        "message": assistant.update_task_status(
            task_id, data.status
        )
    }


@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: int):
    return {"message": assistant.delete_task(task_id)}


# ---------------- NOTES APIs ----------------

@app.get("/api/notes")
def get_all_notes():

    with get_connection() as connection:
        notes = connection.execute(
            """
            SELECT id, title, content, created_at
            FROM notes
            ORDER BY id DESC
            """
        ).fetchall()

        return notes


@app.post("/api/notes")
def create_note(data: NoteData):
    return {
        "message": assistant.add_note(
            data.title, data.content
        )
    }


@app.put("/api/notes/{note_id}")
def edit_note(note_id: int, data: NoteData):
    return {
        "message": assistant.update_note(
            note_id, data.title, data.content
        )
    }


@app.delete("/api/notes/{note_id}")
def remove_note(note_id: int):
    return {"message": assistant.delete_note(note_id)}


# ---------------- REMINDER APIs ----------------

@app.get("/api/reminders")
def get_all_reminders():

    with get_connection() as connection:
        reminders = connection.execute(
            """
            SELECT id, title, description, reminder_time,
                   status, created_at
            FROM reminders
            ORDER BY reminder_time
            """
        ).fetchall()

        return reminders


@app.post("/api/reminders")
def create_reminder(data: ReminderData):
    return {
        "message": assistant.add_reminder(
            data.title,
            data.reminder_time,
            data.description
        )
    }


@app.put("/api/reminders/{reminder_id}")
def edit_reminder(reminder_id: int, data: ReminderData):
    return {
        "message": assistant.update_reminder(
            reminder_id,
            data.title,
            data.reminder_time,
            data.description
        )
    }


@app.patch("/api/reminders/{reminder_id}/status")
def change_reminder_status(reminder_id: int, data: StatusData):
    return {
        "message": assistant.update_reminder_status(
            reminder_id, data.status
        )
    }


@app.delete("/api/reminders/{reminder_id}")
def remove_reminder(reminder_id: int):
    return {
        "message": assistant.delete_reminder(reminder_id)
    }


# ---------------- GEMINI AI API ----------------

@app.post("/api/chat")
def chat(data: ChatData):
    response = assistant.chat_with_ai(data.message)
    return {"response": response}


# ---------------- HEALTH CHECK ----------------

@app.get("/")
def home():
    return {
        "message": "Personal AI Assistant API is running!"
    }
