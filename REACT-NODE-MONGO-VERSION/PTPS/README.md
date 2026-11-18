# Nagarpalika Property Tax System

A full-stack web application for managing municipal property taxes. Citizens can register properties, pay taxes, and raise grievances. Officers can verify properties, collect offline payments, and resolve grievances. Admins can manage users, configure tax rates, and view reports.

## Technologies Used

### Frontend
- React.js (with Vite)
- React functional components and Hooks
- React Router for navigation
- Plain CSS (no UI framework)
- Lucide React for icons

### Backend
- Node.js
- Express.js
- Mongoose (MongoDB ODM)
- MongoDB (database name: `property_tax_db`)
- jsonwebtoken for authentication

## Project Structure

```
client/                 # Frontend React app
  src/
    components/         # Reusable components (Layout, Sidebar, Topbar, StatsCard, etc.)
    context/            # AuthContext for logged-in user state
    hooks/              # useAuth and useApi custom hooks
    pages/
      Login.jsx
      Register.jsx
      admin/            # Admin pages (Dashboard, ManageRates, Reports, ManageUsers, AddOfficer)
      citizen/          # Citizen pages (Dashboard, AddProperty, PayTax, Grievances)
      officer/          # Officer pages (Dashboard, VerifyProperties, SearchProperties, OfflinePayment, OfficerGrievances)
    App.jsx             # Main app with routes
    main.jsx            # Entry point
    styles.css          # All CSS styles

server/                 # Backend Express app
  models/               # Mongoose models (User, Ward, Property, Tax, Payment, Grievance, Rate)
  routes/               # API routes (auth, admin, citizen, officer)
  middleware/           # Auth middleware (JWT verification, role checking)
  utils/                # Tax calculation utility
  seed/                 # Seed data script
  server.js             # Express server entry point
```

## How to Install and Run

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally on default port 27017)

### Step 1: Install MongoDB
Make sure MongoDB is installed and running on your system.
- On Windows: Start MongoDB service from Services
- On Mac: `brew services start mongodb-community`
- On Linux: `sudo systemctl start mongod`

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Seed the Database
This creates test data (admin, officer, citizens, wards, properties, tax rates).
```bash
npm run seed
```

### Step 4: Start the Backend Server
```bash
npm start
```
The server runs on `http://localhost:5000`

### Step 5: Install Frontend Dependencies
Open a new terminal:
```bash
cd client
npm install
```

### Step 6: Start the Frontend
```bash
npm run dev
```
The frontend runs on `http://localhost:5173`

### Step 7: Open the App
Go to `http://localhost:5173` in your browser.

## Sample Login Accounts

| Role    | Email                        | Password     |
|---------|-----------------------------|--------------|
| Admin   | admin@nagarpalika.gov        | admin123     |
| Officer | officer1@nagarpalika.gov     | officer123   |
| Officer | officer2@nagarpalika.gov     | officer123   |
| Officer | officer3@nagarpalika.gov     | officer123   |
| Citizen | aarav@example.com           | citizen123   |
| Citizen | meera@example.com           | citizen123   |
| Citizen | karan@example.com           | citizen123   |
| Citizen | sneha@example.com           | citizen123   |
| Citizen | aditya@example.com          | citizen123   |
| Citizen | divya@example.com           | citizen123   |

You can also register a new citizen account from the Register page.

## Database

- **Database name:** `property_tax_db`
- **Collections (Mongoose models):**
  1. `users` - name, email, password, role, phone, status, createdAt
  2. `wards` - wardNumber, zone, officerId, createdAt
  3. `properties` - ownerId, tenementNumber, address, wardId, area, propertyType, constructionYear, status, createdAt
  4. `taxes` - propertyId, assessmentYear, baseTax, rebate, penalty, totalDue, status, dueDate, createdAt
  5. `payments` - taxId, amount, mode, receiptNumber, collectedBy, paidDate
  6. `grievances` - citizenId, propertyId, subject, description, status, resolution, officerId, createdAt
  7. `rates` - baseRate, residentialFactor, commercialFactor, industrialFactor, rebatePercent, penaltyPercent, penaltyCap

## Main Features

### Admin
- Dashboard with statistics (total citizens, properties, collected, outstanding, grievances, payments)
- Manage tax rates (base rate, factors, rebate, penalty)
- Payment reports with filters (mode, sort, limit) and CSV download
- Manage users (activate/deactivate, filter by role)
- Add officer accounts and assign to wards

### Citizen
- Dashboard with personal statistics
- Register a new property
- Pay property tax online (simulated)
- View tax details (base tax, rebate, penalty, total due)
- Submit and track grievances

