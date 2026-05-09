import { Route, Routes } from "react-router-dom"
import Home from "./Pages/Home"
import NotFound from "./Pages/NotFound"
import ArrDeadQueueRemover from "./Pages/ArrDeadQueueRemover"
import QbitMirror from "./Pages/QbitMirror"
import QbitIpBlockList from "./Pages/QbitIpBlockList"
import Layout from "./Layout/Index"
import Login from "./Pages/Login"
import { ProtectedRoute, GuestRoute } from "./RouteElements"
import Settings from "./Pages/Settings"

function App() {
    return (
        <Routes>
            <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/arrdeadqueueremover" element={<ArrDeadQueueRemover />} />
                    <Route path="/qbitipblocklist" element={<QbitIpBlockList />} />
                    <Route path="/qbitmirror" element={<QbitMirror />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Route>
        </Routes>
    )
}

export default App
