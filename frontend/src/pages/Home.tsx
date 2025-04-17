import {
  Phone,
  Mail,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react';

const Home = () => {
  return (
    <div>
      {/* Simplified Full-width Hero Section with background image */}
      <section className="relative w-full min-h-[700px] flex items-center overflow-hidden">
        {/* Background image that fills the entire section */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-background.svg"
            alt="Diverse ethnic minorities community event in Hong Kong"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <div className="space-y-8 relative text-white">
              <div className="inline-flex items-center px-4 py-2 bg-[#FFF9C4] text-gray-800 rounded-full text-sm font-medium shadow-sm">
                <span className="relative flex items-center">
                  <span className="flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A7E1] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A7E1]"></span>
                  </span>
                  New Platform Launch
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#FFE94E] to-[#FFD700]">
                    Events
                  </span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-[#00A7E1]/40 -z-0 transform -rotate-1"></span>
                </span>{' '}
                for Hong Kong's Ethnic Minorities
              </h2>

              <p className="text-gray-100 text-lg md:text-xl leading-relaxed">
                Discover, register, and participate in events designed to support and empower Hong
                Kong's ethnic minority communities.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="/events"
                  className="group bg-gradient-to-r from-[#FFE94E] to-[#FFD700] text-gray-900 font-medium px-8 py-4 rounded-full inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  Browse Events
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </a>
                <a
                  href="/register"
                  className="group text-white bg-white/10 backdrop-blur-sm border border-white/20 font-medium px-8 py-4 rounded-full hover:bg-white/20 inline-flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-6 md:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1.5 bg-[#E3F2FD] text-[#00A7E1] rounded-full text-sm font-medium mb-4">
              <span>Platform Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Our Platform Works
            </h2>
            <p className="text-gray-600 text-lg">
              A simple, accessible way to connect with events that matter to your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-14 h-14 bg-[#FFE94E] rounded-full flex items-center justify-center mb-6">
                <span className="font-bold text-xl text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Discover Events</h3>
              <p className="text-gray-600">
                Browse upcoming events specifically designed for Hong Kong's ethnic minority
                communities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-14 h-14 bg-[#FFE94E] rounded-full flex items-center justify-center mb-6">
                <span className="font-bold text-xl text-gray-900">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Register Easily</h3>
              <p className="text-gray-600">
                Simple registration process with multilingual support to ensure everyone can
                participate.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-14 h-14 bg-[#FFE94E] rounded-full flex items-center justify-center mb-6">
                <span className="font-bold text-xl text-gray-900">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Attend & Connect</h3>
              <p className="text-gray-600">
                Get reminders, directions, and connect with other attendees before, during, and
                after events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="w-full py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <div className="inline-flex items-center px-3 py-1.5 bg-[#E3F2FD] text-[#00A7E1] rounded-full text-sm font-medium mb-4">
                <span>What's Happening</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Upcoming Events</h2>
            </div>
            <a
              href="/events"
              className="group mt-4 md:mt-0 text-[#00A7E1] font-medium hover:text-[#0088c7] inline-flex items-center gap-1"
            >
              View All Events
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Card 1 - Career Workshop */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/career-workshop.svg"
                  alt="Career Workshop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Workshop
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">June 15, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">2:00 PM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Central, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Career Development Workshop
                </h3>
                <p className="text-gray-600 mb-5">
                  Join us for a workshop focused on career opportunities and skill development for
                  ethnic minorities.
                </p>
                <a
                  href="/events/career-workshop"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Event Card 2 - Community Gathering */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/community-gathering.svg"
                  alt="Community Gathering"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Community
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">June 22, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">11:00 AM - 3:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Kowloon Park, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Cultural Exchange Festival</h3>
                <p className="text-gray-600 mb-5">
                  A celebration of diverse cultures with food, performances, and activities for the
                  whole family.
                </p>
                <a
                  href="/events/cultural-festival"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Event Card 3 - Education Seminar */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/education-seminar.svg"
                  alt="Education Seminar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Education
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">July 5, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">10:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Wan Chai, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Education Access Seminar</h3>
                <p className="text-gray-600 mb-5">
                  Learn about educational opportunities and support systems available for ethnic
                  minority students.
                </p>
                <a
                  href="/events/education-seminar"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Event Card 4 - Language Workshop */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/language-workshop.svg"
                  alt="Language Workshop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Language
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">July 12, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">1:00 PM - 4:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Tsim Sha Tsui, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Cantonese Language Workshop
                </h3>
                <p className="text-gray-600 mb-5">
                  Practical Cantonese language skills for everyday life and work in Hong Kong.
                </p>
                <a
                  href="/events/language-workshop"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Event Card 5 - Health Seminar */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/health-seminar.svg"
                  alt="Health Seminar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Health
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">July 18, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">9:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Mong Kok, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Community Health Seminar</h3>
                <p className="text-gray-600 mb-5">
                  Free health checks and information on accessing healthcare services in Hong Kong.
                </p>
                <a
                  href="/events/health-seminar"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Event Card 6 - Networking Event */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group">
              <div className="relative h-52">
                <img
                  src="/images/events/networking-event.svg"
                  alt="Networking Event"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FFE94E] text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium">
                  Networking
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">July 25, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">6:00 PM - 9:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Admiralty, Hong Kong</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Professional Networking Night
                </h3>
                <p className="text-gray-600 mb-5">
                  Connect with professionals and employers from diverse industries across Hong Kong.
                </p>
                <a
                  href="/events/networking-night"
                  className="group inline-flex items-center text-[#00A7E1] font-medium gap-1"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 bg-[#00A7E1] text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
              <p className="text-xl opacity-90 mb-8">
                Stay updated on upcoming events and opportunities to support Hong Kong's ethnic
                minorities.
              </p>
              <div className="max-w-md mx-auto">
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-grow px-5 py-3.5 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-[#FFE94E]"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#FFE94E] text-gray-900 font-medium px-6 py-3.5 rounded-full hover:bg-[#FFE01A] transition-all shadow-sm hover:shadow"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Modern Footer with fixed contact section styling */}
      <footer className="w-full bg-gray-50 py-20 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="relative group mr-3">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFE94E] to-[#00A7E1] rounded-full opacity-70 blur-sm group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-white p-1 rounded-full overflow-hidden shadow-sm">
                    <img
                      src="/zubin-logo1.png"
                      alt="The Zubin Foundation"
                      width={40}
                      height={40}
                      className="h-auto rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">The Zubin Foundation</h3>
                  <p className="text-xs text-gray-500">Empowering Hong Kong's Ethnic Minorities</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Transforming the lives of Hong Kong's ethnic minorities through community support
                and advocacy.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-[#00A7E1]"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="Youtube"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-[#00A7E1]"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-[#00A7E1]"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-[#00A7E1]"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-5 text-gray-900 relative inline-block">
                Quick Links
                <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#FFE94E]"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>About Us</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Our Work</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Get Involved</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>News</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Contact</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-5 text-gray-900 relative inline-block">
                Events
                <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#00A7E1]"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Upcoming Events</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Past Events</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Host an Event</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Volunteer</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-[#00A7E1] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Sponsorship</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-5 text-gray-900 relative inline-block">
                Contact Us
                <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#FFE94E]"></span>
              </h3>
              <ul className="space-y-5">
                <li className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 text-[#00A7E1]" />
                  <div>
                    <p className="text-gray-600">+852 2540 9588 (General)</p>
                    <p className="text-gray-600">+852 9682 3100 (Helpline)</p>
                  </div>
                </li>
                <li className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-[#00A7E1]" />
                  <p className="text-gray-600">info@zubinfoundation.org</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} The Zubin Foundation. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-[#00A7E1] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#00A7E1] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#00A7E1] transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
