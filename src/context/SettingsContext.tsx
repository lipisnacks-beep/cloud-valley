import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { HomeCMSContent, PageContent, Room, SiteSettings } from '../../shared/types/index.ts';
import { DEFAULT_IMAGES } from '../../shared/constants/index.ts';

interface PublicDataContextValue {
  settings: SiteSettings;
  homeContent: HomeCMSContent;
  rooms: Room[];
  isLoading: boolean;
}

const fallbackSettings: SiteSettings = {
  resortName: 'Cloud Valley Resort',
  tagline: 'Where Mountains Whisper and Moments Stay Forever',
  logoText: 'CLOUD VALLEY',
  phone: '+91 99033 30663',
  secondaryPhones: ['+91 97325 69816', '+91 98045 84639', '+91 82502 19594'],
  hosts: 'Joy Banerjee & Prasanta Das',
  whatsapp: '+919903330663',
  email: 'cloudvalleyhomestaykalimpong@gmail.com',
  address: 'Samalbong Khasmahal (Sinji), Kalimpong District, West Bengal 734319 (21–30 km from Kalimpong Town)',
  googleMapsEmbedUrl:
    'https://maps.google.com/maps?q=Samalbong%20Khasmahal%20Kalimpong%20West%20Bengal&t=&z=13&ie=UTF8&iwloc=&output=embed',
  googleMapsLink: 'https://maps.google.com/?q=Samalbong+Khasmahal+Kalimpong+West+Bengal',
  checkInTime: '1:00 PM',
  checkOutTime: '11:00 AM',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  defaultBookingPolicy:
    'Online submissions register a reservation request. Our hosts Joy Banerjee & Prasanta Das confirm availability and finalize your stay.',
  seoTitle: 'Cloud Valley Resort, Samalbong | 3-Star Kanchenjunga View Retreat',
  seoDescription:
    'The only 3-star resort property in Samalbong, Kalimpong — offering panoramic views of the full Mount Kanchenjunga range from every room, multi-cuisine dining, and 50-seated conference hall.',
  emailNotificationsEnabled: true,
};

const fallbackHome: HomeCMSContent = {
  heroHeadline: 'Where Mountains Whisper and Moments Stay Forever.',
  heroSubtitle:
    'Cloud Valley Resort, Samalbong — Kalimpong’s serene 3-star sanctuary offering panoramic views of Mount Kanchenjunga from every room and the Teesta River hills.',
  heroImageUrl: DEFAULT_IMAGES.hero,
  welcomeTitle: 'Unwind... Explore... Experience Samalbong...',
  welcomeBody:
    'Samalbong Khasmahal (Sinji), roughly 21–30 km from Kalimpong town, is a serene offbeat mountain village bordered by rolling green hills, misty tea slopes, and orange gardens. Ideal for slow travel, bird watching, nature walks, family vacations, and corporate group retreats away from crowded tourist hubs.',
  welcomeImageUrl: DEFAULT_IMAGES.resortBuilding,
  experienceTitle: 'Nine curated Kalimpong viewpoints & ridge excursions from our doorstep.',
  experienceSubtitle:
    'From Lava View Point, Lolegaon, and Rishop to Panbu, Dubling, Ramdhura, Moonsung, Pala Waterfall, and Kalimpong heritage spots — best visited October to March.',
  diningTitle: 'In-house Multi-Cuisine Restaurant & Open-Air Tea / Coffee Bar.',
  diningSubtitle:
    'Choose flexible European (EP), Continental (CP), Modified American (MAP), or full-board American (AP) meal plans freshly prepared in our Samalbong kitchen.',
  diningImageUrl: DEFAULT_IMAGES.dining,
  ctaTitle: 'Plan your Samalbong stay or corporate group retreat.',
  ctaSubtitle:
    'We also welcome corporate tie-ups in our 50-seated conference room alongside 9 Double Bedded & 2 Four Bedded rooms.',
  aboutStoryTitle: 'The only 3-star property in Samalbong — Kanchenjunga views from every room.',
  aboutStoryBody:
    'Hosted warmly by Joy Banerjee & Prasanta Das, Cloud Valley Resort pairs 9 well-furnished Double Bedded rooms and 2 Four Bedded rooms with dedicated guest parking, drivers accommodation, selfie & Kanchenjunga view points, and group conference facilities.',
  aboutPhilosophy:
    'Where crisp mountain mornings meet slow travel — every guest wakes up to uninterrupted views of the snow-capped Mount Kanchenjunga range.',
};

const PublicDataContext = createContext<PublicDataContextValue>({
  settings: fallbackSettings,
  homeContent: fallbackHome,
  rooms: [],
  isLoading: true,
});

export function PublicDataProvider({ children }: { children: React.ReactNode }) {
  const settingsQuery = useQuery({
    queryKey: ['public', 'settings'],
    queryFn: api.getSettings,
    staleTime: 60_000,
  });

  const homeQuery = useQuery({
    queryKey: ['public', 'home-content'],
    queryFn: api.getHomeContent,
    staleTime: 60_000,
  });

  const roomsQuery = useQuery({
    queryKey: ['public', 'rooms'],
    queryFn: api.getRooms,
    staleTime: 60_000,
  });

  const pageSections = (homeQuery.data as PageContent | undefined)?.sections || {};
  const homeContent: HomeCMSContent = {
    ...fallbackHome,
    ...(pageSections as Partial<HomeCMSContent>),
  };

  return (
    <PublicDataContext.Provider
      value={{
        settings: settingsQuery.data || fallbackSettings,
        homeContent,
        rooms: roomsQuery.data || [],
        isLoading: settingsQuery.isLoading || roomsQuery.isLoading,
      }}
    >
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData() {
  return useContext(PublicDataContext);
}
