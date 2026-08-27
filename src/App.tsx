import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { CategoryPage } from "./pages/Category";
import { RecordPage } from "./pages/Record";
import { MapPage } from "./pages/Map";
import { FavoritesPage } from "./pages/Favorites";
import { EmergencyPage } from "./pages/Emergency";
import { ChecklistsPage } from "./pages/Checklists";
import { GlossaryPage } from "./pages/Glossary";
import { ShareKitPage } from "./pages/ShareKit";
import { SettingsPage } from "./pages/Settings";
import { MorePage } from "./pages/More";
import { HubPage } from "./pages/Hub";
import { FoodPage } from "./pages/Food";
import { FolderPage } from "./pages/Folder";
import { AskPage } from "./pages/Ask";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/d/:slug" element={<FolderPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/c/:slug" element={<CategoryPage />} />
        <Route path="/e/:slug" element={<RecordPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/saved" element={<FavoritesPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/checklists" element={<ChecklistsPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/share" element={<ShareKitPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/hub/:id" element={<HubPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
