
import sqlite3
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from gemini_client import ask_gemini


# Create MCP server
mcp = FastMCP("Personal AI Assistant")
pending_task_deletion = None
pending_note_deletion = None
pending_reminder_deletion = None

@mcp.tool()
def chat_with_ai(message: str) -> str:
    """Chat with Gemini AI and get an intelligent response."""
    try:
        return ask_gemini(
    message,
    tools=[
    create_task_for_gemini,
    get_tasks_for_gemini,
    update_task_for_gemini,
    update_task_status_for_gemini,
    delete_task_for_gemini,
    add_note_for_gemini,
    get_notes_for_gemini,
    update_note_for_gemini,
    delete_note_for_gemini,
    add_reminder_for_gemini,
    get_reminders_for_gemini,
    update_reminder_for_gemini,
    update_reminder_status_for_gemini,
    delete_reminder_for_gemini,
    confirm_delete_task_for_gemini,
    confirm_delete_note_for_gemini,
    confirm_delete_reminder_for_gemini
    
]
)
    except Exception as e:
        return f"AI Error: {str(e)}"

# Database path
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "assistant.db"


# Database connection function
def get_connection():
    return sqlite3.connect(DB_PATH)


#----------------------||TASK MANAGEMENT ||-----------------------------

# Tool 1: Add a new task
@mcp.tool()
def add_task(title: str, description: str = "") -> str:
    """Add a new task to the personal task manager."""

    if not title or not title.strip():
        return "Error: Task title cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "INSERT INTO tasks (title, description) VALUES (?, ?)",
            (title.strip(), description.strip())
        )

        task_id = cursor.lastrowid
        connection.commit()

        return (
            f"Task added successfully! Task ID: {task_id}, "
            f"Title: {title.strip()}"
        )

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()



def create_task_for_gemini(
    title: str,
    description: str = ""
) -> str:
    """Create and save a new task.

    Args:
        title: The title of the task.
        description: Additional details about the task.
    """

    return add_task(title, description)


# Tool 2: View all saved tasks
@mcp.tool()
def get_tasks() -> str:
    """Retrieve all tasks saved in the database."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id, title, description, status FROM tasks ORDER BY id"
        )

        tasks = cursor.fetchall()

        if not tasks:
            return "No tasks found. Please add a task first."

        result = "Your Saved Tasks:\n\n"

        for task in tasks:
            task_id, title, description, status = task

            result += (
                f"ID: {task_id}\n"
                f"Title: {title}\n"
                f"Description: {description}\n"
                f"Status: {status}\n"
                "--------------------\n"
            )

        return result

    except Exception as e:
        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()


def get_tasks_for_gemini() -> str:
    """Retrieve all saved tasks."""
    return get_tasks()


# Tool 3: Update task status

@mcp.tool()
def update_task_status(task_id: int, status: str) -> str:
    """Update a task status using its ID."""

    status = status.strip().lower()

    if status not in ["pending", "completed"]:
        return "Error: Status must be pending or completed."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE tasks SET status = ? WHERE id = ?",
            (status, task_id)
        )

        updated_rows = cursor.rowcount

        if updated_rows == 0:
            return f"Task with ID {task_id} was not found."

        connection.commit()

        return (
            f"Task {task_id} updated successfully! "
            f"New status: {status}"
        )

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def update_task_status_for_gemini(
    task_id: int,
    status: str
) -> str:
    """Change the status of an existing task."""
    return update_task_status(task_id, status)

def update_task_for_gemini(
    task_id: int,
    title: str,
    description: str = ""
) -> str:
    """Update an existing task."""
    return update_task(task_id, title, description)



# Tool 3: Delete a task

@mcp.tool()
def delete_task(task_id: int) -> str:
    """Delete a task using its ID."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check whether the task exists
        cursor.execute(
            "SELECT title FROM tasks WHERE id = ?",
            (task_id,)
        )

        task = cursor.fetchone()

        if task is None:
            return f"No task found with ID: {task_id}"

        # Delete the task
        cursor.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,)
        )

        connection.commit()

        return (
            f"Task deleted successfully! "
            f"Task ID: {task_id}, Title: {task[0]}"
        )

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()


def delete_task_for_gemini(task_id: int) -> str:
    """Request confirmation before deleting a task."""

    global pending_task_deletion

    pending_task_deletion = task_id

    return (
        f"Confirmation required: Do you want to delete "
        f"task {task_id}? Reply YES to confirm or NO to cancel."
    )
def confirm_delete_task_for_gemini(confirmation: str) -> str:
    """Confirm or cancel the pending task deletion."""

    global pending_task_deletion

    if pending_task_deletion is None:
        return "No pending task deletion found."

    if confirmation.lower().strip() == "yes":
        task_id = pending_task_deletion
        pending_task_deletion = None
        return delete_task(task_id)

    if confirmation.lower().strip() == "no":
        pending_task_deletion = None
        return "Task deletion cancelled."

    return "Please reply YES or NO."


