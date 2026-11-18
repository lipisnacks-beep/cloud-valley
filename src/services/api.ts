import type {
  AdminNotification,
  AdminUser,
  ApiResponse,
  AvailabilityResult,
  BlockedDate,
  Booking,
  BookingStatus,
  ContactMessage,
  CustomerUser,
  DashboardAnalytics,
  DiningItem,
  Experience,
  FAQ,
  GalleryItem,
  MealPlanCode,
  MessageStatus,
  PageContent,
  Review,
  Room,
  SiteSettings,
} from '../../shared/types/index.ts';

export class ApiError extends Error {
  status: number;
  errors?: { field?: string; message: string }[];

  constructor(message: string, status: number, errors?: { field?: string; message: string }[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let memoryAdminToken: string | null = null;
let memoryCustomerToken: string | null = null;
const ADMIN_SESSION_KEY = 'cv_admin_session';
const CUSTOMER_SESSION_KEY = 'cv_customer_session';

function getStoredToken(key: string, memoryVal: string | null): string | null {
  if (memoryVal) return memoryVal;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setAdminSessionToken(token: string | null): void {
  memoryAdminToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // ignore storage errors in restricted sandboxes
  }
}

function setCustomerSessionToken(token: string | null): void {
  memoryCustomerToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(CUSTOMER_SESSION_KEY, token);
    } else {
      window.sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  } catch {
    // ignore storage errors in restricted sandboxes
  }
}

function resolveAuthScope(path: string, method = 'GET'): 'admin' | 'customer' | 'public' {
  if (path.startsWith('/admin') || path.startsWith('/auth')) {
    return 'admin';
  }
  if (path.startsWith('/customer') || (path === '/bookings' && method.toUpperCase() === 'POST')) {
    return 'customer';
  }
  return 'public';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const scope = resolveAuthScope(path, options.method);
  const sessionToken =
    scope === 'admin'
      ? getStoredToken(ADMIN_SESSION_KEY, memoryAdminToken)
      : scope === 'customer'
        ? getStoredToken(CUSTOMER_SESSION_KEY, memoryCustomerToken)
        : null;

  if (sessionToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401) {
    if (scope === 'admin' && path !== '/auth/login') {
      setAdminSessionToken(null);
    } else if (
      scope === 'customer' &&
      path !== '/customer/auth/login' &&
      path !== '/customer/auth/register'
    ) {
      setCustomerSessionToken(null);
    }
  }

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unexpected response from server.',
  }))) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message || `Request failed (${response.status})`,
      response.status,
      payload.errors
    );
  }

  return payload;
}

