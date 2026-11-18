import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';
import { isMongoConnected } from '../config/database.ts';
import {
  AdminModel,
  CustomerModel,
  RoomModel,
  BookingModel,
  BlockedDateModel,
  GalleryModel,
  ExperienceModel,
  DiningModel,
  ReviewModel,
  ContactMessageModel,
  FAQModel,
  SiteSettingsModel,
  PageContentModel,
  AdminNotificationModel,
} from '../models/index.ts';
import { createDefaultSeedPayload, LEGACY_IMAGE_UPGRADE_MAP } from './seedData.ts';
import type {
  AdminNotification,
  AdminUser,
  BlockedDate,
  Booking,
  ContactMessage,
  CustomerUser,
  DiningItem,
  Experience,
  FAQ,
  GalleryItem,
  PageContent,
  Review,
  Room,
  SiteSettings,
} from '../../../shared/types/index.ts';

interface LocalDatabase {
  admins: (AdminUser & { passwordHash: string })[];
  customers: (CustomerUser & { passwordHash: string })[];
  rooms: Room[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
  gallery: GalleryItem[];
  experiences: Experience[];
  dining: DiningItem[];
  reviews: Review[];
  contactMessages: ContactMessage[];
  faqs: FAQ[];
  siteSettings: SiteSettings;
  pages: PageContent[];
  notifications: AdminNotification[];
}

const dataDir = path.resolve(process.cwd(), '.data');
const localDbPath = path.join(dataDir, 'cloud_valley.json');

let localCache: LocalDatabase | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function generateId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`;
}

function toPlain<T>(doc: unknown): T {
  if (!doc) return doc as T;
  const obj = typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : (doc as Record<string, unknown>);
  return JSON.parse(JSON.stringify(obj)) as T;
}

async function readLocalDb(): Promise<LocalDatabase> {
  if (localCache) return localCache;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(localDbPath)) {
    const raw = await fs.promises.readFile(localDbPath, 'utf-8');
    localCache = JSON.parse(raw) as LocalDatabase;
    if (!Array.isArray(localCache.customers)) {
      localCache.customers = [];
    }
    return localCache;
  }
  const seed = (await createDefaultSeedPayload()) as unknown as LocalDatabase;
  localCache = seed;
  await fs.promises.writeFile(localDbPath, JSON.stringify(seed, null, 2), 'utf-8');
  return localCache;
}

async function saveLocalDb(data: LocalDatabase): Promise<void> {
  localCache = data;
  writeQueue = writeQueue.then(async () => {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    await fs.promises.writeFile(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
  });
  await writeQueue;
}

function mapHdUrl(url?: string): string {
  if (!url) return '';
  return LEGACY_IMAGE_UPGRADE_MAP[url] || url;
}

export async function ensureSeeded(): Promise<void> {
  if (!isMongoConnected()) {
    const db = await readLocalDb();
    let localModified = false;

    if (db.siteSettings?.email === 'reservations@cloudvalleysamalbong.com') {
      const fresh = await createDefaultSeedPayload();
      const oldToNewRoomId = new Map<string, string>([
        ['room-pine-ridge-suite', 'room-premium'],
        ['room-cloud-veranda-cottage', 'room-deluxe'],
        ['room-samalbong-family-pavilion', 'room-four-bedded'],
      ]);
      const roomNameMap = new Map(fresh.rooms.map((r) => [r._id, r.name]));
      db.rooms = fresh.rooms;
      db.bookings = db.bookings.map((b) => {
        const mappedId = oldToNewRoomId.get(b.roomId) || b.roomId;
        return {
          ...b,
          roomId: mappedId,
          roomName: roomNameMap.get(mappedId) || b.roomName,
        };
      });
      db.gallery = fresh.gallery;
      db.experiences = fresh.experiences;
      db.dining = fresh.dining;
      db.reviews = fresh.reviews;
      db.faqs = fresh.faqs;
      db.siteSettings = fresh.siteSettings;
      db.pages = fresh.pages;
      localModified = true;
      console.info('[Seed] Upgraded local database to Cloud Valley Samalbong brochure data.');
    } else {
      for (const room of db.rooms) {
        if (Array.isArray(room.images)) {
          for (const img of room.images) {
            const nextUrl = mapHdUrl(img.url);
            if (nextUrl !== img.url) {
              img.url = nextUrl;
              localModified = true;
            }
          }
        }
      }
      for (const item of db.gallery) {
        const nextUrl = mapHdUrl(item.imageUrl);
        if (nextUrl !== item.imageUrl) {
          item.imageUrl = nextUrl;
          localModified = true;
        }
      }
      for (const exp of db.experiences) {
        if (Array.isArray(exp.images)) {
          for (const img of exp.images) {
            const nextUrl = mapHdUrl(img.url);
            if (nextUrl !== img.url) {
              img.url = nextUrl;
              localModified = true;
            }
          }
        }
      }
      for (const din of db.dining) {
        const nextUrl = mapHdUrl(din.imageUrl);
        if (nextUrl !== din.imageUrl) {
          din.imageUrl = nextUrl;
          localModified = true;
        }
      }
      const homePage = db.pages.find((p) => p.slug === 'home');
      if (homePage?.sections) {
        for (const key of ['heroImageUrl', 'welcomeImageUrl', 'diningImageUrl'] as const) {
          const cur = homePage.sections[key];
          if (typeof cur === 'string') {
            const nextUrl = mapHdUrl(cur);
            if (nextUrl !== cur) {
              homePage.sections[key] = nextUrl;
              localModified = true;
            }
          }
        }
      }
    }

    if (localModified) {
      await saveLocalDb(db);
      console.info('[Seed] Synced HD resort images in local database.');
    }
    return;
  }

  const targetEmail = env.ADMIN_EMAIL.trim().toLowerCase();
  const existingTargetAdmin = await AdminModel.findOne({ email: targetEmail });
  const adminCount = await AdminModel.countDocuments();

  if (adminCount > 0) {
    if (!existingTargetAdmin && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
      await AdminModel.create({
        name: env.ADMIN_NAME,
        email: targetEmail,
        passwordHash,
        role: 'admin',
        isActive: true,
      });
      console.info(`[Seed] Added configured bootstrap admin (${targetEmail}) to MongoDB Atlas.`);
    }

    const existingSettings = await SiteSettingsModel.findOne();
    if (!existingSettings || existingSettings.email === 'reservations@cloudvalleysamalbong.com') {
      const fresh = await createDefaultSeedPayload();

      // Replace legacy sample rooms while remapping existing bookings cleanly
      const oldRooms = await RoomModel.find({
        slug: { $in: ['pine-ridge-glass-suite', 'cloud-veranda-cottage', 'samalbong-family-pavilion'] },
      });
      const oldRoomIdBySlug = new Map(oldRooms.map((r) => [r.slug, r._id]));

      if (oldRooms.length > 0 || (await RoomModel.countDocuments()) === 0) {
        await RoomModel.deleteMany({
          slug: {
            $in: [
              'pine-ridge-glass-suite',
              'cloud-veranda-cottage',
              'samalbong-family-pavilion',
              'deluxe-room',
              'premium-room',
              'four-bedded-room',
            ],
          },
        });
        const insertedRooms = await RoomModel.insertMany(
          fresh.rooms.map(({ _id: _unused, ...rest }) => rest)
        );
        const newBySlug = new Map(insertedRooms.map((r) => [r.slug, r]));

        const slugRemap: [string, string][] = [
          ['pine-ridge-glass-suite', 'premium-room'],
          ['cloud-veranda-cottage', 'deluxe-room'],
          ['samalbong-family-pavilion', 'four-bedded-room'],
        ];
        for (const [oldSlug, newSlug] of slugRemap) {
          const oldId = oldRoomIdBySlug.get(oldSlug);
          const newRoom = newBySlug.get(newSlug);
          if (oldId && newRoom) {
            await BookingModel.updateMany(
              { roomId: oldId },
              { $set: { roomId: newRoom._id, roomName: newRoom.name } }
            );
          }
        }
      }

      await GalleryModel.deleteMany({ imageUrl: { $regex: '^/src/assets/images/' } });
      if ((await GalleryModel.countDocuments()) === 0) {
        await GalleryModel.insertMany(fresh.gallery.map(({ _id: _unused, ...rest }) => rest));
      }

      await ExperienceModel.deleteMany({
        slug: {
          $in: [
            'sunrise-pine-cardamom-trail',
            'samalbong-organic-tea-walk',
            'deolo-kalimpong-ridge-excursion',
            'fireside-evening-stargazing',
          ],
        },
      });
      for (const exp of fresh.experiences) {
        const { _id: _unused, ...rest } = exp;
        await ExperienceModel.findOneAndUpdate({ slug: rest.slug }, rest, { upsert: true });
      }

      await DiningModel.deleteMany({ 'imageUrl': { $regex: '^/src/assets/images/' } });
      if ((await DiningModel.countDocuments()) === 0) {
        await DiningModel.insertMany(fresh.dining.map(({ _id: _unused, ...rest }) => rest));
      }

      await ReviewModel.deleteMany({});
      await ReviewModel.insertMany(fresh.reviews.map(({ _id: _unused, ...rest }) => rest));

      await FAQModel.deleteMany({});
      await FAQModel.insertMany(fresh.faqs.map(({ _id: _unused, ...rest }) => rest));

      for (const page of fresh.pages) {
        const { _id: _unused, ...rest } = page;
        await PageContentModel.findOneAndUpdate({ slug: rest.slug }, rest, { upsert: true });
      }

      if (existingSettings) {
        await SiteSettingsModel.findByIdAndUpdate(existingSettings._id, fresh.siteSettings);
      } else {
        await SiteSettingsModel.create(fresh.siteSettings);
      }
      console.info('[Seed] Upgraded MongoDB Atlas content to Cloud Valley Samalbong brochure data.');
    } else if (
      existingSettings &&
      Array.isArray(existingSettings.secondaryPhones) &&
      existingSettings.secondaryPhones.includes(existingSettings.phone)
    ) {
      await SiteSettingsModel.findByIdAndUpdate(existingSettings._id, {
        $set: {
          secondaryPhones: existingSettings.secondaryPhones.filter(
            (n: string) => n !== existingSettings.phone
          ),
        },
      });
    }

    // Upgrade any legacy /assets/resort/* image URLs in MongoDB Atlas to the HD images
    let hdUpgradedCount = 0;

    const legacyRooms = await RoomModel.find({ 'images.url': { $regex: '^/assets/resort/' } });
    if (legacyRooms.length > 0) {
      const fresh = await createDefaultSeedPayload();
      const freshRoomImagesBySlug = new Map(fresh.rooms.map((r) => [r.slug, r.images]));
      for (const room of legacyRooms) {
        const mappedImages =
          freshRoomImagesBySlug.get(room.slug) ||
          (room.images || []).map((img: { url: string; alt: string }) => ({
            url: mapHdUrl(img.url),
            alt: img.alt,
          }));
        await RoomModel.updateOne({ _id: room._id }, { $set: { images: mappedImages } });
        hdUpgradedCount++;
      }
    }

    const legacyGallery = await GalleryModel.find({ imageUrl: { $regex: '^/assets/resort/' } });
    for (const item of legacyGallery) {
      const nextUrl = mapHdUrl(item.imageUrl);
      if (nextUrl !== item.imageUrl) {
        await GalleryModel.updateOne({ _id: item._id }, { $set: { imageUrl: nextUrl } });
        hdUpgradedCount++;
      }
    }

    const legacyExperiences = await ExperienceModel.find({ 'images.url': { $regex: '^/assets/resort/' } });
    for (const exp of legacyExperiences) {
      const updatedImages = (exp.images || []).map((img: { url: string; alt: string }) => ({
        url: mapHdUrl(img.url),
        alt: img.alt,
      }));
      await ExperienceModel.updateOne({ _id: exp._id }, { $set: { images: updatedImages } });
      hdUpgradedCount++;
    }

    const legacyDining = await DiningModel.find({ imageUrl: { $regex: '^/assets/resort/' } });
    for (const din of legacyDining) {
      const nextUrl = mapHdUrl(din.imageUrl);
      if (nextUrl !== din.imageUrl) {
        await DiningModel.updateOne({ _id: din._id }, { $set: { imageUrl: nextUrl } });
        hdUpgradedCount++;
      }
    }

    const homePage = await PageContentModel.findOne({ slug: 'home' });
    if (homePage?.sections) {
      const sectionSet: Record<string, string> = {};
      for (const key of ['heroImageUrl', 'welcomeImageUrl', 'diningImageUrl'] as const) {
        const cur = homePage.sections[key];
        if (typeof cur === 'string') {
          const nextUrl = mapHdUrl(cur);
          if (nextUrl !== cur) {
            sectionSet[`sections.${key}`] = nextUrl;
          }
        }
      }
      if (Object.keys(sectionSet).length > 0) {
        await PageContentModel.updateOne({ _id: homePage._id }, { $set: sectionSet });
        hdUpgradedCount++;
      }
    }

    if (hdUpgradedCount > 0) {
      console.info(`[Seed] Upgraded ${hdUpgradedCount} MongoDB documents from /assets/resort/* to HD images.`);
    }

    // Remove stray keyboard-mash test room or automated verification records if present
    const strayRoom = await RoomModel.findOne({ slug: 'vkhjvkjh' });
    if (strayRoom) {
      const refs = await BookingModel.countDocuments({ roomId: String(strayRoom._id) });
      if (refs === 0) {
        await RoomModel.deleteOne({ _id: strayRoom._id });
      } else {
        await RoomModel.updateOne({ _id: strayRoom._id }, { $set: { isActive: false, isFeatured: false } });
      }
    }
    await BookingModel.deleteMany({ email: /^verify_\d+@example\.com$/ });
    await CustomerModel.deleteMany({ email: /^verify_\d+@example\.com$/ });
    return;
  }

  const seed = await createDefaultSeedPayload();

  if (seed.admins.length > 0) {
    await AdminModel.insertMany(
      seed.admins.map(({ _id: _unused, ...rest }) => rest)
    );
  } else {
    console.warn('[Seed] ADMIN_PASSWORD not set in environment; skipping default admin creation.');
  }

  const insertedRooms = await RoomModel.insertMany(
    seed.rooms.map(({ _id: _unused, ...rest }) => rest)
  );
  const slugToId = new Map<string, string>();
  insertedRooms.forEach((r) => slugToId.set(r.slug, String(r._id)));

  const seedRoomSlugMap: Record<string, string> = {
    'room-deluxe': 'deluxe-room',
    'room-premium': 'premium-room',
    'room-four-bedded': 'four-bedded-room',
  };

  await BookingModel.insertMany(
    seed.bookings.map(({ _id: _unused, roomId, ...rest }) => ({
      ...rest,
      roomId: slugToId.get(seedRoomSlugMap[roomId] || '') || insertedRooms[0]._id,
    }))
  );

  await GalleryModel.insertMany(seed.gallery.map(({ _id: _unused, ...rest }) => rest));
  await ExperienceModel.insertMany(seed.experiences.map(({ _id: _unused, ...rest }) => rest));
  await DiningModel.insertMany(seed.dining.map(({ _id: _unused, ...rest }) => rest));
  await ReviewModel.insertMany(seed.reviews.map(({ _id: _unused, ...rest }) => rest));
  await FAQModel.insertMany(seed.faqs.map(({ _id: _unused, ...rest }) => rest));
  await SiteSettingsModel.create(seed.siteSettings);
  await PageContentModel.insertMany(seed.pages.map(({ _id: _unused, ...rest }) => rest));
  await AdminNotificationModel.insertMany(seed.notifications.map(({ _id: _unused, ...rest }) => rest));
  console.info('[Seed] Initial CLOUD VALLEY Samalbong data seeded to MongoDB Atlas.');
}

// --- Admins ---
export async function findAdminByEmail(email: string) {
  const lower = email.toLowerCase().trim();
  if (isMongoConnected()) {
    const doc = await AdminModel.findOne({ email: lower });
    return doc ? toPlain<AdminUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  return db.admins.find((a) => a.email === lower) || null;
}

export async function findAdminById(id: string) {
  if (isMongoConnected()) {
    const doc = await AdminModel.findById(id);
    return doc ? toPlain<AdminUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  return db.admins.find((a) => a._id === id) || null;
}

export async function updateAdmin(
  id: string,
  patch: Partial<AdminUser & { passwordHash: string }>
) {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await AdminModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<AdminUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.admins.findIndex((a) => a._id === id);
  if (idx === -1) return null;
  db.admins[idx] = { ...db.admins[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.admins[idx];
}

// --- Customers ---
export async function findCustomerByEmail(email: string) {
  const lower = email.toLowerCase().trim();
  if (isMongoConnected()) {
    const doc = await CustomerModel.findOne({ email: lower });
    return doc ? toPlain<CustomerUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  return db.customers.find((c) => c.email === lower) || null;
}

export async function findCustomerById(id: string) {
  if (isMongoConnected()) {
    const doc = await CustomerModel.findById(id).catch(() => null);
    return doc ? toPlain<CustomerUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  return db.customers.find((c) => c._id === id) || null;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}): Promise<CustomerUser & { passwordHash: string }> {
  const now = new Date().toISOString();
  const normalizedEmail = input.email.toLowerCase().trim();
  if (isMongoConnected()) {
    const doc = await CustomerModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      phone: input.phone.trim(),
      passwordHash: input.passwordHash,
      role: 'customer',
      isActive: true,
      lastLoginAt: now,
    });
    return toPlain<CustomerUser & { passwordHash: string }>(doc);
  }
  const db = await readLocalDb();
  const created: CustomerUser & { passwordHash: string } = {
    _id: generateId('cust'),
    name: input.name.trim(),
    email: normalizedEmail,
    phone: input.phone.trim(),
    passwordHash: input.passwordHash,
    role: 'customer',
    isActive: true,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };
  db.customers.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateCustomer(
  id: string,
  patch: Partial<CustomerUser & { passwordHash: string }>
) {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await CustomerModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<CustomerUser & { passwordHash: string }>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.customers.findIndex((c) => c._id === id);
  if (idx === -1) return null;
  db.customers[idx] = { ...db.customers[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.customers[idx];
}

export async function listCustomerBookings(customerId: string, email: string): Promise<Booking[]> {
  const lowerEmail = email.toLowerCase().trim();
  if (isMongoConnected()) {
    const docs = await BookingModel.find({
      $or: [{ customerId }, { email: lowerEmail }],
    }).sort({ createdAt: -1 });
    return docs.map((d) => toPlain<Booking>(d));
  }
  const db = await readLocalDb();
  return db.bookings
    .filter((b) => b.customerId === customerId || b.email.toLowerCase() === lowerEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Rooms ---
export async function listRooms(activeOnly = false): Promise<Room[]> {
  if (isMongoConnected()) {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await RoomModel.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    return docs.map((d) => toPlain<Room>(d));
  }
  const db = await readLocalDb();
  return db.rooms
    .filter((r) => (activeOnly ? r.isActive : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getRoomBySlug(slug: string): Promise<Room | null> {
  if (isMongoConnected()) {
    const doc = await RoomModel.findOne({ slug: slug.toLowerCase() });
    return doc ? toPlain<Room>(doc) : null;
  }
  const db = await readLocalDb();
  return db.rooms.find((r) => r.slug === slug.toLowerCase()) || null;
}

export async function getRoomById(id: string): Promise<Room | null> {
  if (isMongoConnected()) {
    const doc = await RoomModel.findById(id).catch(() => null);
    return doc ? toPlain<Room>(doc) : null;
  }
  const db = await readLocalDb();
  return db.rooms.find((r) => r._id === id) || null;
}

export async function createRoom(input: Omit<Room, '_id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await RoomModel.create(input);
    return toPlain<Room>(doc);
  }
  const db = await readLocalDb();
  if (db.rooms.some((r) => r.slug === input.slug)) {
    throw new Error('A room with this slug already exists.');
  }
  const created: Room = { ...input, _id: generateId('room'), createdAt: now, updatedAt: now };
  db.rooms.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await RoomModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<Room>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.rooms.findIndex((r) => r._id === id);
  if (idx === -1) return null;
  db.rooms[idx] = { ...db.rooms[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.rooms[idx];
}

export async function deleteRoom(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await RoomModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.rooms.length;
  db.rooms = db.rooms.filter((r) => r._id !== id);
  await saveLocalDb(db);
  return db.rooms.length < prev;
}

// --- Bookings ---
export async function listBookings(): Promise<Booking[]> {
  if (isMongoConnected()) {
    const docs = await BookingModel.find().sort({ createdAt: -1 });
    return docs.map((d) => toPlain<Booking>(d));
  }
  const db = await readLocalDb();
  return [...db.bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (isMongoConnected()) {
    const doc = await BookingModel.findById(id).catch(() => null);
    return doc ? toPlain<Booking>(doc) : null;
  }
  const db = await readLocalDb();
  return db.bookings.find((b) => b._id === id) || null;
}

export async function getBookingByReference(reference: string): Promise<Booking | null> {
  const normalized = reference.trim().toUpperCase();
  if (isMongoConnected()) {
    const doc = await BookingModel.findOne({ bookingReference: normalized });
    return doc ? toPlain<Booking>(doc) : null;
  }
  const db = await readLocalDb();
  return db.bookings.find((b) => b.bookingReference.toUpperCase() === normalized) || null;
}

export async function createBooking(
  input: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Booking> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await BookingModel.create(input);
    return toPlain<Booking>(doc);
  }
  const db = await readLocalDb();
  const created: Booking = { ...input, _id: generateId('bkg'), createdAt: now, updatedAt: now };
  db.bookings.unshift(created);
  await saveLocalDb(db);
  return created;
}

export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await BookingModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<Booking>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.bookings.findIndex((b) => b._id === id);
  if (idx === -1) return null;
  db.bookings[idx] = { ...db.bookings[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.bookings[idx];
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await BookingModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b._id !== id);
  await saveLocalDb(db);
  return db.bookings.length < prev;
}

// --- Blocked Dates ---
export async function listBlockedDates(): Promise<BlockedDate[]> {
  if (isMongoConnected()) {
    const docs = await BlockedDateModel.find().sort({ startDate: 1 });
    return docs.map((d) => toPlain<BlockedDate>(d));
  }
  const db = await readLocalDb();
  return [...db.blockedDates].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export async function createBlockedDate(
  input: Omit<BlockedDate, '_id' | 'createdAt' | 'updatedAt'>
): Promise<BlockedDate> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await BlockedDateModel.create(input);
    return toPlain<BlockedDate>(doc);
  }
  const db = await readLocalDb();
  const created: BlockedDate = { ...input, _id: generateId('blk'), createdAt: now, updatedAt: now };
  db.blockedDates.push(created);
  await saveLocalDb(db);
  return created;
}

export async function deleteBlockedDate(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await BlockedDateModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.blockedDates.length;
  db.blockedDates = db.blockedDates.filter((d) => d._id !== id);
  await saveLocalDb(db);
  return db.blockedDates.length < prev;
}

// --- Gallery ---
export async function listGallery(publishedOnly = false): Promise<GalleryItem[]> {
  if (isMongoConnected()) {
    const docs = await GalleryModel.find(publishedOnly ? { isPublished: true } : {}).sort({
      sortOrder: 1,
      createdAt: -1,
    });
    return docs.map((d) => toPlain<GalleryItem>(d));
  }
  const db = await readLocalDb();
  return db.gallery
    .filter((g) => (publishedOnly ? g.isPublished : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getGalleryById(id: string): Promise<GalleryItem | null> {
  if (isMongoConnected()) {
    const doc = await GalleryModel.findById(id).catch(() => null);
    return doc ? toPlain<GalleryItem>(doc) : null;
  }
  const db = await readLocalDb();
  return db.gallery.find((g) => g._id === id) || null;
}

export async function createGalleryItem(
  input: Omit<GalleryItem, '_id' | 'createdAt' | 'updatedAt'>
): Promise<GalleryItem> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await GalleryModel.create(input);
    return toPlain<GalleryItem>(doc);
  }
  const db = await readLocalDb();
  const created: GalleryItem = { ...input, _id: generateId('gal'), createdAt: now, updatedAt: now };
  db.gallery.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<GalleryItem>
): Promise<GalleryItem | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await GalleryModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<GalleryItem>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.gallery.findIndex((g) => g._id === id);
  if (idx === -1) return null;
  db.gallery[idx] = { ...db.gallery[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.gallery[idx];
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await GalleryModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.gallery.length;
  db.gallery = db.gallery.filter((g) => g._id !== id);
  await saveLocalDb(db);
  return db.gallery.length < prev;
}

// --- Experiences ---
export async function listExperiences(publishedOnly = false): Promise<Experience[]> {
  if (isMongoConnected()) {
    const docs = await ExperienceModel.find(publishedOnly ? { isPublished: true } : {}).sort({
      sortOrder: 1,
    });
    return docs.map((d) => toPlain<Experience>(d));
  }
  const db = await readLocalDb();
  return db.experiences
    .filter((e) => (publishedOnly ? e.isPublished : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createExperience(
  input: Omit<Experience, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Experience> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ExperienceModel.create(input);
    return toPlain<Experience>(doc);
  }
  const db = await readLocalDb();
  const created: Experience = { ...input, _id: generateId('exp'), createdAt: now, updatedAt: now };
  db.experiences.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateExperience(
  id: string,
  patch: Partial<Experience>
): Promise<Experience | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ExperienceModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<Experience>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.experiences.findIndex((e) => e._id === id);
  if (idx === -1) return null;
  db.experiences[idx] = { ...db.experiences[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.experiences[idx];
}

export async function deleteExperience(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await ExperienceModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.experiences.length;
  db.experiences = db.experiences.filter((e) => e._id !== id);
  await saveLocalDb(db);
  return db.experiences.length < prev;
}

// --- Dining ---
export async function listDining(publishedOnly = false): Promise<DiningItem[]> {
  if (isMongoConnected()) {
    const docs = await DiningModel.find(publishedOnly ? { isPublished: true } : {}).sort({
      sortOrder: 1,
    });
    return docs.map((d) => toPlain<DiningItem>(d));
  }
  const db = await readLocalDb();
  return db.dining
    .filter((d) => (publishedOnly ? d.isPublished : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createDiningItem(
  input: Omit<DiningItem, '_id' | 'createdAt' | 'updatedAt'>
): Promise<DiningItem> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await DiningModel.create(input);
    return toPlain<DiningItem>(doc);
  }
  const db = await readLocalDb();
  const created: DiningItem = { ...input, _id: generateId('din'), createdAt: now, updatedAt: now };
  db.dining.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateDiningItem(
  id: string,
  patch: Partial<DiningItem>
): Promise<DiningItem | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await DiningModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<DiningItem>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.dining.findIndex((d) => d._id === id);
  if (idx === -1) return null;
  db.dining[idx] = { ...db.dining[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.dining[idx];
}

export async function deleteDiningItem(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await DiningModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.dining.length;
  db.dining = db.dining.filter((d) => d._id !== id);
  await saveLocalDb(db);
  return db.dining.length < prev;
}

// --- Reviews ---
export async function listReviews(publishedOnly = false): Promise<Review[]> {
  if (isMongoConnected()) {
    const docs = await ReviewModel.find(publishedOnly ? { isPublished: true } : {}).sort({
      createdAt: -1,
    });
    return docs.map((d) => toPlain<Review>(d));
  }
  const db = await readLocalDb();
  return db.reviews.filter((r) => (publishedOnly ? r.isPublished : true));
}

export async function createReview(
  input: Omit<Review, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Review> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ReviewModel.create(input);
    return toPlain<Review>(doc);
  }
  const db = await readLocalDb();
  const created: Review = { ...input, _id: generateId('rev'), createdAt: now, updatedAt: now };
  db.reviews.unshift(created);
  await saveLocalDb(db);
  return created;
}

export async function updateReview(id: string, patch: Partial<Review>): Promise<Review | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ReviewModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<Review>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.reviews.findIndex((r) => r._id === id);
  if (idx === -1) return null;
  db.reviews[idx] = { ...db.reviews[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.reviews[idx];
}

export async function deleteReview(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await ReviewModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r._id !== id);
  await saveLocalDb(db);
  return db.reviews.length < prev;
}

// --- Contact Messages ---
export async function listContactMessages(): Promise<ContactMessage[]> {
  if (isMongoConnected()) {
    const docs = await ContactMessageModel.find().sort({ createdAt: -1 });
    return docs.map((d) => toPlain<ContactMessage>(d));
  }
  const db = await readLocalDb();
  return [...db.contactMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createContactMessage(
  input: Omit<ContactMessage, '_id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ContactMessage> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ContactMessageModel.create({ ...input, status: 'Unread' });
    return toPlain<ContactMessage>(doc);
  }
  const db = await readLocalDb();
  const created: ContactMessage = {
    ...input,
    _id: generateId('msg'),
    status: 'Unread',
    createdAt: now,
    updatedAt: now,
  };
  db.contactMessages.unshift(created);
  await saveLocalDb(db);
  return created;
}

export async function updateContactMessage(
  id: string,
  patch: Partial<ContactMessage>
): Promise<ContactMessage | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await ContactMessageModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<ContactMessage>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.contactMessages.findIndex((m) => m._id === id);
  if (idx === -1) return null;
  db.contactMessages[idx] = { ...db.contactMessages[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.contactMessages[idx];
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await ContactMessageModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.contactMessages.length;
  db.contactMessages = db.contactMessages.filter((m) => m._id !== id);
  await saveLocalDb(db);
  return db.contactMessages.length < prev;
}

// --- FAQs ---
export async function listFAQs(publishedOnly = false): Promise<FAQ[]> {
  if (isMongoConnected()) {
    const docs = await FAQModel.find(publishedOnly ? { isPublished: true } : {}).sort({ sortOrder: 1 });
    return docs.map((d) => toPlain<FAQ>(d));
  }
  const db = await readLocalDb();
  return db.faqs
    .filter((f) => (publishedOnly ? f.isPublished : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createFAQ(input: Omit<FAQ, '_id' | 'createdAt' | 'updatedAt'>): Promise<FAQ> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await FAQModel.create(input);
    return toPlain<FAQ>(doc);
  }
  const db = await readLocalDb();
  const created: FAQ = { ...input, _id: generateId('faq'), createdAt: now, updatedAt: now };
  db.faqs.push(created);
  await saveLocalDb(db);
  return created;
}

export async function updateFAQ(id: string, patch: Partial<FAQ>): Promise<FAQ | null> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await FAQModel.findByIdAndUpdate(id, { ...patch, updatedAt: now }, { new: true });
    return doc ? toPlain<FAQ>(doc) : null;
  }
  const db = await readLocalDb();
  const idx = db.faqs.findIndex((f) => f._id === id);
  if (idx === -1) return null;
  db.faqs[idx] = { ...db.faqs[idx], ...patch, updatedAt: now };
  await saveLocalDb(db);
  return db.faqs[idx];
}

export async function deleteFAQ(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await FAQModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const db = await readLocalDb();
  const prev = db.faqs.length;
  db.faqs = db.faqs.filter((f) => f._id !== id);
  await saveLocalDb(db);
  return db.faqs.length < prev;
}

// --- CMS Pages & Site Settings ---
export async function listPages(): Promise<PageContent[]> {
  if (isMongoConnected()) {
    const docs = await PageContentModel.find();
    return docs.map((d) => toPlain<PageContent>(d));
  }
  const db = await readLocalDb();
  return db.pages;
}

export async function getPageBySlug(slug: string): Promise<PageContent | null> {
  const normalized = slug.toLowerCase().trim();
  if (isMongoConnected()) {
    const doc = await PageContentModel.findOne({ slug: normalized });
    return doc ? toPlain<PageContent>(doc) : null;
  }
  const db = await readLocalDb();
  return db.pages.find((p) => p.slug === normalized) || null;
}

export async function upsertPage(
  slug: string,
  payload: Partial<PageContent>
): Promise<PageContent> {
  const normalized = slug.toLowerCase().trim();
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await PageContentModel.findOneAndUpdate(
      { slug: normalized },
      { ...payload, slug: normalized, updatedAt: now },
      { upsert: true, new: true }
    );
    return toPlain<PageContent>(doc);
  }
  const db = await readLocalDb();
  const idx = db.pages.findIndex((p) => p.slug === normalized);
  if (idx === -1) {
    const created: PageContent = {
      _id: generateId('page'),
      slug: normalized,
      title: payload.title || normalized,
      body: payload.body || '',
      subtitle: payload.subtitle,
      sections: payload.sections,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
      updatedAt: now,
    };
    db.pages.push(created);
    await saveLocalDb(db);
    return created;
  }
  db.pages[idx] = { ...db.pages[idx], ...payload, updatedAt: now };
  await saveLocalDb(db);
  return db.pages[idx];
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isMongoConnected()) {
    const doc = await SiteSettingsModel.findOne();
    if (doc) return toPlain<SiteSettings>(doc);
  }
  const db = await readLocalDb();
  return db.siteSettings;
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const existing = await SiteSettingsModel.findOne();
    if (existing) {
      const updated = await SiteSettingsModel.findByIdAndUpdate(
        existing._id,
        { ...patch, updatedAt: now },
        { new: true }
      );
      return toPlain<SiteSettings>(updated);
    }
    const created = await SiteSettingsModel.create(patch);
    return toPlain<SiteSettings>(created);
  }
  const db = await readLocalDb();
  db.siteSettings = { ...db.siteSettings, ...patch };
  await saveLocalDb(db);
  return db.siteSettings;
}

// --- Admin Notifications ---
export async function listNotifications(): Promise<AdminNotification[]> {
  if (isMongoConnected()) {
    const docs = await AdminNotificationModel.find().sort({ createdAt: -1 }).limit(30);
    return docs.map((d) => toPlain<AdminNotification>(d));
  }
  const db = await readLocalDb();
  return [...db.notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}

export async function addNotification(
  input: Omit<AdminNotification, '_id' | 'isRead' | 'createdAt'>
): Promise<AdminNotification> {
  const now = new Date().toISOString();
  if (isMongoConnected()) {
    const doc = await AdminNotificationModel.create({ ...input, isRead: false });
    return toPlain<AdminNotification>(doc);
  }
  const db = await readLocalDb();
  const created: AdminNotification = {
    ...input,
    _id: generateId('notif'),
    isRead: false,
    createdAt: now,
  };
  db.notifications.unshift(created);
  await saveLocalDb(db);
  return created;
}

export async function markNotificationsRead(): Promise<void> {
  if (isMongoConnected()) {
    await AdminNotificationModel.updateMany({ isRead: false }, { isRead: true });
    return;
  }
  const db = await readLocalDb();
  db.notifications = db.notifications.map((n) => ({ ...n, isRead: true }));
  await saveLocalDb(db);
}
