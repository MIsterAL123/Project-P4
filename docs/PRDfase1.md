# 📋 Product Requirements Document (PRD)
# Website P4 Jakarta - Fase 1

---

## 📊 Document Information

| Item | Detail |
|------|--------|
| **Project Name** | Website P4 Jakarta |
| **Version** | 1.0 - Fase 1 |
| **Date** | Januari 2026 |
| **Status** | Planning |
| **Owner** | Tim Development P4 |

---

## 🎯 Executive Summary

Website P4 (Pusat Pelatihan dan Pengembangan Pendidikan) Jakarta adalah platform digital untuk mengelola pendaftaran, approval, dan manajemen peserta pelatihan dengan sistem role-based access control (Admin, Guru, Peserta) dan kuota terbatas 50 peserta per periode.

---

## 🎪 Project Scope - Fase 1

### ✅ In Scope
1. **Authentication System**
   - Login/Register untuk Admin, Guru, dan Peserta
   - Approval system untuk Guru
   - JWT-based authentication
   - Password hashing

2. **User Management**
   - Role-based access (Admin, Guru, Peserta)
   - Profile management
   - User status tracking

3. **Kuota Management**
   - Sistem kuota 50 peserta
   - Auto-update status kuota
   - Pendaftaran P4

4. **Dashboard**
   - Dashboard untuk setiap role
   - Basic statistics
   - User information display

5. **Public Pages**
   - Homepage
   - About
   - Programs
   - Contact

### ❌ Out of Scope (Fase Selanjutnya)
- Payment gateway
- Email notification
- Advanced reporting
- Learning Management System (LMS)
- Mobile application
- API untuk third-party

---

## 👥 User Personas

### 1. Admin
**Role**: System Administrator
**Goals**:
- Mengelola akun guru (approve/reject)
- Menambah admin baru
- Monitoring kuota peserta
- Manajemen user

**Pain Points**:
- Manual approval memakan waktu
- Sulit tracking status pendaftaran

### 2. Guru
**Role**: Instruktur/Pengajar
**Goals**:
- Register dan mendapat approval
- Akses dashboard setelah approved
- Melihat daftar peserta

**Pain Points**:
- Proses approval lambat
- Tidak ada notifikasi status

### 3. Peserta
**Role**: Pelajar/Trainee
**Goals**:
- Daftar akun dengan mudah
- Mendaftar program P4
- Tracking status pendaftaran

**Pain Points**:
- Kuota terbatas (50 orang)
- Tidak tahu apakah pendaftaran berhasil

---

## 🔑 Key Features - Fase 1

### 1. Authentication & Authorization

#### 1.1 Registration
**Admin**
- Hanya bisa ditambahkan oleh admin lain
- Form fields:
  - Nama
  - Email
  - Password
- Validasi email unique

**Guru**
- Self-registration dengan approval
- Form fields:
  - Nama
  - Email
  - NIP (unique)
  - Link Dokumen (upload/URL)
  - Password
- Status default: "Pending"
- Butuh approval admin

**Peserta**
- Self-registration tanpa approval
- Form fields:
  - Nama
  - Email
  - NIK (unique)
  - Link Dokumen (upload/URL)
  - Password
- Langsung bisa login

#### 1.2 Login
- Email & password based
- JWT token generation
- Session management
- Remember me (optional)
- Redirect sesuai role:
  - Admin → `/admin/dashboard`
  - Guru (active) → `/guru/dashboard`
  - Guru (pending/reject) → Halaman status
  - Peserta → `/peserta/dashboard`

#### 1.3 Logout
- Clear JWT token
- Clear session
- Redirect ke homepage

### 2. User Management

#### 2.1 Admin Features
- **Manage Guru Approval**
  - View list guru pending
  - Approve guru (status: active)
  - Reject guru (dengan alasan)
  - View guru history (active/rejected)

- **Manage Admin**
  - Add new admin
  - View admin list
  - Track who added whom

- **Manage Peserta**
  - View all peserta
  - View pendaftaran status
  - Manual registration (optional)

- **Manage Kuota**
  - Set max peserta
  - View current quota
  - Open/close registration

#### 2.2 Guru Features (After Approved)
- **Dashboard**
  - Profile information
  - Statistics (jika ada)

- **Profile Management**
  - Edit profile
  - Change password
  - Update dokumen

- **View Students**
  - List peserta terdaftar
  - Basic information

#### 2.3 Peserta Features
- **Dashboard**
  - Profile information
  - Status pendaftaran P4

- **Pendaftaran P4**
  - Form pendaftaran
  - Check quota availability
  - Get nomor urut pendaftaran

- **Profile Management**
  - Edit profile
  - Change password
  - Update dokumen

### 3. Kuota Management System

