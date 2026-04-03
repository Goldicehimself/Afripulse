import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import News from "./pages/News";
import Sports from "./pages/Sports";
import Entertainment from "./pages/Entertainment";
import PostDetails from "./pages/PostDetails";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminCreatePost from "./pages/AdminCreatePost";
import AdminManage from "./pages/AdminManage";
import Auth from "./pages/Auth";
import MatchDetails from "./pages/MatchDetails";
import Trending from "./pages/Trending";
import Predictions from "./pages/Predictions";
import Shorts from "./pages/Shorts";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="posts/:id" element={<PostDetails />} />
          <Route path="news" element={<News />} />
          <Route path="sports" element={<Sports />} />
          <Route path="entertainment" element={<Entertainment />} />
          <Route path="matches/:id" element={<MatchDetails />} />
          <Route path="trending" element={<Trending />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="shorts" element={<Shorts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="auth" element={<Auth />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin/create" element={<AdminCreatePost />} />
          <Route path="admin/manage" element={<AdminManage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
