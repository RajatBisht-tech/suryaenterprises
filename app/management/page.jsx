// components/ManagementContent.jsx
import React from 'react';
import { Users, Award, Leaf, Target, HeartHandshake, Quote, ChevronRight } from 'lucide-react';

import PageHeader from "../components/shop/PageHeader";
const ManagementContent = () => {
  return (
    <main className="pb-3">
      <PageHeader eyebrow="Leadership Team" title="Meet Our Management" subtitle="Dedicated leaders driving innovation and agricultural excellence" image="/assets/images/handshake.jpg" crumbs={[{ label: "Management" }]} />

      {/* Main Content */}
      <div className="shell py-3">
        
        {/* Introduction */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
            <Award className="w-6 h-6 text-green-700" />
          </div>
          <h2 className="font-display text-[22px] md:text-2xl font-bold text-gray-900 mb-6">
            Our{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-700 to-emerald-600">
              Leadership
            </span>
          </h2>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            At SURYA ENTERPRISES, our success is a collective effort led by a dedicated and experienced management team. 
            Meet the individuals who drive our company&apos;s vision, innovation, and commitment to agricultural excellence.
          </p>
        </div>

        {/* CMD Section */}
        <div className="mb-20">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Left side - Message (takes 3 columns) */}
            <div className="md:col-span-3 relative">
              <div className="absolute -top-4 -left-4 text-6xl text-amber-200 opacity-50">&quot;</div>
              <div className="relative bg-white rounded-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Quote className="w-6 h-6 text-amber-500 mr-2" />
                  Message from CMD Desk
                </h3>
                
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>Dear Friends and Partners,</p>
                  <p>
                    I am delighted to welcome you to the digital home of SURYA ENTERPRISES, where we cultivate 
                    progress, nurture innovation, and empower a greener tomorrow. For over 12 years formerly known as 
                    &apos;Solar Crop Science&apos;, SURYA ENTERPRISES has stood as a beacon of agricultural excellence. Our journey,
                    rooted in dedication and driven by science, has led us to bring farmers the seeds, crop-care tools and
                    farm machinery that not only transform crops but also shape the landscape of modern farming.
                  </p>
                  <p>
                    I invite you to explore our website and discover a world of possibilities. From our meticulously 
                    crafted products to insightful agricultural resources, our platform is designed to be your companion 
                    in growth. Whether you&apos;re an experienced farmer, a novice cultivator, or an industry partner,
                    SURYA ENTERPRISES is here to support you at every step.
                  </p>
                  <p>
                    Thank you for being part of the SURYA ENTERPRISES family. Together, let&apos;s continue to cultivate excellence
                    and sow the seeds of prosperity.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="font-bold text-gray-800">Warm regards,</p>
                  <p className="text-lg font-semibold text-green-700">Sushil Dubey – CMD</p>
                </div>
              </div>
            </div>

            {/* Right side - Smaller Placeholder Image (takes 2 columns) */}
            <div className="md:col-span-2 relative">
              {/* Smaller Image Placeholder */}
              <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] max-w-[300px] mx-auto">
                <div className="h-2/3 bg-linear-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-green-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Photo</p>
                  </div>
                </div>
                <div className="h-1/3 bg-white p-4">
                  <h4 className="text-xl font-bold text-gray-800">Sushil Dubey</h4>
                  <p className="text-sm text-green-600 font-medium">Chairman & Managing Director</p>
                </div>
              </div>
              
              {/* Smaller decorative elements */}
              <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-amber-100 rounded-full -z-10"></div>
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-green-100 rounded-full -z-10"></div>
            </div>
          </div>
        </div>

        {/* CEO Section */}
        <div className="mb-20">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Left side - Smaller Placeholder Image (takes 2 columns) */}
            <div className="md:col-span-2 relative order-2 md:order-1">
              {/* Smaller Image Placeholder */}
              <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] max-w-[300px] mx-auto">
                <div className="h-2/3 bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-amber-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Photo</p>
                  </div>
                </div>
                <div className="h-1/3 bg-white p-4">
                  <h4 className="text-xl font-bold text-gray-800">Dharmraj Sinh Jadeja</h4>
                  <p className="text-sm text-green-600 font-medium">Director & CEO</p>
                </div>
              </div>
              
              {/* Smaller decorative elements */}
              <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-amber-100 rounded-full -z-10"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-100 rounded-full -z-10"></div>
            </div>

            {/* Right side - Message (takes 3 columns) */}
            <div className="md:col-span-3 relative order-1 md:order-2">
              <div className="absolute -top-4 -right-4 text-6xl text-amber-200 opacity-50">&quot;</div>
              <div className="relative bg-white rounded-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Quote className="w-6 h-6 text-amber-500 mr-2" />
                  Board of Directors
                </h3>
                
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    As CEO and Director, I&apos;m honoured to lead a team dedicated to delivering genuine seeds, crop-care
                    tools and farm machinery. With a deep understanding of the needs of farmers, we strive to provide
                    excellence, quality, and support in every product we offer.
                  </p>
                  <p>
                    Our vision extends beyond business – we&apos;re cultivating a greener, more prosperous future for
                    agriculture. Join us in this journey of growth, innovation, and empowerment. Together, let&apos;s sow
                    the seeds of success.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="font-bold text-gray-800">Best regards,</p>
                  <p className="text-lg font-semibold text-green-700">Dharmraj Sinh Jadeja</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Our Journey Section */}
        <div className="relative overflow-hidden rounded-lg bg-linear-to-r from-green-600 to-emerald-600 p-6 text-white mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-20 -mr-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -mb-6 -ml-16"></div>
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <HeartHandshake className="w-16 h-16 mx-auto mb-6 text-amber-300" />
            <h3 className="font-display text-[22px] md:text-2xl font-bold mb-4">Join Our Journey</h3>
            <p className="text-[15px] text-white/90 leading-relaxed">
              The leadership team at SURYA ENTERPRISES is united by a shared vision of agricultural progress 
              and sustainable growth. Together, we work tirelessly to bring innovative solutions to farmers, empower 
              communities, and shape the future of farming.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <button className="px-8 py-3 bg-white text-green-700 rounded-full font-semibold hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300 inline-flex items-center">
                Explore Careers
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
              <button className="px-8 py-3 bg-transparent text-white rounded-full font-semibold border-2 border-white hover:bg-white/10 transition-all duration-300">
                Contact Leadership
              </button>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-100 text-center">
            <Target className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800">Vision-Driven</h4>
            <p className="text-sm text-gray-500">Leading with purpose and clarity</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-100 text-center">
            <Leaf className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800">Sustainable Growth</h4>
            <p className="text-sm text-gray-500">Committed to green future</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-100 text-center">
            <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-800">Farmer First</h4>
            <p className="text-sm text-gray-500">Empowering farming communities</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ManagementContent;