#### 3.1 Kuota Settings
- Default: 50 peserta per periode
- Admin bisa ubah max quota
- Auto-calculate available slots
- Status: Open / Full / Closed

#### 3.2 Registration Logic
- Check quota before register
- Assign nomor urut (1-50)
- Update quota counter
- Lock when full
- Database trigger untuk auto-update

#### 3.3 Quota Display
- Show available slots
- Show total registered
- Show registration status
- Real-time update

### 4. Dashboard System

#### 4.1 Admin Dashboard
- **Statistics Cards**
  - Total Admin
  - Total Guru (pending/active/reject)
  - Total Peserta
  - Kuota status

- **Recent Activities**
  - Latest registrations
  - Pending approvals
  - Recent logins

- **Quick Actions**
  - Approve pending guru
  - Manage kuota
  - Add admin

#### 4.2 Guru Dashboard
- Profile summary
- Status badge (active)
- Total students (jika ada)
- Recent activities

#### 4.3 Peserta Dashboard
- Profile summary
- Pendaftaran P4 status
- Nomor urut (jika sudah daftar)
- Quota information

### 5. Public Pages

#### 5.1 Homepage
- Hero section
- Features highlight
- CTA untuk register
- Statistics overview

#### 5.2 About Page
- Tentang P4
- Visi & Misi
- Team (optional)

#### 5.3 Programs Page
- List program pelatihan
- Deskripsi program
- Requirements

#### 5.4 Contact Page
- Contact form
- Map/Location
- Social media
- Contact information

---

## 🗄️ Database Schema - Fase 1

### Tables

#### 1. users
```sql
- id (PK)
- nama
- email (unique)
- password (hashed)
- role (enum: admin, guru, peserta)
- created_at
- updated_at
```

#### 2. admin
```sql
- id (PK)
- user_id (FK -> users)
- added_by (FK -> admin.id)
```

#### 3. guru
```sql
- id (PK)
- user_id (FK -> users)
- nip (unique)
- link_dokumen
- status (enum: pending, active, reject)
- verified_by (FK -> admin.id)
- verified_at
- rejection_reason
```

#### 4. peserta
```sql
- id (PK)
- user_id (FK -> users)
- nik (unique)
- link_dokumen
```

#### 5. kuota_p4
```sql
- id (PK)
- tahun_ajaran
- max_peserta (default: 50)
- peserta_terdaftar (default: 0)
- status (enum: open, closed, full)
- created_at
- updated_at
```

#### 6. pendaftaran_p4
```sql
- id (PK)
- peserta_id (FK -> peserta)
- kuota_id (FK -> kuota_p4)
- nomor_urut
- tanggal_daftar
- status (enum: registered, cancelled)
```

#### 7. activity_log (optional)
```sql
- id (PK)
- user_id (FK -> users)
- action
- description
- created_at
```

---

## 🎨 Design & UI/UX

