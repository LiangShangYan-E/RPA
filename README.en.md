# RPA Automation Process Platform

This is an enterprise-grade RPA (Robotic Process Automation) management platform built with Vue.js and Element Plus. The platform provides comprehensive functionalities for process design, task management, data processing, and system administration.

## Features

### Core Modules
- **Dashboard** - Real-time data statistics and visualization
- **Client Management** - Maintenance and management of client information
- **Task Management** - Creation, editing, and execution management of RPA tasks
- **Flow Design** - Visual process configuration with AI optimization features
- **Flow List** - Management and maintenance of process templates
- **Data Collect** - Data scraping and collection functionality
- **Data Parse** - Data format parsing and processing
- **Data Process** - Data cleaning and preprocessing
- **Data Query** - Data querying and filtering
- **Execution Record** - Viewing task execution logs and results

### System Management
- **User Management** - Management of system user accounts
- **Role Management** - Configuration of permission roles
- **Resource Management** - Allocation of system resources
- **Personal Center** - User profile and settings

## Technology Stack

- **Frontend Framework**: Vue.js 3
- **UI Component Library**: Element Plus
- **Chart Library**: ECharts
- **Build Tool**: Vite
- **HTTP Requests**: Axios

## Project Structure

```
RPA/
├── dist/                    # Production build files
│   ├── assets/            # Static assets
│   │   ├── *.js          # Page components
│   │   └── *.css        # Style files
│   └── index.html        # Entry HTML
├── .env                   # Environment configuration
├── .env.example          # Environment configuration example
└── .env.production       # Production environment configuration
```

## Installation & Configuration

### Prerequisites
- Node.js 16+
- npm 8+ or yarn 1.22+

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Update API configuration in `.env`:
```
VITE_API_BASE_URL=your_api_endpoint
```

4. Start the development server:
```bash
npm run dev
```

5. Build the production version:
```bash
npm run build
```

## Main Page Descriptions

### Login Page
Supports username/password login with a "Remember Me" option.

### Dashboard
Displays key business metrics, including:
- Total number of tasks
- Execution success rate
- Volume of processed data
- Recent task list

### Task Management
- Create new tasks (select process, configure parameters)
- Query and filter task lists
- View task details
- Control task execution

### Flow Design
- Configure target URLs
- Define fields (name, description, required status)
- AI-powered optimization features
- Real-time preview

### Execution Record
- Query execution history by time
- View execution results and logs
- Detailed error information

## Notes

1. Ensure the backend API service is running properly.
2. User permissions are automatically retrieved after login.
3. Certain features require specific permissions to access.

## License

This project is intended solely for learning and communication purposes.

## Related Documentation

For further usage instructions, refer to the accompanying project documentation.