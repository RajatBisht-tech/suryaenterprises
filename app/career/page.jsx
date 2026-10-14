// components/CareerContent.jsx
'use client';

import React, { useState } from 'react';
import { Users, Leaf, Target, HeartHandshake, ChevronRight, MapPin, Briefcase, Clock, Award, Sparkles, Filter, Search, TrendingUp, Globe, Zap } from 'lucide-react';

import PageHeader from "../components/shop/PageHeader";
const CareerContent = () => {
  const [selectedLocation, setSelectedLocation] = useState('All Job Location');
  const [selectedPosition, setSelectedPosition] = useState('All Opening Position');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);

  const locations = [
    'All Job Location',
    'Rajkot',
    'Chattisgarh',
    'Delhi',
    'Karnataka',
    'Madhya Pradesh',
    'Maharashtra',
    'Rajasthan',
    'Uttar Pradesh'
  ];

  const positions = [
    'All Opening Position',
    'Account Head',
    'Development Office',
    'Sales Officer',
    'Regional Manager',
    'Territory Manager'
  ];

  const jobOpenings = [
    {
      id: 1,
      title: 'Account Head',
      location: 'Rajkot',
      type: 'Full Time',
      experience: '5-8 years',
      description: 'Lead financial operations and strategic planning for our Rajkot office.',
      responsibilities: [
        'Manage financial planning and analysis',
        'Oversee budgeting and forecasting',
        'Ensure compliance with financial regulations',
        'Lead the accounting team'
      ],
      requirements: [
        'CA or MBA Finance',
        '5+ years of experience',
        'Strong leadership skills',
        'Experience in manufacturing industry preferred'
      ]
    },
    {
      id: 2,
      title: 'Development Office (DO)',
      location: ['Chattisgarh', 'Delhi', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
      type: 'Full Time',
      experience: '3-6 years',
      description: 'Drive business development and expand market presence across multiple states.',
      responsibilities: [
        'Identify new business opportunities',
        'Build relationships with distributors',
        'Develop market expansion strategies',
        'Coordinate with sales teams'
      ],
      requirements: [
        'MBA or equivalent',
        '3+ years in business development',
        'Strong communication skills',
        'Willingness to travel'
      ]
    },
    {
      id: 3,
      title: 'Sales Officer (SO)',
      location: ['Chattisgarh', 'Delhi', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
      type: 'Full Time',
      experience: '2-4 years',
      description: 'Drive sales growth and build strong relationships with dealers and farmers.',
      responsibilities: [
        'Achieve sales targets',
        'Manage dealer network',
        'Conduct farmer meetings',
        'Provide product demonstrations'
      ],
      requirements: [
        'BSc Agriculture / MBA',
        '2+ years in agri-inputs or farm-equipment sales',
        'Strong communication skills',
        'Valid driving license'
      ]
    },
    {
      id: 4,
      title: 'Regional Manager (RM)',
      location: ['Chattisgarh', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
      type: 'Full Time',
      experience: '8-12 years',
      description: 'Lead regional operations and drive strategic growth initiatives.',
      responsibilities: [
        'Manage regional P&L',
        'Lead and mentor teams',
        'Develop market strategies',
        'Ensure business growth'
      ],
      requirements: [
        'MBA with 8+ years experience',
        'Strong leadership skills',
        'Proven track record in sales',
        'Strategic thinking ability'
      ]
    },
    {
      id: 5,
      title: 'Territory Manager (TM)',
      location: ['Chattisgarh', 'Delhi', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
      type: 'Full Time',
      experience: '4-7 years',
      description: 'Manage territory sales and build strong distributor networks.',
      responsibilities: [
        'Achieve territory targets',
        'Manage channel partners',
        'Conduct market analysis',
        'Coordinate with marketing team'
      ],
      requirements: [
        'BSc Agriculture / MBA',
        '4+ years experience',
        'Strong negotiation skills',
        'Team management ability'
      ]
    }
  ];

  const benefits = [
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Growth Opportunities', description: 'Clear career progression paths' },
    { icon: <Award className="w-6 h-6" />, title: 'Performance Bonuses', description: 'Rewarding your success' },
    { icon: <HeartHandshake className="w-6 h-6" />, title: 'Health Insurance', description: 'Comprehensive coverage' },
    { icon: <Clock className="w-6 h-6" />, title: 'Flexible Hours', description: 'Work-life balance' },
    { icon: <Globe className="w-6 h-6" />, title: 'Travel Opportunities', description: 'Explore new places' },
    { icon: <Zap className="w-6 h-6" />, title: 'Training Programs', description: 'Continuous learning' }
  ];

  const filterJobs = () => {
    return jobOpenings.filter(job => {
      const positionMatch = selectedPosition === 'All Opening Position' || job.title.includes(selectedPosition);
      const locationMatch = selectedLocation === 'All Job Location' || 
        (Array.isArray(job.location) ? job.location.includes(selectedLocation) : job.location === selectedLocation);
      return positionMatch && locationMatch;
    });
  };

  const filteredJobs = filterJobs();

  return (
    <main className="pb-3">
      <PageHeader eyebrow="Join Our Team" title="Cultivate Your Career" subtitle="Grow with SURYA ENTERPRISES – Where innovation meets opportunity" image="/assets/images/career-banner.jpg" crumbs={[{ label: "Career" }]} />

      {/* Main Content */}
      <div className="shell py-3">
        
        {/* Join Our Team Section */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
            <Users className="w-6 h-6 text-green-700" />
          </div>
          <h2 className="font-display text-[22px] md:text-2xl font-bold text-gray-900 mb-6">
            Join Our Team and{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-700 to-emerald-600">
              Cultivate Your Career
            </span>
          </h2>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            At SURYA ENTERPRISES, we believe in nurturing not just crops, but also careers. We&apos;re on a mission to revolutionize
            agriculture through innovation, sustainability, and a commitment to excellence. If you&apos;re passionate about
            making a meaningful impact and growing with a dynamic team, we invite you to explore the exciting career 
            opportunities we have to offer.
          </p>
        </div>

        {/* Why Choose SURYA ENTERPRISES - Creative Cards */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-10">
            Why Choose <span className="text-green-600">SURYA ENTERPRISES?</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Innovation</h4>
              <p className="text-gray-600">Embrace cutting-edge technology and be part of a team that&apos;s shaping the future of agriculture.</p>
            </div>

            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Sustainability</h4>
              <p className="text-gray-600">Contribute to sustainable practices and solutions that enhance both farming and the environment.</p>
            </div>

            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Growth</h4>
              <p className="text-gray-600">Join a company that&apos;s growing rapidly and offers ample opportunities for professional advancement.</p>
            </div>

            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Collaboration</h4>
              <p className="text-gray-600">Work with industry experts and passionate professionals who share your enthusiasm.</p>
            </div>

            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Impact</h4>
              <p className="text-gray-600">Be a part of an organization that empowers farmers and contributes to food security.</p>
            </div>

            <div className="group bg-white p-6 rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all duration-300">
              <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 transition-transform">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Recognition</h4>
              <p className="text-gray-600">Your contributions are valued and celebrated with rewards and appreciation.</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-10">
            <span className="text-green-600">Benefits</span> & Perks
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all">
                <div className="text-green-600 mb-2 flex justify-center">{benefit.icon}</div>
                <h4 className="font-semibold text-gray-800 text-sm">{benefit.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Openings Section */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-100">
          
          {/* Section Header */}
          <div className="text-center mb-10">
            <h3 className="font-display text-[22px] md:text-2xl font-bold text-gray-800 mb-3">
              Current <span className="text-green-600">Openings</span>
            </h3>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Explore opportunities to grow with us and make a difference in agriculture
            </p>
          </div>

          {/* Filters - Creative Dropdown Design */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filter Dropdowns */}
            <div className={`flex flex-wrap gap-4 justify-center ${showFilters ? 'flex' : 'hidden md:flex'}`}>
              {/* Position Filter */}
              <div className="relative group">
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-full px-6 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:border-green-500 cursor-pointer hover:border-green-300 transition-colors"
                >
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Location Filter */}
              <div className="relative group">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-full px-6 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:border-green-500 cursor-pointer hover:border-green-300 transition-colors"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Search Button */}
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Jobs
              </button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-500 mb-4 text-center">
            Found <span className="font-bold text-green-600">{filteredJobs.length}</span> job openings
          </p>

          {/* Job Listings - Creative Cards */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all">
                {/* Job Header - Always Visible */}
                <div 
                  className="bg-white p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h4>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4 text-green-600" />
                          {Array.isArray(job.location) ? `${job.location.length} Locations` : job.location}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Briefcase className="w-4 h-4 text-green-600" />
                          {job.type}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4 text-green-600" />
                          {job.experience}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                        More Details
                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedJob === job.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedJob === job.id && (
                  <div className="bg-gray-50 p-6 border-t border-gray-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Responsibilities */}
                      <div>
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-600" />
                          Responsibilities
                        </h5>
                        <ul className="space-y-2">
                          {job.responsibilities.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-600">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-green-600" />
                          Requirements
                        </h5>
                        <ul className="space-y-2">
                          {job.requirements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-600">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Locations if multiple */}
                    {Array.isArray(job.location) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          Available Locations
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {job.location.map((loc, idx) => (
                            <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply Button */}
                    <div className="mt-6 text-center">
                      <button className="bg-linear-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] transition-all">
                        Apply for {job.title}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-700 mb-2">No jobs found</h4>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">Don&apos;t see the right fit? Send us your resume anyway</p>
          <button className="px-8 py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-full font-semibold hover:shadow-[0_4px_16px_rgba(20,33,26,0.10)] hover:shadow-green-200 transition-all duration-300">
            Submit Your Resume
          </button>
        </div>
      </div>
    </main>
  );
};

export default CareerContent;