### Design System
- **Framework**: Tailwind CSS
- **Color Palette**:
  - Primary: Blue (#0ea5e9)
  - Secondary: Purple (#d946ef)
  - Success: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Danger: Red (#ef4444)

- **Typography**:
  - Heading: Poppins
  - Body: Inter

- **Components**:
  - Buttons (primary, secondary, outline, etc)
  - Cards
  - Forms
  - Badges
  - Alerts
  - Tables
  - Modals

### Responsive Design
- Mobile first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Accessibility
- WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader friendly
- Color contrast ratio 4.5:1

---

## 🔧 Technical Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Raw SQL / MySQL2

### Frontend
- **Template Engine**: EJS
- **CSS Framework**: Tailwind CSS
- **JavaScript**: Vanilla JS
- **Icons**: Font Awesome

### Security
- **Password**: bcryptjs (10 rounds)
- **Authentication**: JWT
- **Session**: express-session
- **Headers**: Helmet
- **Rate Limiting**: express-rate-limit
- **Validation**: express-validator

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Dev Server**: nodemon
- **Testing**: Jest (basic)

---

## 📊 User Flows

### 1. Guru Registration Flow
```
1. Visit /auth/register-guru
2. Fill form (nama, email, NIP, dokumen, password)
3. Submit form
4. Validation
5. Save to database (status: pending)
6. Redirect to waiting page
7. Admin review
   a. Approve → status: active, email notification (fase 2)
   b. Reject → status: reject, show reason
8. Guru login → dashboard (if approved)
```

### 2. Peserta Registration & P4 Enrollment Flow
```
1. Visit /auth/register-peserta
2. Fill form (nama, email, NIK, dokumen, password)
3. Submit & auto-approved
4. Login
5. Go to dashboard
6. Click "Daftar P4"
7. Check quota available
   a. Available → register, get nomor urut
   b. Full → show error message
8. View status pendaftaran
```

### 3. Admin Approval Flow
```
1. Login as admin
2. View dashboard
3. See pending guru list
4. Click guru name
5. Review details & dokumen
6. Decision:
   a. Approve → confirm → status: active
   b. Reject → input reason → status: reject
7. Guru notified (fase 2)
```

---

## 🔒 Security Requirements

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT token with 7 days expiration
- Secure session storage
- HTTPS only (production)

### Authorization
- Role-based access control
- Middleware untuk check role
- Protected routes
- No privilege escalation

### Input Validation
- Server-side validation
- XSS prevention
- SQL injection prevention
- File upload validation (type, size)

### Data Protection
- Sensitive data encryption
- No password in logs
- GDPR compliance (basic)

---

## 📱 API Endpoints - Fase 1

### Public Routes
```
GET  /                    - Homepage
GET  /about               - About page
GET  /programs            - Programs page
GET  /contact             - Contact page
```

### Auth Routes
```
GET  /auth/login          - Login page
POST /auth/login          - Login process
GET  /auth/register-guru  - Guru registration page
POST /auth/register-guru  - Guru registration process
GET  /auth/register-peserta - Peserta registration page
POST /auth/register-peserta - Peserta registration process
POST /auth/logout         - Logout
```

### Admin Routes (Protected)
```
GET  /admin/dashboard           - Admin dashboard
GET  /admin/approve-guru        - List pending guru
POST /admin/guru/:id/approve    - Approve guru
POST /admin/guru/:id/reject     - Reject guru
GET  /admin/manage-admin        - Admin management
POST /admin/add-admin           - Add new admin
GET  /admin/manage-peserta      - Peserta list
GET  /admin/manage-kuota        - Kuota settings
POST /admin/kuota/update        - Update kuota
```

### Guru Routes (Protected, Active Only)
```
GET  /guru/dashboard      - Guru dashboard
GET  /guru/profile        - Profile page
POST /guru/profile/update - Update profile
GET  /guru/students       - Student list
```

### Peserta Routes (Protected)
```
GET  /peserta/dashboard         - Peserta dashboard
GET  /peserta/profile           - Profile page
POST /peserta/profile/update    - Update profile
GET  /peserta/daftar-p4         - P4 registration form
POST /peserta/daftar-p4         - P4 registration process
GET  /peserta/status-pendaftaran - Registration status
```

---

## ✅ Acceptance Criteria

### 1. Registration
- ✅ Admin hanya bisa ditambah oleh admin lain
- ✅ Guru registration dengan status pending
- ✅ Peserta registration langsung active
- ✅ Email unique validation
- ✅ NIP/NIK unique validation
- ✅ Password minimal 8 karakter
- ✅ File upload validation (max 5MB, type: pdf/doc/jpg)

### 2. Authentication
- ✅ Login dengan email & password
- ✅ JWT token generation
- ✅ Session management
- ✅ Redirect sesuai role
- ✅ Guru pending tidak bisa akses dashboard
- ✅ Logout clear session

### 3. Authorization
- ✅ Admin akses semua admin routes
- ✅ Guru active akses guru routes
- ✅ Peserta akses peserta routes
- ✅ Cross-role access denied (403)
- ✅ Unauthenticated redirect to login

### 4. Approval System
- ✅ Admin bisa approve guru
- ✅ Admin bisa reject guru dengan reason
- ✅ Status update real-time
- ✅ Guru approved bisa login
- ✅ Guru rejected lihat alasan

### 5. Kuota System
- ✅ Max 50 peserta per periode
- ✅ Auto-update jumlah terdaftar
- ✅ Status berubah ke "full" saat mencapai limit
- ✅ Pendaftaran ditolak saat full
- ✅ Nomor urut assignment (1-50)
- ✅ Database trigger untuk consistency

### 6. Dashboard
- ✅ Admin dashboard dengan statistics
- ✅ Guru dashboard dengan profile
- ✅ Peserta dashboard dengan status pendaftaran
- ✅ Real-time data
- ✅ Responsive design

### 7. UI/UX
- ✅ Tailwind CSS implementation
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Consistent design system
- ✅ Loading states
- ✅ Error messages
- ✅ Success notifications
- ✅ Form validation feedback

---

## 🧪 Testing Strategy

### Unit Testing
- Model functions
- Validation logic
- Helper functions

### Integration Testing
- API endpoints
- Database operations
- Authentication flow

### Manual Testing
- User flows
- Cross-browser testing
- Mobile responsiveness
- Security testing

### Test Cases
1. Registration success/fail scenarios
2. Login success/fail scenarios
3. Approval workflow
4. Quota management
5. Role-based access
6. File upload
7. Form validation

---

## 📅 Timeline - Fase 1

### Week 1: Setup & Infrastructure
- ✅ Project setup
- ✅ Database design & creation
- ✅ Basic folder structure
- ✅ Dependencies installation
- ✅ Tailwind CSS setup

### Week 2: Authentication & User Management
- [ ] Authentication system
- [ ] Registration (Admin, Guru, Peserta)
- [ ] Login/Logout
- [ ] Middleware (auth, role)
- [ ] Password hashing

### Week 3: Core Features
- [ ] Admin approval system
- [ ] Kuota management
- [ ] Pendaftaran P4
- [ ] Profile management
- [ ] File upload

### Week 4: Dashboard & UI
- [ ] Admin dashboard
- [ ] Guru dashboard
- [ ] Peserta dashboard
- [ ] Public pages
- [ ] UI components

### Week 5: Testing & Refinement
- [ ] Unit testing
- [ ] Integration testing
- [ ] Bug fixes
- [ ] UI/UX refinement
- [ ] Performance optimization

### Week 6: Deployment & Documentation
- [ ] Production setup
- [ ] Deploy to server
- [ ] Documentation
- [ ] User guide
- [ ] Handover

---

## 🚀 Deployment Plan

### Environment
- **Development**: localhost
- **Staging**: staging.p4.jakarta.go.id (optional)
- **Production**: p4.jakarta.go.id

### Server Requirements
- Node.js v18+
- MySQL 8.0+
- Nginx/Apache
- SSL Certificate
- Min 2GB RAM
- Min 20GB Storage

### Deployment Steps
1. Setup server
2. Install dependencies
3. Configure environment variables
4. Setup database
5. Build assets
6. Configure web server
7. Setup SSL
8. Setup PM2 for process management
9. Configure backup
10. Monitoring setup

---

## 📈 Success Metrics

### Performance
- Page load time < 3 seconds
- API response time < 500ms
- Database query time < 100ms
- 99.9% uptime

### User Metrics
- Registration completion rate > 80%
- Login success rate > 95%
- Dashboard loading time < 2s
- Mobile usability score > 90

### Business Metrics
- Admin approval time < 24 hours
- Registration to approval time < 48 hours
- User satisfaction score > 4/5
- System error rate < 1%

---

## 🔮 Future Enhancements (Fase 2+)

### Fase 2
- Email notifications (approval, registration, etc)
- Advanced reporting & analytics
- Bulk operations
- Export data (PDF, Excel)
- Advanced search & filter
- Document preview

### Fase 3
- Learning Management System (LMS)
- Online learning materials
- Quiz & assessment
- Certificate generation
- Progress tracking
- Forum/Discussion

### Fase 4
- Mobile application (iOS/Android)
- Push notifications
- Offline mode
- QR code attendance
- Real-time chat
- Video conferencing integration

### Fase 5
- Payment gateway integration
- E-commerce for courses
- Subscription model
- Multi-language support
- API for third-party
- Advanced analytics dashboard

---

## 📞 Support & Maintenance

### Support Channels
- Email: support@p4.jakarta.go.id
- Helpdesk (internal)
- Documentation wiki

### Maintenance Schedule
- Daily: Backup database
- Weekly: Security updates
- Monthly: Performance review
- Quarterly: Feature updates

### SLA
- Critical bugs: Fix within 24 hours
- Major bugs: Fix within 72 hours
- Minor bugs: Fix within 1 week
- Feature requests: Review monthly

---

## 📚 Documentation

### Required Documentation
1. Technical documentation
2. API documentation
3. Database schema documentation
4. User manual (Admin)
5. User manual (Guru)
6. User manual (Peserta)
7. Deployment guide
8. Troubleshooting guide

---

## ✅ Definition of Done - Fase 1

Fase 1 dianggap selesai jika:

- ✅ All features implemented and tested
- ✅ All acceptance criteria met
- ✅ UI/UX responsive on all devices
- ✅ Security requirements implemented
- ✅ Performance metrics achieved
- ✅ Documentation completed
- ✅ Successfully deployed to production
- ✅ User acceptance testing passed
- ✅ No critical or major bugs
- ✅ Handover to client completed

---

## 🙏 Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner | - | Define requirements |
| Project Manager | - | Timeline & coordination |
| Backend Developer | - | API & database |
| Frontend Developer | - | UI/UX implementation |
| QA Engineer | - | Testing |
| DevOps | - | Deployment & infrastructure |

---

## 📝 Notes

- Fokus pada MVP (Minimum Viable Product) untuk Fase 1
- Prioritas: Functionality > UI Polish
- Security adalah prioritas utama
- User experience harus smooth dan intuitif
- Code quality dan documentation penting untuk maintainability

---

**Document Version**: 1.0
**Last Updated**: Januari 2026
**Next Review**: Setelah Fase 1 selesai

---

**Approved By**:
- [ ] Product Owner
- [ ] Project Manager
- [ ] Technical Lead

**Status**: 🟡 Planning → 🔵 Development → 🟢 Completed