# Tool 4: Update an existing task
@mcp.tool()
def update_task(
    task_id: int,
    title: str,
    description: str = ""
) -> str:
    """Update the title and description of an existing task."""

    if not title or not title.strip():
        return "Error: Task title cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check whether the task exists
        cursor.execute(
            "SELECT id FROM tasks WHERE id = ?",
            (task_id,)
        )

        task = cursor.fetchone()

        if task is None:
            return f"No task found with ID: {task_id}"

        # Update task details
        cursor.execute(
            """
            UPDATE tasks
            SET title = ?, description = ?
            WHERE id = ?
            """,
            (title.strip(), description.strip(), task_id)
        )

        connection.commit()

        return f"Task ID {task_id} updated successfully!"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()


#------------------------||ADD NOTES||-------------------------------------------||

# Tool 1: Add a new note

@mcp.tool()
def add_note(title: str, content: str) -> str:
    """Save a new personal note in the database."""

    if not title or not title.strip():
        return "Error: Note title cannot be empty."

    if not content or not content.strip():
        return "Error: Note content cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "INSERT INTO notes (title, content) VALUES (?, ?)",
            (title.strip(), content.strip())
        )

        note_id = cursor.lastrowid
        connection.commit()

        return (
            f"Note saved successfully! Note ID: {note_id}, "
            f"Title: {title.strip()}"
        )

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def add_note_for_gemini(title: str, content: str) -> str:
    """Create and save a new note."""
    return add_note(title, content)

# Tool 2: Get all saved notes
@mcp.tool()
def get_notes() -> str:
    """Retrieve all saved notes from the database."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id, title, content, created_at FROM notes ORDER BY id"
        )

        notes = cursor.fetchall()

        if not notes:
            return "No notes found."

        result = "Your Saved Notes:\n\n"

        for note in notes:
            result += (
                f"Note ID: {note[0]}\n"
                f"Title: {note[1]}\n"
                f"Content: {note[2]}\n"
                f"Created At: {note[3]}\n"
                "-------------------------\n"
            )

        return result

    except Exception as e:
        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def get_notes_for_gemini() -> str:
    """Retrieve all saved notes."""
    return get_notes()

# Tool 3: Update an existing note
@mcp.tool()
def update_note(note_id: int, title: str, content: str) -> str:
    """Update the title and content of an existing note."""

    if not title or not title.strip():
        return "Error: Note title cannot be empty."

    if not content or not content.strip():
        return "Error: Note content cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE notes SET title = ?, content = ? WHERE id = ?",
            (title.strip(), content.strip(), note_id)
        )

        if cursor.rowcount == 0:
            return f"No note found with ID {note_id}."

        connection.commit()

        return f"Note {note_id} updated successfully!"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()


def update_note_for_gemini(
    note_id: int,
    title: str,
    content: str
) -> str:
    """Update an existing note."""
    return update_note(note_id, title, content)

# Tool 4: Delete an existing note
@mcp.tool()
def delete_note(note_id: int) -> str:
    """Delete a note using its ID."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM notes WHERE id = ?",
            (note_id,)
        )

        if cursor.rowcount == 0:
            return f"No note found with ID {note_id}."

        connection.commit()

        return f"Note {note_id} deleted successfully!"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

@mcp.tool()
def delete_note(note_id: int) -> str:
    """Delete a note using its ID."""

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM notes WHERE id = ?",
        (note_id,)
    )

    connection.commit()

    if cursor.rowcount == 0:
        connection.close()
        return f"No note found with ID {note_id}."

    connection.close()

    return f"Note {note_id} deleted successfully!"

def delete_note_for_gemini(note_id: int) -> str:
    """Request confirmation before deleting a note."""

    global pending_note_deletion

    pending_note_deletion = note_id

    return (
        f"Confirmation required: Do you want to delete "
        f"note {note_id}? Reply YES to confirm or NO to cancel."
    )
    
def confirm_delete_note_for_gemini(confirmation: str) -> str:
    """Confirm or cancel the pending note deletion."""

    global pending_note_deletion

    if pending_note_deletion is None:
        return "No pending note deletion found."

    if confirmation.lower().strip() == "yes":
        note_id = pending_note_deletion
        pending_note_deletion = None
        return delete_note(note_id)

    if confirmation.lower().strip() == "no":
        pending_note_deletion = None
        return "Note deletion cancelled."

    return "Please reply YES or NO."


#-----------------------------||ADD REMAINDERS||---------------------------

# Tool 1: Add a new reminder

