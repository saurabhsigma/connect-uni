# E-Commerce Shop Platform - Feature Specification

## Overview
A modern, full-featured e-commerce platform inspired by Amazon Smart Business, built with Next.js 14+, TypeScript, MongoDB, and Tailwind CSS. This platform enables users to create stores, list products, and facilitate secure COD (Cash on Delivery) transactions.

---

## Core Features

### 1. **Store Management System**
- **Store Creation & Customization**
  - Unique store slug generation (SEO-friendly URLs)
  - Custom store logo and banner images
  - Store description and bio
  - Social media integration (Instagram, Website links)
  - Custom product categories per store
  - Contact information (email, phone)

- **Store Dashboard**
  - View store analytics (total sales, ratings, reviews)
  - Manage store settings
  - Product inventory management
  - Order tracking and fulfillment

### 2. **Product Management**
- **Product Listing**
  - Multiple product types: Physical, Digital, Service, Rental
  - Rich product descriptions
  - Multiple image upload support
  - Price and offer price (discounts)
  - Stock management
  - Product tags for better discovery
  - Category assignment
  - Product status tracking (available, in-bid, sold)

- **Product Display Features**
  - High-quality image galleries
  - Discount percentage badges
  - Stock availability indicators
  - Product type badges
  - Quick view modal with full details
  - Responsive product cards
  - Hover effects and animations

### 3. **Advanced Search & Discovery**
- **Search Functionality**
  - Real-time product search
  - Search by title and description
  - Debounced search for performance

- **Filtering System**
  - Category-based filtering
  - Price range filters (min/max)
  - Dynamic filter application
  - Filter toggle interface

- **Sorting Options**
  - Featured products (default)
  - Newest first
  - Price: Low to High
  - Price: High to Low
  - Most Popular (by stock/demand)

### 4. **Shopping Experience**
- **Product Detail Viewer**
  - Full-screen modal with comprehensive product info
  - Image gallery with thumbnails
  - Detailed pricing information (original price, offer price, savings)
  - Stock availability status
  - Product specifications
  - Tags display
  - Category and type information
  - Direct order placement from viewer

- **Wishlist System**
  - Add/remove products from wishlist
  - Visual wishlist indicators (heart icon)
  - Persistent wishlist state
  - Quick access from product cards

- **Smart UI Elements**
  - Discount percentage calculations
  - Visual stock indicators with icons
  - Responsive grid layouts (1-4 columns)
  - Hover animations and transitions
  - Glass-morphism design effects

### 5. **Order Management**
- **COD (Cash on Delivery) System**
  - Secure order placement
  - Complete address collection
    - Full name
    - Phone number
    - Address line 1 & 2
    - City, State, Postal code
  - Order notes/instructions
  - Quantity selection
  - Order status tracking (pending, accepted, shipped, delivered, cancelled)

- **Order Tracking**
  - Buyer order history
  - Seller order dashboard
  - Real-time order status
  - Customer information access for sellers
  - Delivery address management

### 6. **Notification System**
- **Real-time Notifications**
  - Bell icon with unread badge count
  - Order notifications for buyers
  - New order alerts for sellers
  - Dropdown notification panel
  - Auto-refresh every 30 seconds
  - Categorized notifications (purchases vs sales)

- **Order Notifications Page**
  - Tabbed interface (Purchases / Sales)
  - Order status badges with color coding
  - Customer/seller information
  - Delivery details
  - Order timestamps
  - Empty state messages with CTAs

