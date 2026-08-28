import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { CategoryPage } from "./pages/Category";
import { RecordPage } from "./pages/Record";
import { FavoritesPage } from "./pages/Favorites";
import { EmergencyPage } from "./pages/Emergency";
import { ChecklistsPage } from "./pages/Checklists";
import { GlossaryPage } from "./pages/Glossary";
import { ShareKitPage } from "./pages/ShareKit";
import { HubPage } from "./pages/Hub";
import { FoodPage } from "./pages/Food";
import { FolderPage } from "./pages/Folder";

// Heavy routes load on demand: Map/Settings pull Leaflet, Ask pulls the AI
// SDK, Shabbat pulls the Hebrew calendar.
const MapPage = lazy(() => import("./pages/Map").then((m) => ({ default: m.MapPage })));
const AskPage = lazy(() => import("./pages/Ask").then((m) => ({ default: m.AskPage })));
const ShabbatPage = lazy(() => import("./pages/Shabbat").then((m) => ({ default: m.ShabbatPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));

function Defer({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="empty" aria-hidden="true" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/d/:slug" element={<FolderPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/ask" element={<Defer><AskPage /></Defer>} />
        <Route path="/c/:slug" element={<CategoryPage />} />
        <Route path="/e/:slug" element={<RecordPage />} />
        <Route path="/map" element={<Defer><MapPage /></Defer>} />
        <Route path="/saved" element={<FavoritesPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/shabbat" element={<Defer><ShabbatPage /></Defer>} />
        <Route path="/checklists" element={<ChecklistsPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/share" element={<ShareKitPage />} />
        <Route path="/settings" element={<Defer><SettingsPage /></Defer>} />
        <Route path="/hub/:id" element={<HubPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
