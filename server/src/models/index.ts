import mongoose, { Schema } from 'mongoose';

const mediaImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const mealPlanTariffSchema = new Schema(
  {
    code: { type: String, enum: ['EP', 'CP', 'MAP', 'AP'], required: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    roomRate: { type: Number, required: true, min: 0 },
    extraPersonRate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const roomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    mealPlans: [mealPlanTariffSchema],
    maxGuests: { type: Number, required: true, min: 1 },
    totalUnits: { type: Number, required: true, min: 1 },
    bedType: { type: String, trim: true },
    roomSize: { type: String, trim: true },
    viewType: { type: String, trim: true },
    amenities: [{ type: String, trim: true }],
    images: [mediaImageSchema],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const bookingSchema = new Schema(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    guestName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomName: { type: String, required: true, trim: true },
    roomsRequested: { type: Number, required: true, min: 1, default: 1 },
    mealPlan: { type: String, enum: ['EP', 'CP', 'MAP', 'AP'], default: 'EP' },
    extraPersons: { type: Number, default: 0, min: 0 },
    estimatedPrice: { type: Number, required: true, min: 0 },
    specialRequests: { type: String, trim: true },
    arrivalTime: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    cancellationRequested: { type: Boolean, default: false },
    cancellationReason: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    source: { type: String, enum: ['website', 'admin', 'whatsapp'], default: 'website' },
  },
  { timestamps: true }
);
bookingSchema.index({ roomId: 1, status: 1, checkIn: 1, checkOut: 1 });

const blockedDateSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomName: { type: String, trim: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    unitsBlocked: { type: Number, required: true, min: 1, default: 1 },
    reason: { type: String, trim: true },
  },
  { timestamps: true }
);

const gallerySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    cloudinaryPublicId: { type: String, trim: true },
    category: {
      type: String,
      enum: ['Resort', 'Rooms', 'Views', 'Dining', 'Experiences'],
      default: 'Resort',
    },
    alt: { type: String, required: true, trim: true },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const experienceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    duration: { type: String, trim: true },
    bestTime: { type: String, trim: true },
    distance: { type: String, trim: true },
    images: [mediaImageSchema],
    category: {
      type: String,
      enum: ['Nature Walk', 'Sightseeing', 'Culture', 'Wellness'],
      default: 'Nature Walk',
    },
    location: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const diningSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Evening Tea', 'Dinner', 'Local Specialty'],
      default: 'Local Specialty',
    },
    description: { type: String, required: true, trim: true },
    timing: { type: String, trim: true },
    dietaryNote: { type: String, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    guestName: { type: String, required: true, trim: true },
    guestLocation: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    sourceLabel: { type: String, trim: true },
    stayDate: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Unread', 'Read', 'Replied', 'Archived'],
      default: 'Unread',
      index: true,
    },
  },
  { timestamps: true }
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Booking', 'Stay & Rooms', 'Travel & Location', 'Dining & Facilities'],
      default: 'Booking',
    },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const siteSettingsSchema = new Schema(
  {
    resortName: { type: String, required: true },
    tagline: { type: String, required: true },
    logoText: { type: String, required: true },
    logoUrl: { type: String },
    phone: { type: String, required: true },
    secondaryPhones: [{ type: String }],
    hosts: { type: String },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    googleMapsEmbedUrl: { type: String, required: true },
    googleMapsLink: { type: String, required: true },
    instagramUrl: { type: String },
    facebookUrl: { type: String },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    defaultBookingPolicy: { type: String, required: true },
    seoTitle: { type: String, required: true },
    seoDescription: { type: String, required: true },
    emailNotificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const pageContentSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    body: { type: String, required: true },
    sections: { type: Schema.Types.Mixed },
    seoTitle: { type: String },
    seoDescription: { type: String },
  },
  { timestamps: true }
);

const adminNotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['booking', 'cancellation', 'message', 'system'], default: 'booking' },
    referenceId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const CustomerModel =
  mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export const RoomModel = mongoose.models.Room || mongoose.model('Room', roomSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const BlockedDateModel =
  mongoose.models.BlockedDate || mongoose.model('BlockedDate', blockedDateSchema);
export const GalleryModel = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
export const ExperienceModel =
  mongoose.models.Experience || mongoose.model('Experience', experienceSchema);
export const DiningModel = mongoose.models.Dining || mongoose.model('Dining', diningSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export const ContactMessageModel =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
export const FAQModel = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);
export const SiteSettingsModel =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
export const PageContentModel =
  mongoose.models.PageContent || mongoose.model('PageContent', pageContentSchema);
export const AdminNotificationModel =
  mongoose.models.AdminNotification || mongoose.model('AdminNotification', adminNotificationSchema);