### 7. **User Experience Features**
- **Authorization & Security**
  - Session-based authentication
  - Owner-only product editing
  - Prevent self-ordering (users can't buy their own products)
  - Role-based permissions (admin, seller, buyer)

- **Responsive Design**
  - Mobile-first approach
  - Adaptive layouts for all screen sizes
  - Touch-friendly interfaces
  - Optimized images and loading

- **Visual Feedback**
  - Loading states
  - Success/error messages
  - Hover effects and animations
  - Status color coding
  - Progress indicators

### 8. **Store Discovery**
- **Public Store Views**
  - Branded store pages with custom URLs
  - Store ratings and review counts
  - Product showcase grids
  - Category navigation
  - Store social links
  - Copy store link functionality
  - Back navigation

- **Store Features**
  - Results count display
  - Category chips/pills
  - Store owner information
  - Store statistics

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom glass-morphism effects
- **Icons**: Lucide React
- **Authentication**: NextAuth.js
- **State Management**: React Hooks (useState, useEffect)

### Backend Stack
- **Database**: MongoDB with Mongoose ODM
- **API**: Next.js API Routes (RESTful)
- **Authentication**: NextAuth with JWT
- **File Uploads**: Cloudinary integration
- **Session Management**: NextAuth session handling

### Database Models
1. **Store Model**
   - ownerId (User reference)
   - storeName, storeSlug
   - description, logo, bannerImage
   - categories array
   - contactEmail, contactPhone
   - socialLinks object
   - rating, totalReviews
   - isActive status
   - timestamps

2. **Product Model**
   - sellerId (User reference)
   - storeId (Store reference)
   - title, description
   - price, offerPrice
   - category, productType
   - images array
   - tags array
   - stock quantity
   - status (available, in-bid, sold)
   - bids array (for auction features)
   - timestamps

3. **Order Model**
   - buyerId (User reference)
   - storeId (Store reference)
   - productId (Product reference)
   - productTitle, productPrice (snapshot)
   - quantity
   - paymentMethod (COD)
   - status (pending, accepted, shipped, delivered, cancelled)
   - address object (complete delivery address)
   - note (buyer instructions)
   - buyerNotified, sellerNotified flags
   - timestamps

4. **User Model**
   - name, email, password
   - image, avatar
   - role (admin, seller, buyer)
   - contact information
   - timestamps

---

## API Endpoints

### Store APIs
- `GET /api/stores?userId={id}` - Get user's store
- `POST /api/stores` - Create new store
- `PATCH /api/stores` - Update store
- `GET /api/stores/[slug]` - Get store by slug with products

### Product APIs
- `GET /api/store` - Get all products
- `POST /api/store` - Create product
- `GET /api/store/[id]` - Get product details
- `PUT /api/store/[id]` - Update product
- `DELETE /api/store/[id]` - Delete product

### Order APIs
- `POST /api/orders` - Create new order (COD)
- `GET /api/orders?role=owner` - Get orders (buyer or seller view)

### Notification APIs
- `GET /api/notifications` - Get buyer/seller notifications with unread counts

---

## Key User Flows

### 1. Store Owner Flow
1. Sign up / Login
2. Create store with branding
3. Add custom categories
4. Upload products with images
5. Set prices and manage inventory
6. Receive order notifications
7. View customer orders with delivery details
8. Track order status

### 2. Buyer Flow
1. Browse stores and products
2. Use search and filters
3. View product details (quick view or full modal)
4. Add to wishlist
5. Place COD order with delivery address
6. Receive order confirmation
7. Track order status in notifications
8. View order history

### 3. Product Discovery Flow
1. Land on store page
2. See featured products
3. Filter by category
4. Search products
5. Sort by price/popularity/date
6. Apply price range filters
7. Quick view for details
8. Place order or add to wishlist

---

## UI/UX Design Patterns

### Design System
- **Color Scheme**: Primary, secondary, muted colors with dark/light mode support
- **Typography**: Responsive font sizes, clear hierarchy
- **Spacing**: Consistent padding and margins
- **Borders**: Subtle borders with opacity variations
- **Shadows**: Layered shadows for depth
- **Glass Effect**: Backdrop blur with transparency

### Component Patterns
- **Cards**: Rounded corners, hover effects, border glow
- **Buttons**: Multiple variants (primary, secondary, disabled)
- **Badges**: Color-coded status indicators
- **Modals**: Centered overlays with backdrop blur
- **Forms**: Clean inputs with focus states
- **Grids**: Responsive columns (1-4 based on screen size)

### Animations
- Hover scale transforms
- Fade-in transitions
- Slide-in animations
- Smooth color transitions
- Image zoom on hover
- Opacity changes for interactive elements

---

## Advanced Features Implemented

1. **Smart Discount System**
   - Automatic discount percentage calculation
   - Visual discount badges
   - Savings display

2. **Wishlist Management**
   - Client-side wishlist state
   - Heart icon toggle
   - Visual feedback

3. **Quick View Modal**
   - Click-anywhere card interaction
   - Detailed product information
   - Image gallery
   - Direct order placement

4. **Search & Filter Combination**
   - Multiple filter criteria applied simultaneously
   - Real-time results update
   - Results count display

5. **Seller Protection**
   - Users cannot order their own products
   - Visual indicators for owned products
   - Backend validation

6. **Order Notifications**
   - Auto-refreshing notification dropdown
   - Unread count badges
   - Categorized views (buyer/seller)

---

## Prompt to Recreate This Platform

```
Create a full-stack e-commerce platform with the following specifications:

TECH STACK:
- Next.js 14+ with TypeScript and App Router
- MongoDB with Mongoose ODM
- NextAuth.js for authentication
- Tailwind CSS for styling
- Lucide React for icons
- Cloudinary for image uploads

CORE FEATURES TO IMPLEMENT:

1. STORE MANAGEMENT:
   - Allow users to create branded stores with unique slugs
   - Store customization: logo, banner, description, categories
   - Store dashboard with product and order management
   - Public store pages with custom URLs (/shop/[slug])

2. PRODUCT SYSTEM:
   - Product CRUD operations with multiple images
   - Support for Physical, Digital, Service, and Rental products
   - Price with optional offer price (discounts)
   - Stock management and availability tracking
   - Tags and categories for organization

3. SEARCH & DISCOVERY:
   - Real-time search across product titles and descriptions
   - Advanced filtering: categories, price range
   - Sorting: featured, newest, price (low-high, high-low), popular
   - Results count display

4. SHOPPING EXPERIENCE:
   - Responsive product card grid (1-4 columns)
   - Discount badges showing percentage off
   - Wishlist with heart icon toggle
   - Quick view modal with full product details
   - Click-anywhere card to open product viewer
   - Image galleries with thumbnails

5. ORDER MANAGEMENT (COD):
   - Cash on Delivery payment method
   - Complete address collection form
   - Order status tracking: pending, accepted, shipped, delivered, cancelled
   - Separate buyer and seller order views
   - Order notifications with real-time updates

6. NOTIFICATION SYSTEM:
   - Bell icon with unread count badge
   - Auto-refreshing notifications (30s interval)
   - Dropdown panel with buyer/seller categorization
   - Dedicated orders page with tabbed interface

7. USER EXPERIENCE:
   - Session-based auth with role management
   - Prevent users from ordering their own products
   - Responsive design for all devices
   - Loading states and error handling
   - Glass-morphism UI effects
   - Smooth animations and transitions

8. UI DESIGN:
   - Modern, clean interface inspired by Amazon
   - Dark/light mode support
   - Hover effects and micro-interactions
   - Color-coded status badges
   - Visual stock indicators
   - Search bar with filters toggle

DATABASE MODELS:
- Store: ownerId, storeName, storeSlug, categories, logo, banner, socialLinks, rating
- Product: sellerId, storeId, title, price, offerPrice, images, stock, category, productType, tags
- Order: buyerId, storeId, productId, quantity, address (name, phone, lines, city, state, postal), status, paymentMethod
- User: name, email, password, role, avatar

API ROUTES:
- /api/stores (GET, POST, PATCH) - Store management
- /api/stores/[slug] (GET) - Public store view
- /api/store (GET, POST) - Products list and create
- /api/store/[id] (GET, PUT, DELETE) - Product operations
- /api/orders (GET, POST) - Order management
- /api/notifications (GET) - Buyer/seller notifications

KEY INTERACTIONS:
- Store owner creates store and adds products
- Buyers browse, search, filter, and sort products
- Click product card to view full details in modal
- Add products to wishlist
- Place COD orders with delivery address
- Both parties receive notifications
- Track orders through status updates

DESIGN REQUIREMENTS:
- Glass-morphism cards with backdrop blur
- Gradient backgrounds and borders
- Responsive grid layouts
- Smooth transitions and hover effects
- Color-coded badges and status indicators
- Modal overlays with backdrop
- Clean forms with validation
- Empty states with helpful CTAs

SECURITY:
- Session validation on all protected routes
- Owner-only edit/delete permissions
- Prevent self-ordering with buyer/seller checks
- Input sanitization and validation
- Secure password hashing

Build this as a production-ready platform with clean code, proper error handling, TypeScript types, and optimized performance.
```

---

## Future Enhancement Ideas

1. **Payment Integration**
   - Razorpay / Stripe integration
   - UPI payments
   - Wallet system

2. **Reviews & Ratings**
   - Product reviews
   - Star ratings
   - Review moderation

3. **Analytics Dashboard**
   - Sales analytics
   - Traffic insights
   - Revenue tracking

4. **Advanced Features**
   - Product recommendations
   - Related products
   - Recently viewed
   - Compare products

5. **Marketing Tools**
   - Coupon codes
   - Flash sales
   - Bundle offers
   - Referral system

6. **Communication**
   - Buyer-seller chat
   - Order updates via email/SMS
   - Push notifications

7. **Shipping Integration**
   - Multiple shipping options
   - Tracking numbers
   - Shipping cost calculator

8. **Inventory Management**
   - Low stock alerts
   - Automatic reordering
   - Bulk upload

---

## Performance Optimizations

- Image optimization with Next.js Image component
- Lazy loading for product cards
- Debounced search
- Pagination or infinite scroll
- Server-side rendering for SEO
- Static generation for store pages
- API response caching
- Database query optimization with indexes

---

This specification provides a complete blueprint for building a modern, scalable e-commerce platform suitable for campus communities or small business marketplaces.
