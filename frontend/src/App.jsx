import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Gallery from './components/Gallery';
import About from './components/About';
import Reviews from './components/Reviews';
import ReservationContact from './components/ReservationContact';
import Footer from './components/Footer';
import AdminPanel from './components/Admin/AdminPanel';

function MainWebsite() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Menu />
        <Gallery />
        <About />
        <Reviews />
        <ReservationContact />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainWebsite />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