### Officer
- Dashboard with ward statistics
- Verify or reject pending properties
- Search properties by tenement number or owner name
- Record offline payments and generate receipts
- Update grievance status and resolution

## Where CRUD Operations Are Used

| Operation | Example |
|-----------|---------|
| **Create** | `User.create()`, `Property.create()`, `Tax.create()`, `Payment.create()`, `Grievance.create()` |
| **Read** | `User.find()`, `User.findOne()`, `Property.find().populate()`, `Payment.aggregate()` |
| **Update** | `User.findByIdAndUpdate()`, `Property.save()` (status change), `Tax.save()` (mark paid), `Grievance.save()` |
| **Delete** | `User.deleteMany()`, `Property.deleteMany()` (in seed script to clear old data) |

## Where Aggregation Is Used

- **Admin Dashboard:** `Payment.aggregate()` with `$group` and `$sum` to calculate total collected amount
- **Admin Dashboard:** `Payment.aggregate()` with `$lookup` to join payments with taxes, properties, and users for recent payments
- **Admin Reports:** `Payment.aggregate()` with `$match`, `$lookup`, `$project`, `$sort`, `$limit` for filtered reports
- **Admin Reports:** `Payment.aggregate()` with `$group`, `$sum`, `$count` for grand total calculation
- **Citizen Dashboard:** `Tax.aggregate()` with `$lookup`, `$match`, `$group` for total due calculation
- **Officer Dashboard:** `Payment.aggregate()` with `$match` and `$group` for offline payment count
- **Officer Offline Payment:** `Tax.aggregate()` with `$lookup` to join unpaid taxes with properties, users, and wards

## MongoDB Query Operators Used

- `$or` - Search properties by tenement number OR address
- `$in` - Count grievances with status in ["open", "in_progress"]
- `$gt`, `$lt`, `$ne` - Used in tax calculations and comparisons
- `select()` - Projection to exclude password field
- `sort()` - Sort results by date, amount, etc.
- `limit()` - Limit search results to 20 records

## Where React Hooks Are Used

| Hook | Where |
|------|-------|
| `useState` | Form inputs, loading states, data in every page |
| `useEffect` | Fetching API data on page load in all pages |
| `useContext` | AuthContext for logged-in user info |
| `useRef` | Focusing the search input on SearchProperties page |
| `useReducer` | Grievance form state in citizen/Grievances.jsx |
| `useMemo` | Calculating total tax due in citizen/PayTax.jsx |
| `useCallback` | Reusable fetch functions in dashboard pages |
| Custom `useApi` | Custom hook for API calls in hooks/useApi.js |
| Custom `useAuth` | Custom hook to access AuthContext |

## Other React Concepts

- **Class component:** `HelpPanel.jsx` - a simple class component showing the tax calculation explanation
- **React.memo:** `StatsCard.jsx` and `StatusBadge.jsx` - wrapped in memo for performance
- **Conditional rendering:** Loading states, empty states, error states, role-based views
- **Lists with map():** Rendering wards, properties, payments, users, grievances, navigation links
- **Controlled forms:** All forms use controlled inputs with value and onChange
- **Props:** Passed to StatsCard, Panel, StatusBadge, FormInput, FormSelect, Table, EmptyState
- **React events:** onClick, onChange, onSubmit, onKeyDown

## How Tax Calculation Works

The tax calculation is in `server/utils/taxCalculator.js`:

### Usage Factor (based on property type)
- Residential = residential factor (default 1.0)
- Commercial = commercial factor (default 1.7)
- Industrial = industrial factor (default 2.2)
- Unknown = 1

### Age Factor (based on construction year)
- 0-10 years old = 1.0
- 11-20 years old = 0.95
- More than 20 years old = 0.9

### Base Tax Formula
```
Base Tax = Area x Base Rate x Usage Factor x Age Factor
```

### Final Amount
- If paid on or before due date: `Final = Base Tax - Rebate`
- If paid after due date: `Final = Base Tax + Penalty`
- Rebate = Base Tax x (Rebate Percent / 100)
- Penalty = Base Tax x (Penalty Percent / 100) x Months Late
- Penalty is capped at the Penalty Cap value

## Security Features

- Passwords are never returned in API responses (removed by model toJSON)
- JWT tokens for authentication
- Role-based access control on every backend route
- Citizens can only access their own records
- Officers can only access records in their assigned ward
- Admin routes restricted to admins only
- Backend validation for all important operations
- No `dangerouslySetInnerHTML` used anywhere
- Safe Mongoose queries (no raw SQL injection possible)
