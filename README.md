# Gmail Client

A web-based Gmail client application that allows users to authenticate with Google OAuth, view emails, send emails, and track email opens using pixel tracking.

## Features

- **Google OAuth Authentication**: Secure login using Google OAuth 2.0
- **Email Viewing**: Fetch and display emails from Gmail with full content parsing
- **Email Sending**: Send HTML emails with optional read tracking
- **Email Tracking**: Track when emails are opened using invisible tracking pixels
- **RESTful API**: Clean API endpoints for all operations

## Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Google OAuth 2.0
- **Email API**: Gmail API v1
- **Frontend**: Static HTML/CSS/JavaScript (served from public folder)
- **Environment**: dotenv for configuration management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Google Cloud Console project with Gmail API enabled
- OAuth 2.0 credentials from Google

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gmail-client/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see .env section below)

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000` by default.

## Environment Variables (.env)

Create a `.env` file in the server directory with the following variables:

```env
# Google OAuth Credentials
CLIENT_ID=your_google_client_id_here
CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:5000/auth/google/callback

# Database
MONGODB_URI=mongodb://localhost:27017/gmail-client

# Server Configuration
PORT=5000

# Email Tracking (Optional - for external tracking)
NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:5000/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback handler

### Emails
- `GET /api/emails/:userEmail` - Fetch user's emails
- `POST /api/emails/:userEmail/send` - Send an email
- `GET /api/emails/:userEmail/sent` - Get sent emails with tracking status

### Tracking
- `GET /api/track/:trackingId` - Tracking pixel endpoint (returns 1x1 GIF)
- `POST /api/track/manual/:trackingId` - Manual tracking trigger
- `GET /api/debug/config` - Debug configuration info

## Email Tracking

The application supports email open tracking using invisible 1x1 pixel images embedded in HTML emails.

### Local Development
When running locally, tracking pixels will only work for emails opened in the same network. For external tracking (emails opened by recipients outside your local network), use ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 5000`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok-free.app`)
4. Add to `.env`: `NGROK_URL=https://abc123.ngrok-free.app`
5. Restart the server

### How Tracking Works
- When sending an email with `trackRead: true`, a unique tracking ID is generated
- An invisible `<img>` tag is embedded in the email HTML pointing to `/api/track/:trackingId`
- When the email is opened, the image loads, triggering the tracking endpoint
- Only the first open is tracked (subsequent opens are ignored)

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration and database connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── emailController.js # Email operations
│   │   └── trackingController.js # Tracking logic
│   ├── models/
│   │   ├── user.js           # User model
│   │   └── sentEmail.js      # Sent email tracking model
│   ├── routes/
│   │   ├── auth.js           # Auth routes
│   │   ├── emails.js         # Email routes
│   │   └── tracking.js       # Tracking routes
│   ├── utils/
│   │   └── emailParser.js    # Email content parsing utilities
│   └── server.js             # Main server file
├── public/                   # Static frontend files
├── .env                      # Environment variables (gitignored)
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── LICENSE                  # MIT License
└── README.md               # This file
```

## Development

### Running in Development
```bash
npm run dev  # If you add a dev script with nodemon
# or
npm start
```

### Database
The application uses MongoDB. Make sure MongoDB is running locally or update `MONGODB_URI` for cloud instances.

### Frontend
The frontend is served statically from the `public/` directory. Update files there for UI changes.

## Security Notes

- Never commit `.env` files to version control
- Keep OAuth credentials secure
- The tracking system uses invisible pixels - ensure compliance with privacy laws
- Rate limiting is not implemented - consider adding for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