@mcp.tool()
def add_reminder(
    title: str,
    reminder_time: str,
    description: str = ""
) -> str:
    """Save a new reminder in the database."""

    if not title or not title.strip():
        return "Error: Reminder title cannot be empty."

    if not reminder_time or not reminder_time.strip():
        return "Error: Reminder time cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO reminders (title, description, reminder_time)
            VALUES (?, ?, ?)
            """,
            (title.strip(), description.strip(), reminder_time.strip())
        )

        reminder_id = cursor.lastrowid
        connection.commit()

        return f"Reminder saved successfully! Reminder ID: {reminder_id}"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def add_reminder_for_gemini(
    title: str,
    reminder_time: str,
    description: str = ""
) -> str:
    """Create and save a new reminder."""
    return add_reminder(title, reminder_time, description)

# Tool 2: Get all reminders

@mcp.tool()
def get_reminders() -> str:
    """Retrieve all saved reminders from the database."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, title, description, reminder_time, status
            FROM reminders
            ORDER BY reminder_time
            """
        )

        reminders = cursor.fetchall()

        if not reminders:
            return "No reminders found."

        result = "Your Saved Reminders:\n\n"

        for reminder in reminders:
            result += (
                f"Reminder ID: {reminder[0]}\n"
                f"Title: {reminder[1]}\n"
                f"Description: {reminder[2]}\n"
                f"Reminder Time: {reminder[3]}\n"
                f"Status: {reminder[4]}\n"
                "-------------------------\n"
            )

        return result

    except Exception as e:
        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def get_reminders_for_gemini() -> str:
    """Retrieve all saved reminders."""
    return get_reminders()


# Tool 3: Update an existing reminder
@mcp.tool()
def update_reminder(
    reminder_id: int,
    title: str,
    reminder_time: str,
    description: str = ""
) -> str:
    """Update an existing reminder."""

    if not title or not title.strip():
        return "Error: Reminder title cannot be empty."

    if not reminder_time or not reminder_time.strip():
        return "Error: Reminder time cannot be empty."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE reminders
            SET title = ?, description = ?, reminder_time = ?
            WHERE id = ?
            """,
            (title.strip(), description.strip(), reminder_time.strip(), reminder_id)
        )

        if cursor.rowcount == 0:
            return f"No reminder found with ID {reminder_id}."

        connection.commit()

        return f"Reminder {reminder_id} updated successfully!"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def update_reminder_for_gemini(
    reminder_id: int,
    title: str,
    reminder_time: str,
    description: str = ""
) -> str:
    """Update an existing reminder."""
    return update_reminder(
        reminder_id,
        title,
        reminder_time,
        description
    )


# Tool 4: Delete an existing reminder

@mcp.tool()
def delete_reminder(reminder_id: int) -> str:
    """Delete a reminder using its ID."""

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM reminders WHERE id = ?",
            (reminder_id,)
        )

        if cursor.rowcount == 0:
            return f"No reminder found with ID {reminder_id}."

        connection.commit()

        return f"Reminder {reminder_id} deleted successfully!"

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()


def delete_reminder_for_gemini(reminder_id: int) -> str:
    """Request confirmation before deleting a reminder."""

    global pending_reminder_deletion

    pending_reminder_deletion = reminder_id

    return (
        f"Confirmation required: Do you want to delete "
        f"reminder {reminder_id}? Reply YES to confirm or NO to cancel."
    )

def confirm_delete_reminder_for_gemini(
    confirmation: str
) -> str:
    """Confirm or cancel the pending reminder deletion."""

    global pending_reminder_deletion

    if pending_reminder_deletion is None:
        return "No pending reminder deletion found."

    if confirmation.lower().strip() == "yes":
        reminder_id = pending_reminder_deletion
        pending_reminder_deletion = None
        return delete_reminder(reminder_id)

    if confirmation.lower().strip() == "no":
        pending_reminder_deletion = None
        return "Reminder deletion cancelled."

    return "Please reply YES or NO."


# Tool 5: Update reminder status

@mcp.tool()
def update_reminder_status(reminder_id: int, status: str) -> str:
    """Change a reminder status to pending or completed."""

    status = status.strip().lower()

    if status not in ["pending", "completed"]:
        return "Error: Status must be pending or completed."

    connection = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE reminders SET status = ? WHERE id = ?",
            (status, reminder_id)
        )

        if cursor.rowcount == 0:
            return f"No reminder found with ID {reminder_id}."

        connection.commit()

        return f"Reminder {reminder_id} status updated to {status}."

    except Exception as e:
        if connection:
            connection.rollback()

        return f"Database Error: {str(e)}"

    finally:
        if connection:
            connection.close()

def update_reminder_status_for_gemini(
    reminder_id: int,
    status: str
) -> str:
    """Update the status of an existing reminder."""
    return update_reminder_status(reminder_id, status)

# Tool 4: Greeting
@mcp.tool()
def hello(name: str) -> str:
    """Greet the user by name."""
    return f"Hello {name}! Welcome to your Personal AI Assistant."


# Start MCP server
if __name__ == "__main__":
    mcp.run(transport="stdio")
