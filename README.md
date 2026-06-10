# WanderLust

A full-stack accommodation booking platform inspired by Airbnb. Users can browse property listings from around the world, create their own listings with photos, leave reviews, save favorites, and explore stays on an interactive 3D globe. The app also includes a role-based admin portal with an audit log.

**Live demo:** https://wanderlust-qpr6.onrender.com/

## Features

**Listings**
- Full CRUD for property listings (create, view, edit, delete)
- Image uploads stored on Cloudinary
- 11 categories (Beach, City, Mountains, Cabins, Pools, Lakefront, Islands, Desert, Rooms, Skiing, Countryside) with a category filter bar
- Automatic geocoding of each listing's location into map coordinates
- Price, max guests, location, and country fields

<img width="1919" height="1114" alt="Screenshot 2026-06-10 191539" src="https://github.com/user-attachments/assets/09a2e403-9299-4d30-909e-bbace72620cf" />

**Maps**
- Interactive Mapbox globe that plots every listing with a price marker
- Per-listing location map on the detail page

<img width="1919" height="1111" alt="Screenshot 2026-06-10 191605" src="https://github.com/user-attachments/assets/68055524-68fe-4591-b775-89c103feea9a" />

**Reviews and ratings**
- Authenticated users can post reviews with a 1 to 5 star rating and a comment
- Average rating and review count tracked per listing
- Reviews are removed automatically when their parent listing is deleted

**Users and authentication**
- Sign up, log in, and log out using Passport.js (local strategy)
- Sessions persisted in MongoDB so logins survive server restarts
- Role-based access with separate `user` and `admin` roles
- Wishlist so users can save listings they like
- "Redirect back" support that returns users to the page they were on before logging in

**Admin**
- Dedicated admin login portal
- Admin audit log that records listing and review actions with actor, timestamp, target, and IP address

<img width="1919" height="1115" alt="Screenshot 2026-06-10 191756" src="https://github.com/user-attachments/assets/6a66c682-87d9-40bc-af5f-8a55c9a18399" />

<img width="1919" height="1111" alt="Screenshot 2026-06-10 191831" src="https://github.com/user-attachments/assets/09dbc209-b92a-434d-9b04-86e5550b07e2" />

**Currency**
- Switch between USD and BDT, with the preference saved to the session

## Tech stack

**Backend**
- Node.js
- Express 5
- MongoDB Atlas with Mongoose (ODM)
- connect-mongo for the session store

**Frontend / views**
- EJS templating with ejs-mate for layouts
- Custom CSS and vanilla JavaScript
- Bootstrap-style responsive UI

**Authentication and sessions**
- Passport.js with passport-local-mongoose
- express-session
- cookie-parser

**Media and maps**
- Cloudinary for image hosting
- Multer with multer-storage-cloudinary for uploads
- Mapbox GL JS for maps and the globe view
- Mapbox Geocoding SDK for converting addresses to coordinates

**Security**
- Helmet with a custom Content Security Policy
- Custom NoSQL injection sanitizer that strips `$` and `.` operators from input
- HTTP-only, same-site, and HTTPS-only cookies in production
- `trust proxy` configured for secure cookies behind a hosting provider's TLS
- Environment variable validation on startup

**Validation**
- Joi for server-side request validation

**Deployment**
- Render
- Environment-based config via dotenv

## Project structure

```
WanderLust/
├── app.js                  # App entry point, middleware, security, sessions
├── cloudConfig.js          # Cloudinary and Multer setup
├── controllers/            # Route logic (listings, users, reviews, admin)
├── middleware/             # Auth guards, validation, NoSQL sanitizer
├── models/                 # Mongoose schemas (Listing, User, Review, AuditLog)
├── routes/                 # Express routers
├── utils/                  # Geocoder, audit logger, error helpers
├── views/                  # EJS templates (listings, users, admin, pages)
├── public/                 # Static CSS and client-side JS
└── init/                   # Database seeding scripts
```

## Getting started

### Prerequisites
- Node.js 20.x
- A MongoDB Atlas database
- A Cloudinary account
- A Mapbox access token

### Installation

```bash
git clone https://github.com/Tanvir-h-simon/WanderLust.git
cd WanderLust
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
MONGO_ATLAS_URL=
SECRET=
CLOUD_NAME=
API_KEY=
CLOUD_API_SECRET=
MAPBOX_TOKEN=
```

The app checks for all of these on startup and exits with a clear message if any are missing.

### Running locally

```bash
# start the dev server (with auto-reload)
npm run dev

# or start normally
npm start
```

The server runs on `http://localhost:8080` by default.

### Seeding the database (optional)

```bash
npm run seed      # load sample listings
npm run geocode   # add map coordinates to listings
```

## Available scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the server |
| `npm run dev` | Start with nodemon for auto-reload |
| `npm run seed` | Seed the database with sample listings |
| `npm run geocode` | Geocode listings that are missing coordinates |

## Author

Tanvir Hossain
[GitHub](https://github.com/Tanvir-h-simon)