export const api = {
  // Public
  getSettings: () => request<SiteSettings>('/settings').then((r) => r.data!),
  getHomeContent: () => request<PageContent>('/content/home').then((r) => r.data!),
  getPageContent: (slug: string) =>
    request<PageContent>(`/content/pages/${encodeURIComponent(slug)}`).then((r) => r.data!),
  getRooms: () => request<Room[]>('/rooms').then((r) => r.data || []),
  getRoomBySlug: (slug: string) =>
    request<Room>(`/rooms/${encodeURIComponent(slug)}`).then((r) => r.data!),
  checkAvailability: (checkIn: string, checkOut: string, roomId?: string) => {
    const qs = new URLSearchParams({ checkIn, checkOut });
    if (roomId) qs.set('roomId', roomId);
    return request<AvailabilityResult[]>(`/availability?${qs.toString()}`).then((r) => r.data || []);
  },
  createBooking: (payload: {
    guestName: string;
    phone: string;
    email: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    roomId: string;
    roomsRequested: number;
    mealPlan?: MealPlanCode;
    extraPersons?: number;
    specialRequests?: string;
    arrivalTime?: string;
  }) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  lookupBooking: (reference: string) =>
    request<Partial<Booking>>(`/bookings/${encodeURIComponent(reference)}`).then((r) => r.data!),
  requestCancellation: (reference: string, email: string, reason: string) =>
    request<{ bookingReference: string; status: BookingStatus; cancellationRequested: boolean }>(
      `/bookings/${encodeURIComponent(reference)}/cancellation-request`,
      {
        method: 'POST',
        body: JSON.stringify({ email, reason }),
      }
    ),
  getGallery: () => request<GalleryItem[]>('/gallery').then((r) => r.data || []),
  getExperiences: () => request<Experience[]>('/experiences').then((r) => r.data || []),
  getDining: () => request<DiningItem[]>('/dining').then((r) => r.data || []),
  getReviews: () => request<Review[]>('/reviews').then((r) => r.data || []),
  getFAQs: () => request<FAQ[]>('/faqs').then((r) => r.data || []),
  submitContact: (payload: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) =>
    request<{ _id: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Customer Auth & Account
  customerRegister: async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const res = await request<{ customer: CustomerUser; token?: string }>('/customer/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data?.token) {
      setCustomerSessionToken(res.data.token);
    }
    return res.data!.customer;
  },
  customerLogin: async (email: string, password: string) => {
    const res = await request<{ customer: CustomerUser; token?: string }>('/customer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      setCustomerSessionToken(res.data.token);
    }
    return res.data!.customer;
  },
  customerLogout: async () => {
    setCustomerSessionToken(null);
    return request('/customer/auth/logout', { method: 'POST' });
  },
  getCustomerMe: () => request<CustomerUser>('/customer/auth/me').then((r) => r.data!),
  updateCustomerProfile: (payload: {
    name: string;
    phone: string;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    request<CustomerUser>('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  getCustomerBookings: () => request<Booking[]>('/customer/bookings').then((r) => r.data || []),
  requestCustomerCancellation: (reference: string, reason: string) =>
    request<Booking>(`/customer/bookings/${encodeURIComponent(reference)}/cancellation-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then((r) => r.data!),

  // Admin Auth
  login: async (email: string, password: string) => {
    const res = await request<{ admin: AdminUser; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      setAdminSessionToken(res.data.token);
    }
    return res.data!.admin;
  },
  logout: async () => {
    setAdminSessionToken(null);
    return request('/auth/logout', { method: 'POST' });
  },
  getMe: () => request<AdminUser>('/auth/me').then((r) => r.data!),
  updateProfile: (payload: {
    name: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    request<AdminUser>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),

  // Admin
  getAnalytics: (range = 'year') =>
    request<DashboardAnalytics>(`/admin/analytics?range=${encodeURIComponent(range)}`).then(
      (r) => r.data!
    ),
  getNotifications: () =>
    request<AdminNotification[]>('/admin/notifications').then((r) => r.data || []),
  markNotificationsRead: () => request('/admin/notifications/read', { method: 'POST' }),
  uploadImage: (file: File, folder = 'cloud-valley') => {
    const form = new FormData();
    form.append('image', file);
    form.append('folder', folder);
    return request<{ url: string; publicId?: string }>('/admin/upload', {
      method: 'POST',
      body: form,
    }).then((r) => r.data!);
  },

  // Admin Bookings
  getAdminBookings: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<Booking[]>(`/admin/bookings?${qs.toString()}`);
  },
  getAdminBookingById: (id: string) =>
    request<Booking>(`/admin/bookings/${encodeURIComponent(id)}`).then((r) => r.data!),
  updateBooking: (id: string, payload: Partial<Booking>) =>
    request<Booking>(`/admin/bookings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  updateBookingStatus: (id: string, status: BookingStatus, internalNotes?: string) =>
    request<Booking>(`/admin/bookings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, internalNotes }),
    }).then((r) => r.data!),
  deleteBooking: (id: string) =>
    request(`/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Rooms
  getAdminRooms: () => request<Room[]>('/admin/rooms').then((r) => r.data || []),
  createRoom: (payload: Partial<Room>) =>
    request<Room>('/admin/rooms', { method: 'POST', body: JSON.stringify(payload) }).then(
      (r) => r.data!
    ),
  updateRoom: (id: string, payload: Partial<Room>) =>
    request<Room>(`/admin/rooms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  toggleRoomStatus: (id: string, isActive: boolean) =>
    request<Room>(`/admin/rooms/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }).then((r) => r.data!),
  deleteRoom: (id: string) =>
    request(`/admin/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Availability
  getAdminAvailability: () =>
    request<{ rooms: Room[]; bookings: Booking[]; blockedDates: BlockedDate[] }>(
      '/admin/availability'
    ).then((r) => r.data!),
  blockDates: (payload: {
    roomId: string;
    startDate: string;
    endDate: string;
    unitsBlocked: number;
    reason: string;
  }) =>
    request<BlockedDate>('/admin/availability/block', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  unblockDates: (id: string) =>
    request(`/admin/availability/block/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Gallery
  getAdminGallery: () => request<GalleryItem[]>('/admin/gallery').then((r) => r.data || []),
  createGalleryItem: (payload: Partial<GalleryItem>) =>
    request<GalleryItem>('/admin/gallery', { method: 'POST', body: JSON.stringify(payload) }).then(
      (r) => r.data!
    ),
  updateGalleryItem: (id: string, payload: Partial<GalleryItem>) =>
    request<GalleryItem>(`/admin/gallery/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  deleteGalleryItem: (id: string) =>
    request(`/admin/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Experiences
  getAdminExperiences: () =>
    request<Experience[]>('/admin/experiences').then((r) => r.data || []),
  createExperience: (payload: Partial<Experience>) =>
    request<Experience>('/admin/experiences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  updateExperience: (id: string, payload: Partial<Experience>) =>
    request<Experience>(`/admin/experiences/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  deleteExperience: (id: string) =>
    request(`/admin/experiences/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Dining
  getAdminDining: () => request<DiningItem[]>('/admin/dining').then((r) => r.data || []),
  createDiningItem: (payload: Partial<DiningItem>) =>
    request<DiningItem>('/admin/dining', { method: 'POST', body: JSON.stringify(payload) }).then(
      (r) => r.data!
    ),
  updateDiningItem: (id: string, payload: Partial<DiningItem>) =>
    request<DiningItem>(`/admin/dining/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  deleteDiningItem: (id: string) =>
    request(`/admin/dining/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Reviews
  getAdminReviews: () => request<Review[]>('/admin/reviews').then((r) => r.data || []),
  createReview: (payload: Partial<Review>) =>
    request<Review>('/admin/reviews', { method: 'POST', body: JSON.stringify(payload) }).then(
      (r) => r.data!
    ),
  updateReview: (id: string, payload: Partial<Review>) =>
    request<Review>(`/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  deleteReview: (id: string) =>
    request(`/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin Messages
  getAdminMessages: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    return request<ContactMessage[]>(`/admin/messages?${qs.toString()}`).then((r) => r.data || []);
  },
  updateMessageStatus: (id: string, status: MessageStatus) =>
    request<ContactMessage>(`/admin/messages/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((r) => r.data!),
  deleteMessage: (id: string) =>
    request(`/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin FAQs
  getAdminFAQs: () => request<FAQ[]>('/admin/faqs').then((r) => r.data || []),
  createFAQ: (payload: Partial<FAQ>) =>
    request<FAQ>('/admin/faqs', { method: 'POST', body: JSON.stringify(payload) }).then(
      (r) => r.data!
    ),
  updateFAQ: (id: string, payload: Partial<FAQ>) =>
    request<FAQ>(`/admin/faqs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  deleteFAQ: (id: string) =>
    request(`/admin/faqs/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Admin CMS & Settings
  getAdminContent: () => request<PageContent[]>('/admin/content').then((r) => r.data || []),
  updateContent: (payload: Partial<PageContent> & { slug: string }) =>
    request<PageContent>('/admin/content', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
  updateSettings: (payload: SiteSettings) =>
    request<SiteSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((r) => r.data!),
};
