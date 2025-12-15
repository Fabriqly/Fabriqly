# Policy Management System

## Overview

The Policy Management System allows administrators to create, edit, and manage four types of policies:
- Terms & Conditions
- Privacy Policy
- Shipping Policy
- Refund Policy

All policies are versioned, support draft/published/archived statuses, and are tailored for Philippines jurisdiction.

## Features

- **Version Control**: Maintain complete history of policy changes
- **Status Management**: Draft, Published, and Archived statuses
- **Strict Versioning**: Published policies are immutable (create new drafts to edit)
- **ISR (Incremental Static Regeneration)**: Public pages are statically generated and revalidated
- **HTML Sanitization**: All policy content is sanitized to prevent XSS attacks
- **Admin Interface**: Full CRUD interface for managing policies
- **Public Pages**: SEO-optimized public pages for each policy type

## Database Schema

The `policies` table stores:
- `id`: Unique identifier
- `type`: Policy type (terms, privacy, shipping, refund)
- `title`: Policy title
- `content`: HTML content (LONGTEXT)
- `version`: Version number
- `status`: draft, published, or archived
- `last_updated_by`: Admin user ID
- `created_at`, `updated_at`: Timestamps

## Setup

### 1. Run Database Migration

```bash
mysql -u root -p fabriqly < db/migrations/create_policies_table.sql
```

### 2. Install Dependencies (Optional but Recommended)

For better HTML sanitization:
```bash
npm install isomorphic-dompurify
```

For a better rich text editor experience (future enhancement):
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

### 3. Seed Initial Policies

```bash
node scripts/seed-policies.js
```

This will create initial published versions of all four policies with comprehensive content tailored for Philippines jurisdiction.

## Usage

### Admin Interface

1. Navigate to `/dashboard/admin/policies`
2. View all policies grouped by type
3. Create new policy versions
4. Edit draft policies
5. Publish drafts (automatically archives previous published version)
6. Archive policies

### Public Pages

- `/terms-and-conditions` - Terms & Conditions
- `/privacy-policy` - Privacy Policy
- `/shipping-policy` - Shipping Policy
- `/refund-policy` - Refund Policy

All public pages are:
- Server-rendered with ISR (revalidates every hour)
- SEO-optimized with proper metadata
- Responsive and accessible

## API Endpoints

### Admin Only (Requires admin role)

- `GET /api/policies` - List all policies
- `GET /api/policies/[id]` - Get specific policy
- `POST /api/policies` - Create new policy
- `PUT /api/policies/[id]` - Update policy (drafts only)
- `POST /api/policies/[id]/publish` - Publish draft
- `POST /api/policies/[id]/archive` - Archive policy
- `POST /api/policies/revalidate` - Trigger ISR revalidation

## Legal Compliance

All policies are designed to comply with:
- **Consumer Act of the Philippines (RA 7394)**
- **Data Privacy Act of 2012 (RA 10173)**

Governing law is explicitly stated as the Republic of the Philippines.

## Architecture

- **Repository Pattern**: `PolicyRepository` handles database operations
- **Service Layer**: `PolicyService` handles business logic and caching
- **Direct Service Calls**: Public pages call services directly (no API calls)
- **ISR**: Pages use Next.js Incremental Static Regeneration
- **Caching**: Active policies are cached in-memory for performance

## Future Enhancements

1. **Tiptap Editor**: Replace basic HTML editor with Tiptap for better UX
2. **Version Comparison**: Show diff between policy versions
3. **Scheduled Publishing**: Schedule policy updates
4. **Multi-language Support**: Support for multiple languages
5. **Policy Acceptance Tracking**: Track which users accepted which policy versions

