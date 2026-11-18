import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts';

export const BROCHURE_VERSION = '2026-11-brochure-hd-v2';

export const LEGACY_IMAGE_UPGRADE_MAP: Record<string, string> = {
  '/assets/resort/resort-courtyard.jpg': '/src/assets/images/hd_resort_courtyard_1794995319191.jpg',
  '/assets/resort/resort-building.jpg': '/src/assets/images/hd_resort_building_1794995320084.jpg',
  '/assets/resort/kanchenjunga-deck.jpg': '/src/assets/images/hd_kanchenjunga_deck_1794995329328.jpg',
  '/assets/resort/kanchenjunga-sunrise.jpg': '/src/assets/images/hd_kanchenjunga_sunrise_1794995333911.jpg',
  '/assets/resort/samalbong-sunset.jpg': '/src/assets/images/hd_samalbong_sunset_1794995329368.jpg',
  '/assets/resort/room-deluxe-double.jpg': '/src/assets/images/hd_family_suite_1794995325286.jpg',
  '/assets/resort/room-deluxe-interior.jpg': '/src/assets/images/hd_room_interior_1794995337737.jpg',
  '/assets/resort/room-premium-window.jpg': '/src/assets/images/hd_premium_room_1794995322963.jpg',
  '/assets/resort/room-four-bed.jpg': '/src/assets/images/hd_four_bed_room_1794995335762.jpg',
  '/assets/resort/room-family-suite.jpg': '/src/assets/images/hd_deluxe_room_1794995321569.jpg',
  '/assets/resort/room-panoramic-1.jpg': '/src/assets/images/hd_panoramic_one_1794995323881.jpg',
  '/assets/resort/room-panoramic-2.jpg': '/src/assets/images/hd_panoramic_two_1794995324749.jpg',
  '/assets/resort/dining-restaurant.jpg': '/src/assets/images/hd_dining_hall_1794995326292.jpg',
  '/assets/resort/view-balcony.jpg': '/src/assets/images/hd_view_balcony_1794995327983.jpg',
  '/assets/resort/view-tea-kanchenjunga.jpg': '/src/assets/images/hd_tea_bar_1794995328040.jpg',
  '/assets/resort/facility-conference.jpg': '/src/assets/images/hd_conference_hall_1794995326376.jpg',
  '/assets/resort/sight-lava.jpg': '/src/assets/images/hd_sight_lava_1794995331634.jpg',
  '/assets/resort/sight-lolegaon.jpg': '/src/assets/images/hd_sight_lolegaon_1794995335675.jpg',
  '/assets/resort/sight-rishop.jpg': '/src/assets/images/hd_sight_rishop_1794995331606.jpg',
  '/assets/resort/sight-panbu.jpg': '/src/assets/images/hd_sight_panbu_1794995332709.jpg',
  '/assets/resort/sight-dubling.jpg': '/src/assets/images/hd_sight_dubling_1794995332477.jpg',
  '/assets/resort/sight-ramdhura.jpg': '/src/assets/images/hd_sight_ramdhura_1794995332857.jpg',
  '/assets/resort/sight-moonsung.jpg': '/src/assets/images/hd_sight_moonsung_1794995334935.jpg',
  '/assets/resort/sight-pala.jpg': '/src/assets/images/hd_sight_pala_1794995334053.jpg',
  '/assets/resort/sight-kalimpong.jpg': '/src/assets/images/hd_sight_kalimpong_1794995335427.jpg',
};

const IMG_RESORT_COURTYARD = '/src/assets/images/hd_resort_courtyard_1794995319191.jpg';
const IMG_RESORT_BUILDING = '/src/assets/images/hd_resort_building_1794995320084.jpg';
const IMG_KANCHENJUNGA_DECK = '/src/assets/images/hd_kanchenjunga_deck_1794995329328.jpg';
const IMG_KANCHENJUNGA_SUNRISE = '/src/assets/images/hd_kanchenjunga_sunrise_1794995333911.jpg';
const IMG_SAMALBONG_SUNSET = '/src/assets/images/hd_samalbong_sunset_1794995329368.jpg';
const IMG_DELUXE_DOUBLE = '/src/assets/images/hd_family_suite_1794995325286.jpg';
const IMG_DELUXE_INTERIOR = '/src/assets/images/hd_room_interior_1794995337737.jpg';
const IMG_PREMIUM_WINDOW = '/src/assets/images/hd_premium_room_1794995322963.jpg';
const IMG_FOUR_BED = '/src/assets/images/hd_four_bed_room_1794995335762.jpg';
const IMG_FAMILY_SUITE = '/src/assets/images/hd_deluxe_room_1794995321569.jpg';
const IMG_PANORAMIC_1 = '/src/assets/images/hd_panoramic_one_1794995323881.jpg';
const IMG_PANORAMIC_2 = '/src/assets/images/hd_panoramic_two_1794995324749.jpg';
const IMG_DINING = '/src/assets/images/hd_dining_hall_1794995326292.jpg';
const IMG_BALCONY = '/src/assets/images/hd_view_balcony_1794995327983.jpg';
const IMG_TEA_BAR = '/src/assets/images/hd_tea_bar_1794995328040.jpg';
const IMG_CONFERENCE = '/src/assets/images/hd_conference_hall_1794995326376.jpg';

