export type Lang = "en" | "fr" | "he";

export interface Resource {
  record_id: string;
  slug: string;
  record_type: string;
  category: string;
  subcategory: string | null;
  name_en: string | null;
  name_he: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  description_he?: string | null;
  audience: string | null;
  priority: string | null;
  scope: string | null;
  city: string | null;
  neighborhood: string | null;
  address_en: string | null;
  address_he: string | null;
  is_raanana: boolean;
  is_physical_location: boolean;
  phone_primary: string | null;
  phone_secondary: string | null;
  whatsapp_sms: string | null;
  email: string | null;
  languages: string | null;
  service_type: string | null;
  denomination_nusach: string | null;
  kosher_status: string | null;
  website_url: string | null;
  action_url: string | null;
  menu_order_url: string | null;
  google_maps_location_url: string | null;
  latitude_est: number | null;
  longitude_est: number | null;
  coordinate_confidence: string | null;
  distance_from_home_km_est: number | null;
  walking_time_from_home_min_est: number | null;
  driving_time_from_home_min_est_off_peak: number | null;
  distance_from_home_display: string | null;
  travel_estimate_status: string | null;
  availability_hours_note: string | null;
  /** Structured weekly hours: days 0=Sun..6=Sat, times "HH:MM". */
  hours_structured?: { days: number[]; open: string; close: string }[] | null;
  /**
   * Weekdays (0=Sun..6=Sat) the place is known to be shut — e.g. a kosher
   * supermarket on Shabbat. Recorded separately from opening hours so a
   * closure can be stated without inventing the rest of the week.
   */
  closed_days?: number[] | null;
  eligibility_requirements: string | null;
  cost_fee_notes: string | null;
  delivery_coverage: string | null;
  search_aliases: string | null;
  tags: string | null;
  search_text: string | null;
  source_url_primary: string | null;
  source_url_secondary: string | null;
  source_type: string | null;
  verification_status: string | null;
  last_verified: string | null;
  recommended_review_days: number | null;
  data_confidence: string | null;
  notes: string | null;
}

export interface AppMeta {
  dataset_name: string;
  generated_on: string;
  record_count: number;
  languages: Lang[];
  home_default: { lat: number; lng: number; label: string };
  install_first: string[];
  emergency_strip: string[];
  categories: string[];
  record_types: string[];
  privacy_note: string;
  distance_method: {
    walking_route_factor: number;
    walking_speed_kmh: number;
    driving_route_factor: number;
    driving_speed_kmh: number;
    driving_overhead_minutes: number;
    note?: string;
  } | null;
}

export interface HomePin {
  lat: number;
  lng: number;
}
