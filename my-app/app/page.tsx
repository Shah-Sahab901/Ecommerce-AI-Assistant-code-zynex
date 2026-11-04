import react from 'react';
import Navbar from '@/app/Components/Navbar';
import Hero from './Components/Hero';
import SaleSection from './Components/Promotion';
import ReadyToWear from './Components/Grid';
import CategoryGrid from './Components/CategoryGrid';
import Trending from './Components/Trending';
import Call from './Call/page';
import WorldOfInspiration from './Components/Inspiration';
import InspirationLooks from './Components/InspirationWorld';
import Footer from './Components/Footer';
import WorldPic from "@/app/WorldPic/page"
import VoiceAssistant from './Components/VoiceAssistant';
const Page = () => {
  return (
    <div>
    

         <Navbar /> 
         <Hero />
         <SaleSection />
         <ReadyToWear />
         <CategoryGrid />
         <Trending />
         <Call />
         <WorldOfInspiration />
         <InspirationLooks />
         <Footer />
         <VoiceAssistant />
         

      
    </div>
  );
};

export default Page;