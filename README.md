# 🏢 Enterprise Asset & Maintenance Management System (EAMMS)

A web-based application to help organizations manage assets, track assignments, handle maintenance requests, and generate lifecycle reports — all with role-based access control.

🔗 **Frontend:** https://fluxion-nu.vercel.app  
🔗 **Admin Panel:** https://fluxion-admindash.vercel.app

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development Methodology](#development-methodology)
- [Team](#team)

---

## 📖 About the Project

EAMMS is designed to streamline how organizations handle their physical assets — from laptops and printers to vehicles. It enables asset registration, assignment tracking, maintenance ticketing, service history logging, and insightful reporting — all in one place.

**Key Goals:**
- Reduce asset loss through accurate tracking
- Improve maintenance efficiency with ticket management
- Provide data-driven insights via reports and dashboards.

---

## ✨ Features

| Module | Description |
|---|---|
| 👤 User Management | Admin can create, update, and delete users with role assignment |
| 📦 Asset Management | Register and manage company assets with full lifecycle tracking |
| 🔁 Asset Assignment | Assign, transfer, and unassign assets to departments or employees |
| 🔧 Maintenance Tickets | Create, assign, and track repair tickets with status updates |
| 📋 Maintenance Logs | Automatic logging of repair history, costs, and technician details |
| 📊 Reports | Generate and export Asset, Maintenance Cost, Warranty Expiry, and SLA reports |
| 📈 Dashboard | Overview of total assets, maintenance status, overdue tickets, and cost summary |
| 🏷️ QR Code Labels | Auto-generate QR codes per asset for quick scanning and details access |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | .NET Web API |
| Database | MySQL |
| Containerization | Docker |
| Cloud Deployment | Azure App Service |
| CI/CD | GitHub Actions |
| Testing | xUnit / NUnit, Selenium, JMeter |
| Version Control | Git (GitHub) |

---

## 🏗️ System Architecture

```
User → React Frontend → .NET Backend API → MySQL Database
```

- **Frontend** served via browser (Chrome, Edge)
- **Backend** exposes RESTful API endpoints
- **Database** stores all entities (users, assets, tickets, logs)
- **Docker** ensures consistent dev/prod environments
- **Azure App Service** hosts the production deployment

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Admin** | Full system access — manage users, departments, vendors, and assets |
| **Manager** | Manage and assign assets, create and manage maintenance tickets, view reports |
| **Technician** | View assigned tickets, update repair status, add repair notes and costs |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (for React frontend)
- [.NET SDK](https://dotnet.microsoft.com/) (for backend)
- [MySQL](https://www.mysql.com/) or compatible database server
- [Docker](https://www.docker.com/) (optional, for containerized setup)

### Clone the Repository

```bash
git clone https://github.com/your-org/eamms.git
cd eamms
```

---

## ⚙️ Environment Setup

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Update API base URL in .env
npm start
```

### Backend

```bash
cd backend
dotnet restore
# Update connection string in appsettings.json
dotnet run
```

### Database

```bash
# Run migrations
dotnet ef database update
```

### Docker (Optional)

```bash
docker-compose up --build
```

---

## ▶️ Running the Application

| Service | Default URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:5000` |
| Swagger Docs | `http://localhost:5000/swagger` |

---

## 📚 API Documentation

Full API documentation is available via Swagger at `/swagger` when the backend is running locally.

---

## 🗄️ Database Schema

The system uses the following core tables:

- `Users` — system users and credentials
- `Roles` — user role definitions
- `Assets` — registered company assets
- `Departments` — organizational departments/locations
- `AssetAssignments` — asset-to-user/department assignment records
- `MaintenanceTickets` — maintenance requests and status tracking
- `MaintenanceLogs` — completed repair history and costs

---

## 🔄 Development Methodology

This project follows **Agile Scrum** with **2-week sprints**.

Each sprint includes Sprint Planning, Daily Standups, Sprint Review, and Sprint Retrospective.

### Branching Strategy

```
main          ← production-ready code
develop       ← integration branch
feature/*     ← individual feature branches
```

Pull requests are required before merging into `develop` or `main`.

### CI/CD Pipeline (GitHub Actions)

Automated workflows handle:
- Code validation & linting
- Unit and integration tests
- Docker build
- Deployment to Azure

#### Required GitHub Secrets (backend deploy)

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `VM_HOST`
- `VM_USER`
- `VM_SSH_PRIVATE_KEY`
- `DB_CONNECTION_STRING`
- `JWT_SECRET_KEY`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_EXPIRY_MINUTES`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ALLOWED_ORIGIN_0`
- `ALLOWED_ORIGIN_1`

---

## 👨‍💻 Team

| Name | GitHub |
|---|---|
| Kaveen Gunarathna | [@kaveen20030408](https://github.com/kaveen20030408) |
| Lakdinu Jayawardena | [@L-Jayawardhana](https://github.com/L-Jayawardhana) |
| Pulith Thewmika | [@PulithThewmika](https://github.com/PulithThewmika) |
| Jayaru Manilka | [@Jayaru2003](https://github.com/Jayaru2003) |

---

## 🔮 Future Enhancements

- 📧 Email notifications for ticket updates and warranty alerts
- 🗓️ Automatic maintenance scheduling
- 📱 Mobile app version

---

## 📄 License

This project is developed for academic purposes.
