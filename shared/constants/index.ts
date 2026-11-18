export const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Rejected',
  'Cancelled',
  'Completed',
] as const;

export const MESSAGE_STATUSES = [
  'Unread',
  'Read',
  'Replied',
  'Archived',
] as const;

export const GALLERY_CATEGORIES = [
  'Resort',
  'Rooms',
  'Views',
  'Dining',
  'Experiences',
] as const;

export const EXPERIENCE_CATEGORIES = [
  'Nature Walk',
  'Sightseeing',
  'Culture',
  'Wellness',
] as const;

export const DINING_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Evening Tea',
  'Dinner',
  'Local Specialty',
] as const;

export const FAQ_CATEGORIES = [
  'Booking',
  'Stay & Rooms',
  'Travel & Location',
  'Dining & Facilities',
] as const;

export const MEAL_PLAN_CODES = ['EP', 'CP', 'MAP', 'AP'] as const;
export type MealPlanCode = (typeof MEAL_PLAN_CODES)[number];

export const MEAL_PLAN_DETAILS: Record<
  MealPlanCode,
  { code: MealPlanCode; shortName: string; title: string; description: string }
> = {
  EP: {
    code: 'EP',
    shortName: 'EP · Room Only',
    title: 'European Plan (EP)',
    description: 'Only room without any meals',
  },
  CP: {
    code: 'CP',
    shortName: 'CP · With Breakfast',
    title: 'Continental Plan (CP)',
    description: 'Room including breakfast only',
  },
  MAP: {
    code: 'MAP',
    shortName: 'MAP · Breakfast & 1 Meal',
    title: 'Modified American Plan (MAP)',
    description: 'Room including breakfast and one meal',
  },
  AP: {
    code: 'AP',
    shortName: 'AP · All Meals',
    title: 'American Plan (AP)',
    description: 'All meals including breakfast, lunch and dinner',
  },
};

export const RESORT_FACILITIES = [
  '9 well-furnished Double Bedded Rooms & 2 well-furnished Four Bedded Rooms',
  '1 No. 50-Seated Conference Room for Corporate Retreats & Group Events',
  'In-House Multi-Cuisine Restaurant',
  'Open-Air Tea / Coffee Bar overlooking Mount Kanchenjunga',
  'Dedicated Selfie Point',
  'Panoramic Kanchenjunga View Point (visible from every room)',
  'Drivers Accommodation on Property',
  'Private Own Parking Place',
] as const;

export const DEFAULT_IMAGES = {
  hero: '/src/assets/images/hd_resort_courtyard_1794995319191.jpg',
  resortBuilding: '/src/assets/images/hd_resort_building_1794995320084.jpg',
  kanchenjungaSunrise: '/src/assets/images/hd_kanchenjunga_sunrise_1794995333911.jpg',
  kanchenjungaDeck: '/src/assets/images/hd_kanchenjunga_deck_1794995329328.jpg',
  samalbongSunset: '/src/assets/images/hd_samalbong_sunset_1794995329368.jpg',
  deluxeWindow: '/src/assets/images/hd_family_suite_1794995325286.jpg',
  deluxeInterior: '/src/assets/images/hd_room_interior_1794995337737.jpg',
  premiumWindow: '/src/assets/images/hd_premium_room_1794995322963.jpg',
  fourBed: '/src/assets/images/hd_four_bed_room_1794995335762.jpg',
  familySuite: '/src/assets/images/hd_deluxe_room_1794995321569.jpg',
  panoramic1: '/src/assets/images/hd_panoramic_one_1794995323881.jpg',
  panoramic2: '/src/assets/images/hd_panoramic_two_1794995324749.jpg',
  dining: '/src/assets/images/hd_dining_hall_1794995326292.jpg',
  balcony: '/src/assets/images/hd_view_balcony_1794995327983.jpg',
  teaBar: '/src/assets/images/hd_tea_bar_1794995328040.jpg',
  conference: '/src/assets/images/hd_conference_hall_1794995326376.jpg',
  trail: '/src/assets/images/hd_sight_lava_1794995331634.jpg',
} as const;
