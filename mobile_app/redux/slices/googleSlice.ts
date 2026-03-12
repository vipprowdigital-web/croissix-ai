// mobile_app\redux\slices\googleSlice.ts

// mobile_app/redux/slices/googleSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GoogleStats {
  totalReviews:      number;
  repliedReviews:    number;
  unrepliedReviews:  number;
  avgRating:         number;
  totalPosts:        number;
  livePosts:         number;
  eventPosts:        number;
  offerPosts:        number;
  updatePosts:       number;
  totalImpressions:  number;
  totalCalls:        number;
  totalWebsite:      number;
  totalDirections:   number;
}

interface GoogleLocation {
  name?:             string;
  title?:            string;
  storeCode?:        string;
  languageCode?:     string;
  profile?:          { description?: string };
  phoneNumbers?:     { primaryPhone?: string; additionalPhones?: string[] };
  websiteUri?:       string;
  categories?:       {
    primaryCategory?:    { name?: string; displayName?: string };
    additionalCategories?: { name?: string; displayName?: string }[];
  };
  storefrontAddress?:  Record<string, unknown>;
  latlng?:             { latitude?: number; longitude?: number };
  openInfo?:           { status?: string; openingDate?: Record<string, unknown> };
  regularHours?:       { periods?: unknown[] };
  specialHours?:       Record<string, unknown>;
  moreHours?:          unknown[];
  serviceArea?:        Record<string, unknown>;
  serviceItems?:       unknown[];
  labels?:             string[];
  relationshipData?:   Record<string, unknown>;
}

interface GoogleState {
  stats:             GoogleStats | null;
  location:          GoogleLocation | null;
  locationFetchedAt: number | null;   // ms timestamp — for cache invalidation
  updating:          boolean;
}

const initialState: GoogleState = {
  stats:             null,
  location:          null,
  locationFetchedAt: null,
  updating:          false,
};

const googleSlice = createSlice({
  name: "google",
  initialState,
  reducers: {
    setGoogleStats(state, action: PayloadAction<GoogleStats>) {
      state.stats = action.payload;
    },
    clearGoogleStats(state) {
      state.stats = null;
    },

    setGoogleLocation(state, action: PayloadAction<GoogleLocation>) {
      state.location          = action.payload;
      state.locationFetchedAt = Date.now();
    },
    clearGoogleLocation(state) {
      state.location          = null;
      state.locationFetchedAt = null;
    },
    patchGoogleLocation(state, action: PayloadAction<Partial<GoogleLocation>>) {
      // Optimistic partial update — merge only changed fields
      if (state.location) {
        state.location = { ...state.location, ...action.payload };
      }
    },

    setUpdating(state, action: PayloadAction<boolean>) {
      state.updating = action.payload;
    },

    clearGoogle(state) {
      state.stats             = null;
      state.location          = null;
      state.locationFetchedAt = null;
      state.updating          = false;
    },
  },
});

export const {
  setGoogleStats, clearGoogleStats,
  setGoogleLocation, clearGoogleLocation, patchGoogleLocation,
  setUpdating,
  clearGoogle,
} = googleSlice.actions;

export default googleSlice.reducer;