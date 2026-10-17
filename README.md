# StockMaster Inventory Management System

StockMaster is a Django-based inventory and operations platform for multi-client inventory management. The project includes a backend REST API and a static frontend interface served as separate HTML/JavaScript assets.

## Project overview

- Multi-client tenant-aware inventory, product, purchasing, sales, customer, supplier, and reporting workflows
- Role-based access for Super Admin, Client Admin, Manager, and Staff users
- Password reset flow using signed reset tokens
- Activity logging for operational audit trails
- Separate frontend assets stored under the `frontend/` directory

## Tech stack

- Backend: Django 5.2
- Database: SQLite for local development; PostgreSQL is recommended for production
- Environment handling: python-dotenv
- Production server: PythonAnywhere WSGI or Gunicorn

## Repository layout

- `backend/` — Django project and API
- `frontend/` — static UI pages and scripts
- `.env.example` — environment template
- `pythonanywhere_wsgi.py` — auto-detecting PythonAnywhere WSGI entry point

## Requirements

- Python 3.11+
- pip
- Access to a writable local or hosted PostgreSQL database for production deployments

## Local setup

1. Open a terminal in the project root.
2. Create a venv and activate it.
3. Install Python dependencies:

   ```bash
   cd inventory_management_system
   python -m pip install -r requirements.txt
   ```

4. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

5. Update the values in `.env` as needed.
6. Run database migrations:

   ```bash
   cd backend
   python manage.py migrate
   ```

7. Start the application:

   ```bash
   cd backend
   python manage.py runserver 127.0.0.1:8000
   ```

## Environment variables

See `.env.example` for the required values. The most important settings are:

- `SECRET_KEY` — required for secure sessions and CSRF protection (`DJANGO_SECRET_KEY` is also accepted)
- `DEBUG` — set to `False` in production (`DJANGO_DEBUG` is also accepted as a fallback)
- `ALLOWED_HOSTS` — production domain list
- `FRONTEND_BASE_URL` — public frontend URL used for password reset links
- `CORS_ALLOWED_ORIGINS` — allowed frontend origins
- `CSRF_TRUSTED_ORIGINS` — trusted frontend origins for CSRF
- `DATABASE_URL` or `DB_ENGINE` plus `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` — database selection and connection
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`, and `DEFAULT_FROM_EMAIL` — SMTP or console email config

## Testing

Run the Django test suite:

```bash
cd backend
python manage.py test
```

## Production notes

PythonAnywhere setup is documented in [DEPLOYMENT.md](DEPLOYMENT.md). Static frontend pages are collected under `/static/frontend/`; there is no JavaScript package/build manifest, and not all frontend pages are connected to live APIs. Verify every workflow you intend to expose before launch.

## Operational guidance

- Keep secrets in environment variables, not in source control.
- Never deploy with `DJANGO_DEBUG=True`.
- Do not expose the admin or API publicly without authentication and origin restrictions.
- Run migrations as part of deployment and before startup.

## Known project status

- Local backend verification: passed
- Production deployment configuration: requires external host configuration and environment values
