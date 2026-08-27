# StockMaster Enterprise Inventory Management System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Module Descriptions](#module-descriptions)
4. [Design System & UI](#design-system--ui)
5. [User Workflows](#user-workflows)
6. [Technical Implementation](#technical-implementation)
7. [Navigation Guide](#navigation-guide)
8. [Extensibility & Customization](#extensibility--customization)

---

## System Overview

**StockMaster** is a professional enterprise-grade inventory management system with multiple role-based portals and comprehensive business workflow support.

### Key Features
- **Multi-role Support**: Super Admin, Admin, Manager, Staff, and Client roles
- **Complete Inventory Lifecycle**: From purchasing to sales tracking
- **Real-time Stock Tracking**: Automatic inventory updates with purchasing/sales
- **Supplier & Customer Management**: Complete relationship management
- **Financial Tracking**: Invoicing, payments, and revenue reports
- **Activity Logging**: Complete audit trail of all transactions
- **Dark/Light Mode**: Full theme switching support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Business Workflow
```
Suppliers → Purchase Orders → Inventory In-Stock → Sales → Customers → Revenue
    ↓           ↓                    ↓              ↓          ↓
  Manage    Receive Stock      Track Levels    Process    Relationships
  Contacts   & Update QTY    & Movements     Invoices     & Payments
```

---

## Project Structure

```
inventory_management_system/
│
├── dashboard_themed_alerts/          # Main Dashboard
│   └── code.html                     # Dashboard with KPIs & alerts
│
├── user_management/                  # User Administration
│   ├── users_list.html               # List all users
│   └── add_user.html                 # Add/Edit users with permissions
│
├── products_management/              # Product Catalog
│   └── code.html                     # (Existing - Products table)
│
├── suppliers_management/             # Supplier Management
│   └── suppliers_list.html           # Manage suppliers & relationships
│
├── purchasing_management/            # Purchase Orders & Stock Receiving
│   ├── purchasing.html               # View all purchases
│   └── add_purchase.html             # Create new purchase order
│
├── sales_management/                 # Sales & Revenue
│   ├── sales.html                    # View all sales/invoices
│   └── new_sale.html                 # POS interface for new sales
│
├── customers_management/             # Customer Database
│   └── customers.html                # Manage customer accounts
│
├── inventory_management/             # Inventory Tracking
│   └── inventory_history.html        # Track all stock movements
│
├── activity_log_timeline_filters/    # (Existing - Activity logs)
└── DOCUMENTATION.md                  # This file
```

---

## Module Descriptions

### 1. **Dashboard** (`dashboard_themed_alerts/code.html`)
**Purpose**: Executive overview of system health and key metrics
**Key Sections**:
- KPI Cards: Total products, categories, low stock alerts, daily movements
- Monthly Stock Movement Chart: Visual trend analysis
- Category Distribution: Pie chart of inventory by category
- Recent Low Stock Table: Critical inventory items requiring action
- Activity Timeline: Real-time log of system events

**Users**: All roles
**Key Metrics**:
- Total inventory value
- Stock health status
- Demand trends
- Alert count

---

### 2. **User Management** (`user_management/`)

#### **users_list.html** - User Directory
**Purpose**: Centralized user account management
**Columns**:
- User profile with avatar
- Email and contact info
- Assigned role (Super Admin, Admin, Manager, Staff)
- Active/Disabled status
- Last login timestamp
- Account creation date
- Action buttons: View, Edit, Delete

**Stats Cards**:
- Total Users
- Active Users
- Super Admins
- Disabled Users

**Permissions Required**: Super Admin, Admin

#### **add_user.html** - User Creation Form
**Sections**:
1. **Profile Image**: Avatar upload
2. **Basic Information**: Name, email, phone, username
3. **Password Management**: 
   - Password strength indicator
   - Confirmation field
   - Requirements: 8+ chars, upper, lower, numbers, special
4. **Role & Permissions**: 
   - Radio button role selection
   - Checkbox-based permission assignment
5. **Status**: Enable/disable account immediately
6. **Form Actions**: Cancel or Create User

**Fields are validated** with visual feedback.

---

### 3. **Suppliers Management** (`suppliers_management/suppliers_list.html`)
**Purpose**: Manage supply chain relationships
**Columns**:
- Supplier company name and location
- Primary contact person
- Email and phone
- Product count from supplier
- Total purchase value
- Status (Active/Inactive)
- Actions: View details, Edit

**Stats Cards**:
- Total Suppliers
- Active Suppliers
- Total Purchase Value
- Pending Orders

**Use Cases**:
- Add new supplier contacts
- Track purchase history per supplier
- Manage payment terms
- Monitor supplier performance

---

### 4. **Purchasing Module** (`purchasing_management/`)

#### **purchasing.html** - Purchase Overview
**Purpose**: Track all purchase orders and stock receipts
**Tabs**: Purchases | Purchase History | Suppliers

**Columns**:
- Purchase Order ID (e.g., PO-2024-001)
- Supplier name
- Purchase date
- Number of items ordered
- Total order amount
- Delivery status: Received, In Transit, Pending
- Actions: View details, Print

**Stats Cards**:
- Total Purchases YTD ($547.2K example)
- Pending Orders (12 in example)
- Received This Month (34 orders)
- Average Delivery Time (5.2 days)

#### **add_purchase.html** - Create Purchase Order
**Purpose**: Record new stock purchases from suppliers
**WARNING**: Purchasing **INCREASES inventory stock**

**Sections**:
1. **Purchase Information**:
   - Supplier selection dropdown
   - Purchase date picker
   - Reference number (supplier invoice)
   - Payment status: Pending, Partial, Paid
   - Notes field for special instructions

2. **Products Table**:
   - Product selection dropdown
   - SKU display (read-only)
   - Current stock level (read-only)
   - Quantity to purchase (editable)
   - Unit price per product
   - Total line amount (auto-calculated)
   - Remove item button

3. **Purchase Summary**:
   - Subtotal
   - Discount input field
   - Tax calculation (10%)
   - Grand total

4. **Confirmation Modal**:
   - Review total amount before final submission
   - Option to confirm or cancel

**Business Logic**:
- When purchase is complete, product quantities in inventory are **INCREASED**
- Creates audit trail with user and timestamp
- Links purchase to supplier for relationship tracking

---

### 5. **Sales Module** (`sales_management/`)

#### **sales.html** - Sales Dashboard
**Purpose**: Track revenue and customer invoices
**Tabs**: Sales | Sales History | Customers

**Columns**:
- Invoice number (e.g., INV-001234)
- Customer name
- Sale date
- Number of items sold
- Invoice total amount
- Payment status: Paid, Partial, Pending
- Fulfillment status: Completed, Pending, Cancelled
- Actions: View details, Print invoice

**Stats Cards**:
- Total Sales YTD ($892.3K example)
- Total Invoices (427 this year)
- Pending Payment ($45.7K)
- Average Invoice Value ($2,089)

#### **new_sale.html** - Point of Sale (POS) Interface
**Purpose**: Process customer sales in real-time
**WARNING**: Sales **DECREASE inventory stock**

**Layout**: 2-column responsive design

**LEFT COLUMN - Product Selection (2/3 width)**:
1. **Header**: "Point of Sale" title with warning
2. **Search Bar**: Find products by name or SKU
3. **Product Grid**:
   - Product card with image/icon
   - Name and SKU
   - Unit price (highlighted)
   - Current stock level
   - Click to add to cart
   - Stock availability indicator (green/red)

**RIGHT COLUMN - Shopping Cart (1/3 width)**:
1. **Cart Header**: Item count badge
2. **Line Items**:
   - Product name with remove button (X)
   - Price × Quantity
   - Line total
   - Quantity controls (−/+ buttons)
   - Quantity input field
3. **Order Totals**:
   - Subtotal
   - Tax calculation (10%)
   - **GRAND TOTAL** (prominent)
4. **Payment Section**:
   - Customer selection dropdown (Walk-in or saved customers)
   - Payment method buttons: Cash | Card
   - **Complete Sale** button (green, prominent)
   - Save Draft option
5. **Inventory Impact**:
   - When "Complete Sale" clicked, stock levels are **DECREASED**
   - Creates invoice for customer
   - Updates sales statistics

---

### 6. **Customers Management** (`customers_management/customers.html`)
**Purpose**: Manage customer relationships and payment tracking
**Columns**:
- Customer company name
- Contact name and location
- Email address
- Phone number
- Total purchase value
- Customer status: Active, Inactive, VIP
- Actions: View profile, Edit details

**Stats Cards**:
- Total Customers (156 example)
- Active Customers (142 / 91%)
- Total Revenue from Customers ($892.3K YTD)
- Overdue Payments ($12.4K from 5 customers)

**Use Cases**:
- Track repeat customers
- Monitor payment history
- Identify high-value customers
- Manage credit limits
- Process refunds/returns

---

### 7. **Inventory History** (`inventory_management/inventory_history.html`)
**Purpose**: Complete audit trail of all stock movements
**Filters**:
- Date range (From/To)
- Transaction type: All, Stock In, Stock Out, Adjustment, Return
- Product filter
- User filter

**Columns**:
- Transaction date & time
- Product name and SKU
- Transaction type (color-coded):
  - **Stock In** (Green): Purchases - qty +N
  - **Stock Out** (Orange): Sales - qty -N
  - **Adjustment** (Blue): Inventory count adjustments
  - **Return** (Purple): Customer returns
- Quantity change (+ or -)
- Previous stock level
- New stock level after transaction
- Reference number (PO/Invoice/Adjustment ID)
- User who performed transaction

**Features**:
- Export to CSV
- Print filtered report
- Filter by date range for compliance
- Complete inventory reconciliation trail

---

## Design System & UI

### Color Palette (Material Design 3)
```
Primary:               #004ac6 (Blue)
Primary Container:     #2563eb
On Primary:            #ffffff

Secondary:             #545f73 (Gray)
Secondary Container:   #d5e0f8
On Secondary:          #ffffff

Tertiary:              #943700 (Orange)
Tertiary Container:    #bc4800

Error/Alert:           #ba1a1a (Red)
Error Container:       #ffdad6

Success:               #10b981 (Green)
Warning:               #f59e0b (Orange)

Surfaces:
  - Background:        #faf8ff
  - Surface:           #faf8ff
  - Surface Container  #ededf9 (lowest to highest)
  - On Surface:        #191b23
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Display Large**: 32px, 700 weight, -0.02em letter spacing
- **Headline Medium**: 24px, 600 weight, -0.01em letter spacing
- **Headline Small**: 20px, 600 weight
- **Body Large**: 16px, 400 weight
- **Body Medium**: 14px, 400 weight
- **Label Medium**: 12px, 600 weight, 0.05em letter spacing

### Component Library

#### Buttons
```html
<!-- Primary Action -->
<button class="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container transition-all active:scale-95">
    <span class="material-symbols-outlined">add</span> Action
</button>

<!-- Secondary -->
<button class="px-4 py-2 border border-outline-variant rounded-lg font-label-md hover:bg-surface-container-low">
    Cancel
</button>

<!-- Danger/Destructive -->
<button class="px-4 py-2 bg-error text-on-error rounded-lg font-label-md hover:opacity-90">
    Delete
</button>
```

#### Cards
```html
<div class="bg-surface-container-lowest dark:bg-inverse-surface p-lg rounded-xl shadow-sm border border-outline-variant dark:border-outline">
    <p class="font-label-md text-secondary-fixed-dim uppercase">Card Title</p>
    <h3 class="font-display-lg text-on-surface">Large Number</h3>
    <p class="text-[12px] text-primary font-semibold mt-2">Trend indicator</p>
</div>
```

#### Form Inputs
```html
<input type="text" placeholder="Enter value" class="w-full px-4 py-2 bg-surface-container-low dark:bg-surface-variant border border-outline-variant dark:border-outline rounded-lg text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary"/>

<select class="w-full px-4 py-2 bg-surface-container-low dark:bg-surface-variant border border-outline-variant dark:border-outline rounded-lg text-body-md">
    <option>Select option</option>
</select>
```

#### Status Badges
```html
<!-- Active -->
<span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-label-sm font-semibold">Active</span>

<!-- Warning -->
<span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-label-sm">In Transit</span>

<!-- Error -->
<span class="px-3 py-1 bg-error-container text-on-error-container rounded-full text-label-sm">Critical</span>
```

### Layout Patterns

#### Sidebar Navigation
- Fixed 280px width
- Collapsible on mobile (hidden by default)
- Active indicator with primary color
- Logout button at bottom
- Custom scrollbar styling

#### Header/Top Navigation
- Fixed height (64px)
- Search bar (max 384px)
- Theme toggle
- Notifications with badge
- User profile section
- Action buttons (Add, etc.)

#### Main Content
- Padding: 32px (xl)
- Left margin: 280px (for sidebar)
- Top margin: 64px (for header)
- Grid layouts: responsive (cols-1 sm:cols-2 lg:cols-4, etc.)
- Gap between elements: 24px (gutter)

### Responsive Breakpoints
- **sm**: 640px (small tablet)
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)

Most components stack on mobile, show 2-columns on tablet, 4+ on desktop.

---

## User Workflows

### Workflow 1: Receiving New Stock

**SEQUENCE**: Supplier → Purchase Order → Stock Received → Inventory Increased

1. Go to **Purchasing** → **New Purchase**
2. Select supplier from dropdown
3. Choose product and enter quantity to purchase
4. Enter unit price per item
5. Add discount if applicable
6. Review totals
7. Click "Complete Purchase"
8. **Confirmation**: Inventory stock levels are automatically **INCREASED**
9. Purchase appears in "Recent Purchases" table with "Received" status
10. Transaction logged in **Inventory History** with type "Stock In"

**Key Points**:
- Purchasing INCREASES inventory
- Creates audit trail with user and timestamp
- Links to supplier for tracking
- Payment status can be updated later

### Workflow 2: Processing a Sale

**SEQUENCE**: Customer → POS Sale → Stock Decreased → Invoice Created

1. Go to **Sales** → **New Sale**
2. Products appear as clickable cards in left column
3. Click product to add to cart (right column)
4. Adjust quantity using +/− buttons
5. Cart auto-calculates line items, tax, and total
6. Select customer from dropdown (or Walk-in)
7. Choose payment method: Cash or Card
8. Click **"Complete Sale"**
9. **Confirmation Modal**: Review amount and confirm
10. After confirmation:
    - Inventory stock is **DECREASED** by quantities sold
    - Invoice is created for customer
    - Sales total updated in dashboard
    - Transaction logged in **Inventory History** with type "Stock Out"

**Key Points**:
- Sales DECREASE inventory
- Real-time calculation of totals and tax
- Works as full POS system
- Can save draft for later completion
- Payment tracking (Paid, Partial, Pending)

### Workflow 3: User Access Management

**SEQUENCE**: Create User → Assign Role → Set Permissions

1. Go to **User Management** → **Add User**
2. Fill in profile image
3. Enter basic info: Name, Email, Phone, Username
4. Set strong password (8+ chars, upper, lower, numbers, symbols)
5. Select role:
   - **Super Admin**: Full access, can create other admins
   - **Admin**: Manage operations with assigned permissions
   - **Manager**: Manage specific departments
   - **Staff**: Limited to assigned modules only
6. Check/uncheck specific permissions (Users, Products, Sales, Purchasing, etc.)
7. Set status: Active (user can login immediately) or Disabled
8. Click "Create User"
9. User can log in with provided credentials
10. User role determines:
    - Which modules appear in sidebar
    - Which actions they can perform
    - Which data they can view/edit

**Permission Matrix**:
| Module | Super Admin | Admin | Manager | Staff |
|--------|:-----------:|:-----:|:-------:|:-----:|
| Users Management | ✓ | ✓ | ✗ | ✗ |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Products | ✓ | ✓ | ✓ | ✓ |
| Suppliers | ✓ | ✓ | ✓ | ✗ |
| Customers | ✓ | ✓ | ✓ | ✓ |
| Purchasing | ✓ | ✓ | ✓ | ✗ |
| Sales | ✓ | ✓ | ✓ | ✓ |
| Inventory History | ✓ | ✓ | ✓ | ✓ |

### Workflow 4: Tracking Inventory Levels

**SEQUENCE**: Dashboard Alerts → Investigate → Order Stock → Receive

1. Dashboard shows "Low Stock" KPI and alerts
2. Click on low stock product or go to **Inventory History**
3. Filter by date range and product
4. See all transactions for that product:
   - Previous stock level
   - Changes (+ for purchases, − for sales)
   - New stock level
   - Who performed transaction
5. If stock is too low:
   - Go to **Suppliers** → Select supplier of that product
   - Go to **Purchasing** → **New Purchase**
   - Order more units to bring stock to safe level
6. Once received, stock is automatically increased
7. Continue monitoring in **Inventory History**

---

## Technical Implementation

### Framework & Libraries
- **Styling**: Tailwind CSS (v3)
- **Components**: Custom HTML/CSS
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Typography**: Inter (Google Fonts)
- **Scripting**: Vanilla JavaScript (no frameworks)
- **Theming**: CSS Custom Properties + Tailwind dark mode

### File Organization
Each module folder contains:
- `module_name.html` - Main page template
- `add_*.html` - Form/creation pages (where applicable)
- Shared Tailwind config (embedded in each HTML)
- Inline CSS for custom effects (scrollbars, themes, animations)
- Vanilla JavaScript for interactivity

### Key Features Implementation

#### Theme Switching (Dark/Light Mode)
```javascript
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const themeIcon = document.getElementById('themeIcon');

const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    html.classList.add('dark');
    themeIcon.textContent = 'dark_mode';
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    themeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
```

#### Responsive Tables
- Desktop: Full horizontal scroll with all columns
- Tablet: Stacked cards or condensed columns
- Mobile: Card-based layout with swipe actions

#### Form Validation
- Password strength indicator
- Email format validation
- Required field indicators
- Visual feedback on focus/blur

#### Modal Dialogs
- Used for confirmations before critical actions
- Overlay dark background
- Center-positioned content
- Blur backdrop effect

### No External Dependencies
This system uses **ZERO external JavaScript frameworks** intentionally:
- Faster load times
- Smaller bundle size
- Easier to customize
- Better browser compatibility
- No npm dependencies to manage

---

## Navigation Guide

### Main Navigation Paths

**From Dashboard**:
- Users: Users → Users List → Add User
- Products: Dashboard → Products Management
- Suppliers: Dashboard → Suppliers
- Purchasing: Dashboard → Purchasing → New Purchase
- Sales: Dashboard → Sales → New Sale (POS)
- Customers: Dashboard → Customers
- Inventory: Dashboard → Inventory History
- Reports: (Placeholder) Dashboard → Reports

**Quick Actions** (from header on any page):
- "Add Product" button
- "New Purchase" button
- "New Sale" button
- "Add Customer" button
- Search bar (searchable across all modules)

### Breadcrumb Navigation
Each page shows breadcrumb trail:
```
Purchasing / New Purchase  [with back link]
```
Users can click breadcrumb to go back.

### Sidebar Navigation
- **Primary Navigation**: Dashboard, Users, Products, Categories, Suppliers, Customers, Inventory, Purchasing, Sales, Reports
- **Settings**: Profile, Settings, Activity Logs
- **Action**: Logout button at bottom

The active page is highlighted with primary color background.

---

## Extensibility & Customization

### Adding a New Module

1. **Create folder** under `inventory_management_system/new_module/`

2. **Create base template** (`new_module.html`):
   ```html
   <!DOCTYPE html>
   <html class="light" lang="en">
   <head>
       <!-- Copy header section from existing module -->
       <!-- Tailwind config, fonts, icons -->
   </head>
   <body>
       <!-- Copy sidebar -->
       <!-- Copy header -->
       <!-- Your custom content -->
       <main class="pt-[64px] ml-[280px] min-h-screen p-xl">
           <!-- Your module content -->
       </main>
   </body>
   </html>
   ```

3. **Update navigation**:
   - Add link in sidebar nav
   - Update all other sidebars to link to new module

4. **Follow design patterns**:
   - Use existing color palette
   - Maintain typography hierarchy
   - Use Material Symbols for icons
   - Responsive grid layouts
   - Consistent card/button styling

### Customizing Colors

Edit Tailwind config in `<script id="tailwind-config">`:
```javascript
"colors": {
    "primary": "#004ac6",        // Change main brand color
    "secondary": "#545f73",      // Change secondary color
    // ... update all colors
}
```

All files share same config, so changes propagate system-wide.

### Adding New Forms

```html
<form class="space-y-lg">
    <div class="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl shadow-sm border border-outline-variant p-lg">
        <h3 class="font-headline-sm mb-lg">Section Title</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
                <label class="block font-label-md text-on-surface mb-2">Field Label *</label>
                <input type="text" class="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/20"/>
            </div>
        </div>
    </div>
</form>
```

### Adding Charts/Graphs

The system currently uses custom CSS for simple charts (bar, pie, timeline). For advanced charts:

**Option 1**: Use Chart.js (lightweight)
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
```

**Option 2**: Use Recharts (React-based, requires React)

**Option 3**: Keep custom CSS charts (current approach)

### Database Integration

Currently, all data is mocked in HTML (static examples). To connect to real database:

1. **Backend API** needed (Node.js, Python, PHP, etc.)
2. **API Endpoints** for CRUD operations:
   - `GET /api/users` - Fetch all users
   - `POST /api/users` - Create user
   - `PUT /api/users/{id}` - Update user
   - `DELETE /api/users/{id}` - Delete user
   - Similar for other modules

3. **JavaScript Fetch** to replace static data:
   ```javascript
   async function loadUsers() {
       const response = await fetch('/api/users');
       const users = await response.json();
       renderUsersTable(users);  // Populate table
   }
   ```

4. **Form Submission**:
   ```javascript
   document.getElementById('userForm').addEventListener('submit', async (e) => {
       e.preventDefault();
       const formData = new FormData(e.target);
       const response = await fetch('/api/users', {
           method: 'POST',
           body: JSON.stringify(Object.fromEntries(formData))
       });
       // Handle response
   });
   ```

---

## Support & Future Enhancements

### Planned Features
- [ ] Reports Dashboard (PDF export, charts)
- [ ] Client Portal (self-service order history)
- [ ] Email notifications for low stock
- [ ] Barcode scanning for POS
- [ ] Multi-currency support
- [ ] Advanced analytics & forecasting
- [ ] Mobile app (React Native or Flutter)
- [ ] Real-time WebSocket updates
- [ ] API documentation
- [ ] Admin audit logs
- [ ] Backup & disaster recovery

### Common Customizations
- **Logo/Branding**: Replace "StockMaster" with your company name in sidebars & headers
- **Company Name**: Update in profile section and reports
- **Tax Rate**: Change from 10% to your rate in sales/purchasing calculations
- **Currency**: Add currency symbol to all monetary values
- **Language**: Internationalization (i18n) for multiple languages

### Performance Optimization
- Current: No external dependencies
- Next: Implement service worker for offline mode
- Next: Lazy load large data tables
- Next: Compress images and optimize assets
- Next: Implement caching strategies

---

## Quick Reference

### Color Usage Quick Guide
- **Blue** (#004ac6): Primary actions, active states, links
- **Green** (#10b981): Success, active status, stock in
- **Orange** (#f59e0b): Warnings, in transit, stock out
- **Red** (#ba1a1a): Errors, critical alerts, delete actions
- **Gray** (#545f73): Secondary text, disabled states

### Icon Quick Reference
- `dashboard` - Dashboard/Home
- `group` - Users
- `inventory_2` - Products/Stock
- `category` - Categories
- `domain` - Suppliers/Companies
- `person` - Customers
- `inventory` - Inventory/Stock tracking
- `shopping_cart` - Purchasing
- `sell` - Sales/Revenue
- `assessment` - Reports
- `history` - Activity logs
- `settings` - Settings
- `logout` - Logout
- `visibility` - View/Show
- `edit` - Edit
- `delete` - Delete
- `add` - Add/Create
- `check_circle` - Completed/Success
- `error_outline` - Error/Alert
- `info` - Information

### File Naming Convention
- **List pages**: `module_name_list.html` or `module_name.html`
- **Add/Create pages**: `add_module_name.html`
- **Edit pages**: `edit_module_name.html`
- **View/Detail pages**: `view_module_name.html` or `module_detail.html`

---

## Change Log

### v1.0 - Initial Release
- ✅ Dashboard with KPIs
- ✅ User Management (create, list, permissions)
- ✅ Supplier Management
- ✅ Purchase Order module (stock in)
- ✅ Sales/POS module (stock out)
- ✅ Customer Management
- ✅ Inventory History tracking
- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ Complete audit trail
- ✅ Material Design 3 colors

---

**Created**: October 2024  
**System Version**: 1.0  
**License**: Enterprise  
**Support**: Documentation & inline comments
