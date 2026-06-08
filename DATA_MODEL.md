# RotaPro Workforce data model

This branch is the proper app foundation, not the earlier local-only prototype.

## Core collections

### businesses/{businessId}
- name
- locations[]
- sections[]
- settings
- createdAt
- updatedAt

### users/{userId}
- businessId
- name
- nickname
- email
- age
- wage
- jobArea
- pronouns
- role: admin | manager | staff
- holidayAllowanceDays
- active
- notificationTokens[]

### shifts/{shiftId}
- businessId
- userId
- section
- location
- date
- start
- end
- notes
- status: draft | published | changed | cancelled
- createdBy
- updatedBy
- publishedAt

### timeEntries/{entryId}
- businessId
- userId
- shiftId
- clockInAt
- clockOutAt
- breaks[]
  - id
  - startAt
  - endAt
  - paid
- approvedBy
- approvedAt
- exceptionFlags[]

### leaveRequests/{requestId}
- businessId
- userId
- startDate
- endDate
- days
- type: paid | unpaid
- status: pending | approved | rejected | cancelled
- note
- submittedAt
- reviewedBy
- reviewedAt

### availability/{availabilityId}
- businessId
- userId
- date
- from
- to
- status: available | unavailable | preferred
- note

### announcements/{announcementId}
- businessId
- title
- body
- createdBy
- createdAt
- targetUserIds[] optional
- targetSections[] optional

### auditLog/{auditId}
- businessId
- actorUserId
- action
- entityType
- entityId
- before
- after
- createdAt

## Security rules intent

Admins/managers can create and edit users, sections, shifts, leave approvals, timesheet approvals, settings, and announcements.

Staff can read their own profile, shifts, time entries, leave requests, availability, and announcements. Staff can create their own leave requests, availability records, and clock entries. Staff cannot approve their own leave or edit wage/role/holiday allowance.

## Notification triggers

Cloud Functions should send notifications when:
- a shift is published for a user
- a published shift is changed
- a shift is cancelled
- a leave request is approved or rejected
- a manager receives a new leave request
- an announcement targets a user or section