const IMG_SIGHT_LAVA = '/src/assets/images/hd_sight_lava_1794995331634.jpg';
const IMG_SIGHT_LOLEGAON = '/src/assets/images/hd_sight_lolegaon_1794995335675.jpg';
const IMG_SIGHT_RISHOP = '/src/assets/images/hd_sight_rishop_1794995331606.jpg';
const IMG_SIGHT_PANBU = '/src/assets/images/hd_sight_panbu_1794995332709.jpg';
const IMG_SIGHT_DUBLING = '/src/assets/images/hd_sight_dubling_1794995332477.jpg';
const IMG_SIGHT_RAMDHURA = '/src/assets/images/hd_sight_ramdhura_1794995332857.jpg';
const IMG_SIGHT_MOONSUNG = '/src/assets/images/hd_sight_moonsung_1794995334935.jpg';
const IMG_SIGHT_PALA = '/src/assets/images/hd_sight_pala_1794995334053.jpg';
const IMG_SIGHT_KALIMPONG = '/src/assets/images/hd_sight_kalimpong_1794995335427.jpg';

export async function createDefaultSeedPayload() {
  const now = new Date().toISOString();
  const passwordHash = env.ADMIN_PASSWORD
    ? await bcrypt.hash(env.ADMIN_PASSWORD, 12)
    : '';

  const dayOffset = (days: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  };

  const rooms = [
    {
      _id: 'room-deluxe',
      name: 'Deluxe Room',
      slug: 'deluxe-room',
      shortDescription:
        'Well-furnished Double Bedded Room with panoramic hillside windows offering clear views of the Mount Kanchenjunga range.',
      description:
        'Our well-furnished Deluxe Double Bedded Rooms pair warm recessed ceiling lighting, crisp linens, and sweeping hillside windows where you see the full range of Mount Kanchenjunga from every room. Choose flexibly between EP (Room Only), CP (Breakfast), MAP (Breakfast + 1 Meal), or AP (All Meals), with extra person (>12 yrs) accommodation available.',
      pricePerNight: 2000,
      mealPlans: [
        {
          code: 'EP' as const,
          label: 'EP (Room Only)',
          description: 'Only room without any meals',
          roomRate: 2000,
          extraPersonRate: 500,
        },
        {
          code: 'CP' as const,
          label: 'CP (With Breakfast)',
          description: 'Room including breakfast only',
          roomRate: 2500,
          extraPersonRate: 750,
        },
        {
          code: 'MAP' as const,
          label: 'MAP (Breakfast & 1 Meal)',
          description: 'Room including breakfast and one meal',
          roomRate: 3300,
          extraPersonRate: 1100,
        },
        {
          code: 'AP' as const,
          label: 'AP (All Meals)',
          description: 'All meals including breakfast, lunch and dinner',
          roomRate: 4100,
          extraPersonRate: 1550,
        },
      ],
      maxGuests: 3,
      totalUnits: 6,
      bedType: 'Double Bed',
      roomSize: 'Well-Furnished Double Bedded',
      viewType: 'Full Range of Kanchenjunga & Green Hills',
      amenities: [
        'Full Kanchenjunga Range View',
        'Panoramic Mountain Windows',
        'Double Bedded Layout',
        'LED TV & Wardrobe',
        'En-Suite Hot Shower',
        'EP / CP / MAP / AP Meal Plans',
        'Own Parking & Drivers Stay',
      ],
      images: [
        {
          url: IMG_DELUXE_DOUBLE,
          alt: 'Deluxe Double Bedded Room with mountain windows at Cloud Valley Resort Samalbong',
        },
        {
          url: IMG_DELUXE_INTERIOR,
          alt: 'Deluxe Room crisp linens, cove ceiling lighting and hillside window view',
        },
        {
          url: IMG_PANORAMIC_1,
          alt: 'Panoramic Kanchenjunga glass wall inside Cloud Valley room',
        },
      ],
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'room-premium',
      name: 'Premium Room',
      slug: 'premium-room',
      shortDescription:
        'Corner glass-fronted Double Bedded Room overlooking snow-capped Kanchenjunga peaks, misty valleys, and open-air balconies.',
      description:
        'Elevated on our prime ridge wings, the Premium Room frames dramatic corner-glass panoramas of Mount Kanchenjunga and the Teesta River valley right from your pillow. Features warm timber-toned cove ceilings, private seating by the glass, balcony access, and full EP, CP, MAP, and AP tariff options.',
      pricePerNight: 2500,
      mealPlans: [
        {
          code: 'EP' as const,
          label: 'EP (Room Only)',
          description: 'Only room without any meals',
          roomRate: 2500,
          extraPersonRate: 750,
        },
        {
          code: 'CP' as const,
          label: 'CP (With Breakfast)',
          description: 'Room including breakfast only',
          roomRate: 3000,
          extraPersonRate: 1000,
        },
        {
          code: 'MAP' as const,
          label: 'MAP (Breakfast & 1 Meal)',
          description: 'Room including breakfast and one meal',
          roomRate: 3800,
          extraPersonRate: 1400,
        },
        {
          code: 'AP' as const,
          label: 'AP (All Meals)',
          description: 'All meals including breakfast, lunch and dinner',
          roomRate: 4600,
          extraPersonRate: 1800,
        },
      ],
      maxGuests: 3,
      totalUnits: 3,
      bedType: 'King / Panoramic Double Bed',
      roomSize: 'Corner Panorama Double Bedded',
      viewType: 'Corner Glass Kanchenjunga & Valley View',
      amenities: [
        'Corner Panoramic Glass View',
        'Full Kanchenjunga Range from Bed',
        'Balcony Seating Access',
        'LED TV & Wardrobe',
        'En-Suite Hot Water Bathroom',
        'EP / CP / MAP / AP Meal Plans',
        'Tea/Coffee Bar Access',
      ],
      images: [
        {
          url: IMG_PREMIUM_WINDOW,
          alt: 'Premium Room corner panoramic window looking toward Mount Kanchenjunga',
        },
        {
          url: IMG_PANORAMIC_2,
          alt: 'Corner glass Premium Room interior with balcony railing',
        },
        {
          url: IMG_BALCONY,
          alt: 'Open-air mountain veranda overlooking Samalbong valley',
        },
      ],
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'room-four-bedded',
      name: 'Four Bedded Room',
      slug: 'four-bedded-room',
      shortDescription:
        'Spacious well-furnished Four Bedded Room (two double beds) ideal for families, friends, and corporate group retreats.',
      description:
        'One of only two dedicated Four Bedded Rooms at Cloud Valley Resort, thoughtfully appointed with two comfortable double beds, warm cove-lit ceilings, and direct mountain views of Kanchenjunga. Base room tariff follows our Premium schedule with Extra Person (>12 years) options across EP, CP, MAP, and AP meal plans.',
      pricePerNight: 2500,
      mealPlans: [
        {
          code: 'EP' as const,
          label: 'EP (Room Only)',
          description: 'Only room without any meals (+ Extra Person above 12 yrs)',
          roomRate: 2500,
          extraPersonRate: 750,
        },
        {
          code: 'CP' as const,
          label: 'CP (With Breakfast)',
          description: 'Room including breakfast only (+ Extra Person above 12 yrs)',
          roomRate: 3000,
          extraPersonRate: 1000,
        },
        {
          code: 'MAP' as const,
          label: 'MAP (Breakfast & 1 Meal)',
          description: 'Room including breakfast and one meal (+ Extra Person above 12 yrs)',
          roomRate: 3800,
          extraPersonRate: 1400,
        },
        {
          code: 'AP' as const,
          label: 'AP (All Meals)',
          description: 'All meals including breakfast, lunch and dinner (+ Extra Person above 12 yrs)',
          roomRate: 4600,
          extraPersonRate: 1800,
        },
      ],
      maxGuests: 5,
      totalUnits: 2,
      bedType: 'Two Double Beds (Four Bedded)',
      roomSize: 'Spacious 4-Bedded Family Wing',
      viewType: 'Kanchenjunga Range & Samalbong Hills',
      amenities: [
        'Two Well-Furnished Double Beds',
        'Ideal for Families & Groups',
        'Full Kanchenjunga Range View',
        'Seating Corner & LED TV',
        '50-Seated Conference Hall Access',
        'EP / CP / MAP / AP Meal Plans',
        'Private Parking & Drivers Accommodation',
      ],
      images: [
        {
          url: IMG_FOUR_BED,
          alt: 'Four Bedded Room with two double beds at Cloud Valley Resort Samalbong',
        },
        {
          url: IMG_FAMILY_SUITE,
          alt: 'Twin double beds and spacious family accommodation at Cloud Valley Resort',
        },
        {
          url: IMG_DELUXE_INTERIOR,
          alt: 'Spacious interior furnishings inside Cloud Valley Resort',
        },
      ],
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const bookings = [
    {
      _id: 'booking-seed-1',
      bookingReference: 'CV-2611-4082',
      guestName: 'Ananya Chatterjee',
      phone: '+91 98301 00001',
      email: 'ananya.guest@example.com',
      checkIn: dayOffset(0),
      checkOut: dayOffset(3),
      adults: 2,
      children: 0,
      roomId: 'room-premium',
      roomName: 'Premium Room',
      roomsRequested: 1,
      mealPlan: 'CP' as const,
      extraPersons: 0,
      estimatedPrice: 9000,
      specialRequests: 'Early morning tea at the Open-Air Tea/Coffee Bar facing Kanchenjunga.',
      arrivalTime: '13:00 - 15:00',
      status: 'Confirmed' as const,
      source: 'website' as const,
      internalNotes: 'Confirmed CP plan. Corner Kanchenjunga view room assigned.',
      createdAt: dayOffset(-5),
      updatedAt: dayOffset(-4),
    },
    {
      _id: 'booking-seed-2',
      bookingReference: 'CV-2611-5190',
      guestName: 'Rohan & Meera Sen',
      phone: '+91 98310 00002',
      email: 'rohan.sen@example.com',
      checkIn: dayOffset(4),
      checkOut: dayOffset(7),
      adults: 2,
      children: 1,
      roomId: 'room-deluxe',
      roomName: 'Deluxe Room',
      roomsRequested: 1,
      mealPlan: 'MAP' as const,
      extraPersons: 0,
      estimatedPrice: 9900,
      specialRequests: 'Interested in Lava, Lolegaon & Rishop day sightseeing cab.',
      arrivalTime: '12:00 - 14:00',
      status: 'Pending' as const,
      source: 'website' as const,
      createdAt: dayOffset(-1),
      updatedAt: dayOffset(-1),
    },
    {
      _id: 'booking-seed-3',
      bookingReference: 'CV-2611-3104',
      guestName: 'Siddharth Bose',
      phone: '+91 98740 00003',
      email: 'siddharth.b@example.com',
      checkIn: dayOffset(-3),
      checkOut: dayOffset(0),
      adults: 4,
      children: 0,
      roomId: 'room-four-bedded',
      roomName: 'Four Bedded Room',
      roomsRequested: 1,
      mealPlan: 'AP' as const,
      extraPersons: 2,
      estimatedPrice: 24600,
      arrivalTime: '14:00 - 16:00',
      status: 'Confirmed' as const,
      source: 'website' as const,
      internalNotes: 'Family of 4 on AP plan with driver accommodation arranged.',
      createdAt: dayOffset(-10),
      updatedAt: dayOffset(-8),
    },
  ];

  const gallery = [
    {
      _id: 'gal-1',
      title: 'Cloud Valley Entrance & WE ❤️ CLOUD VALLEY Terrace',
      imageUrl: IMG_RESORT_COURTYARD,
      category: 'Resort' as const,
      alt: 'Cloud Valley Resort building and WE LOVE CLOUD VALLEY viewpoint terrace in Samalbong',
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-2',
      title: 'Cloud Valley Resort Hillside Facade & Patio',
      imageUrl: IMG_RESORT_BUILDING,
      category: 'Resort' as const,
      alt: 'Multi-level hillside building and outdoor red umbrella patio at Cloud Valley Samalbong',
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-3',
      title: 'Premium Corner Kanchenjunga View Room',
      imageUrl: IMG_PREMIUM_WINDOW,
      category: 'Rooms' as const,
      alt: 'Premium Room with corner windows overlooking Mount Kanchenjunga',
      isFeatured: true,
      isPublished: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-4',
      title: 'Deluxe Double Bedded Room',
      imageUrl: IMG_DELUXE_DOUBLE,
      category: 'Rooms' as const,
      alt: 'Well-furnished Double Bedded Room with panoramic mountain windows',
      isFeatured: true,
      isPublished: true,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-5',
      title: 'Four Bedded Room for Families & Groups',
      imageUrl: IMG_FOUR_BED,
      category: 'Rooms' as const,
      alt: 'Well-furnished Four Bedded Room with two double beds',
      isFeatured: true,
      isPublished: true,
      sortOrder: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-6',
      title: 'In-House Multi-Cuisine Restaurant',
      imageUrl: IMG_DINING,
      category: 'Dining' as const,
      alt: 'Cloud Valley in-house multi-cuisine restaurant with panoramic valley windows',
      isFeatured: true,
      isPublished: true,
      sortOrder: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-7',
      title: 'Open-Air Tea / Coffee Bar Facing Kanchenjunga',
      imageUrl: IMG_TEA_BAR,
      category: 'Dining' as const,
      alt: 'Morning tea cup overlooking snow-capped Mount Kanchenjunga range',
      isFeatured: true,
      isPublished: true,
      sortOrder: 7,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-8',
      title: '50-Seated Corporate Conference Room',
      imageUrl: IMG_CONFERENCE,
      category: 'Resort' as const,
      alt: '50-seated conference room for corporate retreats and group meetings',
      isFeatured: false,
      isPublished: true,
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-9',
      title: 'Kanchenjunga Viewpoint & Open Balcony',
      imageUrl: IMG_BALCONY,
      category: 'Views' as const,
      alt: 'Open mountain balcony overlooking misty Samalbong hills',
      isFeatured: false,
      isPublished: true,
      sortOrder: 9,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-10',
      title: 'First Light Across Snow-Capped Kanchenjunga',
      imageUrl: IMG_KANCHENJUNGA_SUNRISE,
      category: 'Views' as const,
      alt: 'Golden sunrise over snow-capped Kanchenjunga peaks seen from Samalbong',
      isFeatured: false,
      isPublished: true,
      sortOrder: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-11',
      title: 'Samalbong Ridge Sunset Deck',
      imageUrl: IMG_KANCHENJUNGA_DECK,
      category: 'Views' as const,
      alt: 'Wooden viewpoint deck facing Kanchenjunga range at sunset',
      isFeatured: false,
      isPublished: true,
      sortOrder: 11,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'gal-12',
      title: 'Rishop Misty Mountain Curve',
      imageUrl: IMG_SIGHT_RISHOP,
      category: 'Experiences' as const,
      alt: 'Misty mountain road and pine slopes in Rishop near Samalbong',
      isFeatured: false,
      isPublished: true,
      sortOrder: 12,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const experiences = [
    {
      _id: 'exp-lava',
      title: 'Lava View Point',
      slug: 'lava-view-point',
      description:
        'Explore the misty pine forest trails, wooden ridge walkways, and historic monastery hills of Lava—an iconic Eastern Himalayan excursion from Samalbong.',
      duration: 'Half-day excursion',
      bestTime: 'Morning (October – March clearest)',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_LAVA, alt: 'Pine forest trail and viewpoint at Lava' }],
      category: 'Nature Walk' as const,
      location: 'Lava, Kalimpong Hills',
      isPublished: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-lolegaon',
      title: 'Lolegaon Canopy Walk & Forest',
      slug: 'lolegaon-canopy',
      description:
        'Walk across Lolegaon’s famous hanging wooden canopy bridge suspended amidst dense moss-draped cypress and pine forests.',
      duration: 'Half-day excursion',
      bestTime: 'Morning to Midday',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_LOLEGAON, alt: 'Hanging forest canopy walkway at Lolegaon' }],
      category: 'Nature Walk' as const,
      location: 'Lolegaon, Kalimpong',
      isPublished: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-rishop',
      title: 'Rishop Hilltop Village',
      slug: 'rishop-hilltop',
      description:
        'Visit tranquil Rishop tucked high in mist-kissed pine forests, famed for slow mountain walks and sweeping Kanchenjunga ridge panoramas.',
      duration: 'Half-day excursion',
      bestTime: 'Morning or Sunset',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_RISHOP, alt: 'Misty pine slopes and cottages at Rishop' }],
      category: 'Sightseeing' as const,
      location: 'Rishop, Kalimpong District',
      isPublished: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-panbu',
      title: 'Panbu View Point',
      slug: 'panbu-view-point',
      description:
        'Stroll the hilltop ridge bridge at Panbu View Point for dramatic sweeping views across the Teesta River gorge and Himalayan foothills.',
      duration: '2–3 hours',
      bestTime: 'Sunrise & Clear Mornings',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_PANBU, alt: 'Mountain ridge viewpoint path at Panbu' }],
      category: 'Sightseeing' as const,
      location: 'Panbu Ridge, Kalimpong',
      isPublished: true,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-dubling',
      title: 'Dubling View Point',
      slug: 'dubling-view-point',
      description:
        'Capture memorable hill photographs at Dubling View Point’s scenic ridge frame looking out over rolling blue Kalimpong valleys.',
      duration: '2 hours',
      bestTime: 'Late Morning or Golden Hour',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_DUBLING, alt: 'Scenic viewpoint arch at Dubling View Point' }],
      category: 'Sightseeing' as const,
      location: 'Dubling, Kalimpong Hills',
      isPublished: true,
      sortOrder: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-ramdhura',
      title: 'Ramdhura Pine Ridge',
      slug: 'ramdhura-ridge',
      description:
        'Climb the hilltop lookout steps at Ramdhura for serene views of the curling Teesta River valley and surrounding tea & cinchona hills.',
      duration: '2–3 hours',
      bestTime: 'Morning',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_RAMDHURA, alt: 'Hilltop observation deck at Ramdhura' }],
      category: 'Sightseeing' as const,
      location: 'Ramdhura, Kalimpong',
      isPublished: true,
      sortOrder: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-moonsung',
      title: 'Moonsung (Munsong) View Point',
      slug: 'moonsung-view-point',
      description:
        'Watch the silvery Teesta River wind through deep emerald valleys beneath terraced cinchona slopes at quiet Moonsung View Point.',
      duration: '2–3 hours',
      bestTime: 'Clear Mornings',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_MOONSUNG, alt: 'Aerial view of Teesta River bend from Moonsung View Point' }],
      category: 'Sightseeing' as const,
      location: 'Munsong, Kalimpong',
      isPublished: true,
      sortOrder: 7,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-pala',
      title: 'Pala Waterfall & Suicide Point',
      slug: 'pala-waterfall-suicide-point',
      description:
        'Journey into lush forest glades to see cascading Pala Waterfall and the dramatic cliff overlook at Suicide Point near Samalbong.',
      duration: '2–3 hours',
      bestTime: 'Daytime (Post-Monsoon to Spring)',
      distance: 'Covered sightseeing from Cloud Valley',
      images: [{ url: IMG_SIGHT_PALA, alt: 'Forest waterfall cascade at Pala Waterfall' }],
      category: 'Nature Walk' as const,
      location: 'Near Samalbong, Kalimpong',
      isPublished: true,
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'exp-kalimpong',
      title: 'Kalimpong Heritage Tour (Delo Park & More)',
      slug: 'kalimpong-heritage-tour',
      description:
        'Full local sightseeing covering Delo Park, Gujar, Kanchang, Kalimpong Golf Course, Science City, and Pine View Cactus Nursery (21–30 km from Samalbong).',
      duration: 'Full / Half Day',
      bestTime: 'Morning to Afternoon',
      distance: '21–30 km (Kalimpong Town)',
      images: [{ url: IMG_SIGHT_KALIMPONG, alt: 'Kalimpong hilltop landmarks including Delo Park and monasteries' }],
      category: 'Culture' as const,
      location: 'Kalimpong Town',
      isPublished: true,
      sortOrder: 9,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const dining = [
    {
      _id: 'din-1',
      title: 'In-House Multi-Cuisine Restaurant',
      category: 'Local Specialty' as const,
      description:
        'Our spacious panoramic dining hall serves freshly prepared Indian, Chinese, Continental, and local Kalimpong hill dishes for guests across CP, MAP, and AP meal plans as well as à la carte orders.',
      timing: '7:30 AM – 10:00 PM',
      dietaryNote: 'Included in CP (Breakfast), MAP (Breakfast + 1 Meal) & AP (All Meals)',
      imageUrl: IMG_DINING,
      alt: 'Cloud Valley in-house multi-cuisine restaurant overlooking Kalimpong hills',
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'din-2',
      title: 'Open-Air Tea / Coffee Bar',
      category: 'Evening Tea' as const,
      description:
        'Sip steaming single-estate Himalayan tea or fresh mountain coffee outdoors while watching golden light touch the snow-capped Kanchenjunga peaks.',
      timing: '6:30 AM – 8:30 PM',
      dietaryNote: 'Open-air terrace seating facing Kanchenjunga View Point',
      imageUrl: IMG_TEA_BAR,
      alt: 'Open-air tea and coffee cup facing Mount Kanchenjunga at Cloud Valley',
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'din-3',
      title: 'Breakfast, MAP & Full-Board AP Dining',
      category: 'Breakfast' as const,
      description:
        'Choose your stay plan flexibly: EP (room only), CP (breakfast included), MAP (breakfast + lunch or dinner), or AP (all meals: breakfast, lunch & dinner) tailored for families and corporate groups.',
      timing: 'Breakfast · Lunch · Dinner',
      dietaryNote: 'Custom group buffets available for 50-Seated Conference guests',
      imageUrl: IMG_BALCONY,
      alt: 'Mountain terrace seating beside Cloud Valley dining veranda',
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const reviews = [
    {
      _id: 'rev-1',
      guestName: 'Debolina Mukherjee',
      guestLocation: 'Kolkata',
      rating: 5,
      comment:
        'True to their promise—we saw the full Kanchenjunga range right from our Premium Room window! Peaceful Samalbong Khasmahal atmosphere far away from crowded town traffic.',
      sourceLabel: 'Direct Guest Stay',
      stayDate: 'November 2026',
      isFeatured: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'rev-2',
      guestName: 'Arjun & Kavita Rao',
      guestLocation: 'Bengaluru',
      rating: 5,
      comment:
        'Loved the Open-Air Tea Bar, warm hospitality from Joy Banerjee and Prasanta Das, and our day trip covering Lava, Lolegaon, Rishop, and Pala Waterfall.',
      sourceLabel: 'Direct Guest Stay',
      stayDate: 'October 2026',
      isFeatured: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'rev-3',
      guestName: 'Pranav Sharma',
      guestLocation: 'New Delhi',
      rating: 5,
      comment:
        'We hosted our 35-person team offsite using the 50-Seated Conference Room and Four Bedded + Deluxe rooms on AP all-meals plan. Own parking and drivers stay made logistics effortless.',
      sourceLabel: 'Corporate Group',
      stayDate: 'October 2026',
      isFeatured: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const faqs = [
    {
      _id: 'faq-1',
      question: 'What meal plans (EP, CP, MAP, AP) are offered and what do they include?',
      answer:
        'EP covers Only Room without any meals (Deluxe ₹2,000 / Premium ₹2,500). CP includes Room + Breakfast only (Deluxe ₹2,500 / Premium ₹3,000). MAP includes Room + Breakfast and one meal (Deluxe ₹3,300 / Premium ₹3,800). AP covers All Meals—breakfast, lunch and dinner (Deluxe ₹4,100 / Premium ₹4,600). Extra Person (>12 years) rates apply separately per plan.',
      category: 'Booking' as const,
      isPublished: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'faq-2',
      question: 'Where is Cloud Valley Resort located and when is the best time to visit?',
      answer:
        'We are situated in Samalbong Khasmahal (Sinji), Kalimpong district, West Bengal—roughly 21–30 km from Kalimpong town. October to March offers the clearest skies and best panoramic views of Mount Kanchenjunga and the Teesta River.',
      category: 'Travel & Location' as const,
      isPublished: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'faq-3',
      question: 'How many rooms and facilities does Cloud Valley Resort have?',
      answer:
        'Cloud Valley Resort is the only 3-star property in Samalbong where you see the full range of Kanchenjunga from every room. We feature 9 well-furnished Double Bedded Rooms, 2 well-furnished Four Bedded Rooms, a 50-Seated Conference Room, In-House Multi-Cuisine Restaurant, Open-Air Tea/Coffee Bar, Selfie Point, Kanchenjunga View Point, Drivers Accommodation, and Own Parking Place.',
      category: 'Stay & Rooms' as const,
      isPublished: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'faq-4',
      question: 'Which sightseeing places can be covered from the property?',
      answer:
        'Guests regularly cover Lava View Point, Lolegaon, Rishop, Panbu View Point, Dubling View Point, Ramdhura, Moonsung View Point, Pala Waterfall & Suicide Point, and Kalimpong town attractions (Delo Park, Golf Course, Science City, Pine View Nursery).',
      category: 'Dining & Facilities' as const,
      isPublished: true,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const siteSettings = {
    resortName: 'Cloud Valley Resort',
    tagline: 'Where Mountains Whisper and Moments Stay Forever — Samalbong, Kalimpong',
    logoText: 'CLOUD VALLEY',
    logoUrl: '',
    phone: '+91 99033 30663',
    secondaryPhones: [
      '+91 97325 69816',
      '+91 98045 84639',
      '+91 82502 19594',
    ],
    hosts: 'Joy Banerjee & Prasanta Das',
    whatsapp: '+919903330663',
    email: 'cloudvalleyhomestaykalimpong@gmail.com',
    address:
      'Samalbong Khasmahal (Sinji), roughly 21–30 km from Kalimpong Town, West Bengal 734319, India',
    googleMapsEmbedUrl:
      'https://maps.google.com/maps?q=Samalbong%20Khasmahal%20Kalimpong%20West%20Bengal&t=&z=13&ie=UTF8&iwloc=&output=embed',
    googleMapsLink:
      'https://maps.google.com/?q=Samalbong+Khasmahal+Sinji+Kalimpong+West+Bengal',
    instagramUrl: 'https://instagram.com',
    facebookUrl: 'https://facebook.com',
    checkInTime: '1:00 PM',
    checkOutTime: '11:00 AM',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultBookingPolicy:
      'Online submissions are reservation requests until confirmed by Joy Banerjee & Prasanta Das’s reservations desk. Extra Person (>12 yrs) rates apply per selected EP/CP/MAP/AP plan.',
    seoTitle: 'Cloud Valley Resort, Samalbong | 3-Star Kanchenjunga View Resort in Kalimpong',
    seoDescription:
      'Samalbong’s only 3-star property offering full Kanchenjunga views from every room. 9 Double & 2 Four Bedded Rooms, 50-Seated Conference Room, Multi-Cuisine Restaurant & EP/CP/MAP/AP plans.',
    emailNotificationsEnabled: true,
    updatedAt: now,
  };

  const pages = [
    {
      _id: 'page-home',
      slug: 'home',
      title: 'Cloud Valley Resort — Samalbong, Kalimpong',
      subtitle: 'Where Mountains Whisper and Moments Stay Forever...',
      body: 'Samalbong’s only 3-star mountain resort offering panoramic views of Mount Kanchenjunga and the Teesta River.',
      sections: {
        heroHeadline: 'Where Mountains Whisper and Moments Stay Forever...',
        heroSubtitle:
          'Samalbong Khasmahal (Sinji), Kalimpong — the only 3-star property in Samalbong where you see the full range of Mount Kanchenjunga from every room.',
        heroImageUrl: IMG_RESORT_COURTYARD,
        welcomeTitle: 'Unwind... Explore... Experience Samalbong.',
        welcomeBody:
          'Samalbong is a serene, offbeat mountain village in Kalimpong district, West Bengal (21–30 km from Kalimpong town), offering clear morning views of the snow-capped Kanchenjunga range, Teesta River valleys, rolling green hills, and misty tea and orange gardens. Ideal for slow travel, bird watching, nature walks, and digital detox—best visited from October to March.',
        welcomeImageUrl: IMG_RESORT_BUILDING,
        experienceTitle: 'Breathtaking Kanchenjunga views, serene trails & 9 scenic excursions.',
        experienceSubtitle:
          'Step out to Lava, Lolegaon, Rishop, Panbu, Dubling, Ramdhura, Moonsung, Pala Waterfall & Suicide Point, and Kalimpong landmarks—or unwind at our Selfie Point & Kanchenjunga View Point.',
        diningTitle: 'In-House Multi-Cuisine Restaurant & Open-Air Tea/Coffee Bar.',
        diningSubtitle:
          'Enjoy flexible EP, CP, MAP, and AP meal plans crafted fresh on site—from morning tea facing Mount Kanchenjunga to hearty multi-cuisine dinners and group hospitality.',
        diningImageUrl: IMG_DINING,
        ctaTitle: 'Ideal for Family, Friends & Corporate Groups.',
        ctaSubtitle:
          'Featuring 9 Double Bedded Rooms, 2 Four Bedded Rooms, a 50-Seated Conference Room, Drivers Accommodation, and Own Parking. Reach out for stays or corporate tie-ups with Joy Banerjee & Prasanta Das.',
        aboutStoryTitle: 'Samalbong’s only 3-star retreat framing the full Kanchenjunga range.',
        aboutStoryBody:
          'Located in Samalbong Khasmahal (Sinji), 21–30 km from Kalimpong town, Cloud Valley Resort welcomes families, slow travelers, and corporate teams seeking crisp mountain air, unobstructed views of Mount Kanchenjunga and the Teesta River, and warm hospitality led by Joy Banerjee & Prasanta Das.',
        aboutPhilosophy:
          'We truly value your support and welcome family holidays, group retreats, and corporate tie-ups—combining panoramic rooms, our 50-Seated Conference Room, multi-cuisine dining, and local Kalimpong sightseeing under one roof.',
      },
      updatedAt: now,
    },
    {
      _id: 'page-privacy-policy',
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      subtitle: 'How Cloud Valley Resort, Samalbong handles guest inquiry and booking information.',
      body: `Cloud Valley Resort ("we", "our", "the resort") respects your privacy and handles all personal details submitted through our website with care.\n\n1. Information We Collect\nWhen you register an account, submit a booking request, or send a contact inquiry, we collect your name, email address, phone number, preferred stay dates, meal plan choice, guest counts, and any special requests.\n\n2. How We Use Your Information\nYour information is used strictly to evaluate room availability, confirm and manage your stay reservation, communicate status updates, and arrange requested hospitality or corporate conference services.\n\n3. Contact Regarding Privacy\nTo update or request removal of your inquiry details, please write to cloudvalleyhomestaykalimpong@gmail.com or call +91 99033 30663.`,
      updatedAt: now,
    },
    {
      _id: 'page-terms',
      slug: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'Guidelines governing booking requests, meal plans, and stays at Cloud Valley Resort, Samalbong.',
      body: `1. Reservation Requests & Meal Plans\nAll bookings submitted online are treated as reservation requests until confirmed by Cloud Valley Resort.\nPlans: EP (Only Room without meals), CP (Room + Breakfast only), MAP (Room + Breakfast & 1 Meal), AP (All meals: Breakfast, Lunch & Dinner). Extra Person (>12 years) tariffs apply per selected plan.\n\n2. Check-In & Identification\nStandard check-in is from 1:00 PM and check-out is by 11:00 AM. Valid government-issued photo identification is required for all adult guests at check-in.\n\n3. Property Facilities\nOwn Parking Place and Drivers Accommodation are available for guests arriving by private vehicle or hired cab.`,
      updatedAt: now,
    },
    {
      _id: 'page-cancellation-policy',
      slug: 'cancellation-policy',
      title: 'Cancellation Policy',
      subtitle: 'Clear, fair terms for modifying or cancelling your stay at Cloud Valley Resort.',
      body: `1. Requesting a Cancellation\nGuests may submit a cancellation request online from their Guest Account (/account) or by calling +91 99033 30663 / +91 97325 69816.\n\n2. Standard Cancellation Windows\n- 14 days or more prior to check-in: Eligible for complimentary rescheduling or full deposit refund.\n- 7 to 13 days prior to check-in: 50% adjustment or date credit toward a future stay within 6 months.\n- Less than 7 days prior to check-in or no-show: Subject to retention unless caused by verified regional road closures or weather advisories.`,
      updatedAt: now,
    },
  ];

  return {
    admins: passwordHash
      ? [
          {
            _id: 'admin-1',
            name: env.ADMIN_NAME,
            email: env.ADMIN_EMAIL.toLowerCase(),
            passwordHash,
            role: 'admin' as const,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [],
    customers: [],
    rooms,
    bookings,
    blockedDates: [],
    gallery,
    experiences,
    dining,
    reviews,
    faqs,
    contactMessages: [],
    notifications: [
      {
        _id: 'notif-1',
        title: 'New Booking Request',
        message: 'CV-2611-5190 from Rohan & Meera Sen (Deluxe Room · MAP) is awaiting confirmation.',
        type: 'booking' as const,
        referenceId: 'CV-2611-5190',
        isRead: false,
        createdAt: dayOffset(-1),
      },
    ],
    siteSettings,
    pages,
  };
}
