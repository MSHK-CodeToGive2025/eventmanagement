// Mock events data with status field
export const allEvents = [
    {
      id: "1",
      title: "Career Workshop for Ethnic Minorities",
      description:
        "A workshop designed to help ethnic minorities in Hong Kong develop career skills and find employment opportunities.",
      longDescription:
        "This comprehensive workshop is specifically designed to address the unique challenges faced by ethnic minorities in Hong Kong's job market. Participants will learn essential skills including resume writing, interview techniques, networking strategies, and workplace communication. The workshop will also cover understanding local work culture and navigating potential discrimination. Our experienced career counselors, who understand the specific barriers faced by ethnic minorities, will provide personalized guidance and support. This workshop aims to empower participants with the knowledge, skills, and confidence needed to secure meaningful employment opportunities in Hong Kong.",
      date: "2025-06-15",
      time: "14:00 - 17:00",
      location: "Wan Chai Community Center",
      address: "28 Harbour Road, Wan Chai, Hong Kong",
      image: "/placeholder.svg?key=tsrrw",
      category: "Workshop",
      status: "Published",
      targetAudience: "Ethnic minorities seeking employment",
      registrations: 12,
      capacity: 50,
      organizer: "The Zubin Foundation",
      speakers: [
        {
          name: "Sarah Wong",
          title: "Career Development Specialist",
          bio: "Sarah has over 10 years of experience helping minorities navigate the job market in Hong Kong.",
        },
        {
          name: "Raj Patel",
          title: "HR Consultant",
          bio: "Raj works with major corporations to improve diversity and inclusion in hiring practices.",
        },
      ],
      schedule: [
        {
          time: "14:00 - 14:30",
          title: "Introduction and Overview",
          description: "Welcome and introduction to the workshop objectives and schedule.",
        },
        {
          time: "14:30 - 15:30",
          title: "Resume Building and Interview Skills",
          description: "Learn how to create an effective resume and prepare for job interviews.",
        },
        {
          time: "15:30 - 15:45",
          title: "Break",
          description: "Refreshments will be provided.",
        },
        {
          time: "15:45 - 16:30",
          title: "Networking and Job Search Strategies",
          description: "Techniques for finding job opportunities and building professional networks.",
        },
        {
          time: "16:30 - 17:00",
          title: "Q&A and Individual Consultations",
          description: "Opportunity to ask questions and receive personalized advice.",
        },
      ],
      requirements: [
        "Bring a copy of your current resume if you have one",
        "Notebook and pen for taking notes",
        "Any relevant work permits or documentation",
      ],
      faqs: [
        {
          question: "Do I need to speak Cantonese to attend?",
          answer:
            "No, the workshop will be conducted in English. Translators for other languages can be arranged if requested in advance.",
        },
        {
          question: "Is there a fee to attend?",
          answer: "No, this workshop is provided free of charge by The Zubin Foundation.",
        },
        {
          question: "Will there be job placement services?",
          answer:
            "While we don't offer direct job placement, we will provide resources and connections to organizations that do.",
        },
      ],
    },
    {
      id: "2",
      title: "Cultural Exchange Festival",
      description: "Celebrate the diverse cultures of Hong Kong's ethnic minorities through food, music, dance, and art.",
      longDescription:
        "Join us for a vibrant celebration of Hong Kong's diverse cultural landscape at our annual Cultural Exchange Festival. This day-long event brings together communities from across Hong Kong to share and experience the rich traditions, cuisines, arts, and performances of various ethnic minority groups. Visitors can explore colorful cultural booths, taste authentic cuisine from around the world, watch traditional dance and music performances, and participate in interactive workshops. The festival aims to foster greater understanding and appreciation of the cultural diversity that enriches Hong Kong society, while providing a platform for ethnic minority communities to showcase their heritage with pride. This family-friendly event welcomes people of all backgrounds to join in the celebration of our multicultural city.",
      date: "2025-07-22",
      time: "11:00 - 20:00",
      location: "Victoria Park, Causeway Bay",
      address: "1 Hing Fat Street, Causeway Bay, Hong Kong",
      image: "/vibrant-cultural-festival.png",
      category: "Festival",
      status: "Published",
      targetAudience: "All Hong Kong residents",
      registrations: 78,
      capacity: 500,
      organizer: "The Zubin Foundation",
      schedule: [
        {
          time: "11:00 - 11:30",
          title: "Opening Ceremony",
          description: "Welcome speeches and traditional blessing ceremonies.",
        },
        {
          time: "11:30 - 14:00",
          title: "Cultural Performances",
          description: "Traditional dances, music, and performances from various ethnic communities.",
        },
        {
          time: "14:00 - 17:00",
          title: "Food Festival",
          description: "Sample cuisines from around the world prepared by local community members.",
        },
        {
          time: "17:00 - 19:00",
          title: "Art and Craft Workshops",
          description: "Interactive sessions teaching traditional crafts and art forms.",
        },
        {
          time: "19:00 - 20:00",
          title: "Closing Celebration",
          description: "Final performances and community dance.",
        },
      ],
      faqs: [
        {
          question: "Is registration required to attend?",
          answer:
            "General admission does not require registration, but some workshops have limited capacity and require pre-registration.",
        },
        {
          question: "Is the event family-friendly?",
          answer: "Yes, there are activities suitable for all ages, including a dedicated children's area.",
        },
        {
          question: "What happens if it rains?",
          answer:
            "The event has both indoor and outdoor components. In case of rain, outdoor activities will be moved to covered areas when possible.",
        },
      ],
    },
    {
      id: "3",
      title: "Language Learning Program",
      description:
        "Free Cantonese classes for non-Chinese speaking residents to improve integration and employment prospects.",
      longDescription:
        "Our Language Learning Program offers comprehensive Cantonese language instruction specifically designed for non-Chinese speaking residents of Hong Kong. These free classes aim to break down language barriers that often prevent full integration into Hong Kong society and limit employment opportunities. The curriculum focuses on practical, everyday Cantonese that participants can immediately use in their daily lives, from shopping and using public transportation to workplace communication. Classes are taught by experienced language instructors who understand the unique challenges faced by adult learners from diverse linguistic backgrounds. With small class sizes and personalized attention, learners of all levels can progress at their own pace. By improving Cantonese language skills, participants can enhance their employment prospects, better navigate daily life in Hong Kong, and connect more deeply with the local community.",
      date: "2025-08-05",
      time: "10:00 - 12:00",
      location: "Zubin Foundation Office, Wan Chai",
      address: "5/F, Unit 501, Kai Tak Commercial Building, 317-319 Des Voeux Road Central, Hong Kong",
      image: "/placeholder.svg?key=4l7bf",
      category: "Education",
      status: "Published",
      targetAudience: "Non-Chinese speaking residents",
      registrations: 25,
      capacity: 30,
      organizer: "The Zubin Foundation",
      schedule: [
        {
          time: "10:00 - 10:15",
          title: "Welcome and Introduction",
          description: "Overview of the program and learning objectives.",
        },
        {
          time: "10:15 - 11:00",
          title: "Basic Conversation Practice",
          description: "Learning and practicing everyday conversational phrases.",
        },
        {
          time: "11:00 - 11:15",
          title: "Break",
          description: "Short break with refreshments.",
        },
        {
          time: "11:15 - 12:00",
          title: "Practical Application",
          description: "Role-playing real-life scenarios using learned phrases.",
        },
      ],
      requirements: [
        "Notebook and pen",
        "Commitment to attend at least 80% of the classes",
        "Willingness to practice outside of class time",
      ],
      faqs: [
        {
          question: "Do I need any prior knowledge of Cantonese?",
          answer: "No, we offer classes for complete beginners as well as those with some prior knowledge.",
        },
        {
          question: "How long is the program?",
          answer: "The program runs for 10 weeks, with classes held twice a week.",
        },
        {
          question: "Will I receive a certificate upon completion?",
          answer: "Yes, participants who attend at least 80% of the classes will receive a certificate of completion.",
        },
      ],
    },
    {
      id: "4",
      title: "Health Awareness Seminar",
      description: "Information session on healthcare access and services available for ethnic minority communities.",
      longDescription:
        "This Health Awareness Seminar is designed to address the specific healthcare challenges faced by ethnic minority communities in Hong Kong. Many members of these communities encounter barriers when accessing healthcare services, including language difficulties, lack of culturally sensitive care, and limited knowledge about available resources. Our seminar brings together healthcare professionals, community workers, and representatives from public health services to provide clear, practical information about navigating Hong Kong's healthcare system. Topics covered include how to register for public healthcare services, understanding patient rights, accessing interpretation services, managing chronic conditions, preventive healthcare, and mental health resources. Participants will receive multilingual information packets and have the opportunity to ask questions directly to healthcare providers. By improving knowledge about and access to healthcare services, we aim to promote better health outcomes for ethnic minority communities.",
      date: "2025-09-10",
      time: "15:00 - 17:30",
      location: "Kwun Tong Community Hall",
      address: "17 Tsui Ping Road, Kwun Tong, Kowloon, Hong Kong",
      image: "/placeholder.svg?key=8wami",
      category: "Seminar",
      status: "Published",
      targetAudience: "Ethnic minority communities",
      registrations: 45,
      capacity: 100,
      organizer: "The Zubin Foundation",
      speakers: [
        {
          name: "Dr. Anita Chan",
          title: "Public Health Specialist",
          bio: "Dr. Chan has worked extensively with underserved communities to improve healthcare access.",
        },
        {
          name: "Meera Sharma",
          title: "Community Health Worker",
          bio: "Meera specializes in helping South Asian communities navigate the Hong Kong healthcare system.",
        },
        {
          name: "John Wong",
          title: "Hospital Authority Representative",
          bio: "John works on diversity and inclusion initiatives within the Hospital Authority.",
        },
      ],
      schedule: [
        {
          time: "15:00 - 15:20",
          title: "Introduction to Hong Kong's Healthcare System",
          description: "Overview of public and private healthcare options.",
        },
        {
          time: "15:20 - 15:50",
          title: "Accessing Public Health Services",
          description: "How to register, make appointments, and use public clinics and hospitals.",
        },
        {
          time: "15:50 - 16:20",
          title: "Healthcare Rights and Interpretation Services",
          description: "Understanding patient rights and how to access language support.",
        },
        {
          time: "16:20 - 16:40",
          title: "Break",
          description: "Refreshments and networking.",
        },
        {
          time: "16:40 - 17:10",
          title: "Preventive Healthcare and Chronic Disease Management",
          description: "Information on screenings, vaccinations, and managing ongoing health conditions.",
        },
        {
          time: "17:10 - 17:30",
          title: "Q&A Session",
          description: "Opportunity to ask questions to the panel of healthcare professionals.",
        },
      ],
      faqs: [
        {
          question: "Will there be interpreters available at the seminar?",
          answer:
            "Yes, we will provide interpretation in Urdu, Hindi, Nepali, and Filipino. Please let us know if you need interpretation in another language.",
        },
        {
          question: "Can I bring my children?",
          answer:
            "Yes, there will be a supervised children's area with activities so parents can focus on the seminar content.",
        },
        {
          question: "Will there be one-on-one consultations available?",
          answer:
            "After the main seminar, healthcare professionals will be available for brief individual questions, but not for medical consultations.",
        },
      ],
    },
    {
      id: "5",
      title: "Youth Leadership Program",
      description: "Empowering young people from ethnic minority backgrounds to become community leaders.",
      longDescription:
        "The Youth Leadership Program is a transformative initiative designed to nurture the next generation of leaders from Hong Kong's ethnic minority communities. This comprehensive program targets young people aged 16-24, providing them with the skills, knowledge, and networks needed to become effective community advocates and leaders. Through a combination of workshops, mentoring, project-based learning, and community engagement, participants develop critical leadership competencies including public speaking, project management, team building, conflict resolution, and advocacy. The program places special emphasis on helping young people navigate their dual cultural identities and leverage their unique perspectives as strengths. Participants work in teams to identify community challenges and develop practical solutions, culminating in community action projects that they implement with guidance from experienced mentors. By investing in young leaders from diverse backgrounds, this program aims to create a more inclusive Hong Kong where all voices are represented in community decision-making.",
      date: "2025-10-01",
      time: "09:00 - 16:00",
      location: "Youth Center, Tsim Sha Tsui",
      address: "27 Nathan Road, Tsim Sha Tsui, Kowloon, Hong Kong",
      image: "/placeholder.svg?key=bsyi7",
      category: "Workshop",
      status: "Published",
      targetAudience: "Youth from ethnic minority backgrounds",
      registrations: 18,
      capacity: 40,
      organizer: "The Zubin Foundation",
      speakers: [
        {
          name: "Priya Sharma",
          title: "Community Organizer",
          bio: "Priya has extensive experience working with youth leadership programs.",
        },
        {
          name: "David Lee",
          title: "Public Speaking Coach",
          bio: "David specializes in helping young people develop their public speaking skills.",
        },
      ],
      schedule: [
        {
          time: "09:00 - 09:30",
          title: "Welcome and Introduction",
          description: "Overview of the program and icebreaker activities.",
        },
        {
          time: "09:30 - 10:30",
          title: "Leadership Fundamentals",
          description: "Interactive workshop on core leadership principles and styles.",
        },
        {
          time: "10:30 - 11:00",
          title: "Break",
          description: "Refreshments and networking.",
        },
        {
          time: "11:00 - 12:30",
          title: "Public Speaking Workshop",
          description: "Developing confidence and skills in public speaking.",
        },
        {
          time: "12:30 - 13:30",
          title: "Lunch",
          description: "Provided for all participants.",
        },
        {
          time: "13:30 - 15:00",
          title: "Project Planning",
          description: "Working in teams to develop community action plans.",
        },
        {
          time: "15:00 - 16:00",
          title: "Mentorship Session",
          description: "Meeting with assigned mentors to discuss goals and plans.",
        },
      ],
      requirements: [
        "Aged 16-24 from an ethnic minority background",
        "Commitment to attend all program sessions",
        "Interest in community leadership",
        "Parental consent form for participants under 18",
      ],
      faqs: [
        {
          question: "How long does the program run?",
          answer: "The program runs for 12 weeks, with weekly sessions held on Saturdays.",
        },
        {
          question: "Is there a cost to participate?",
          answer: "No, the program is offered free of charge to eligible participants.",
        },
        {
          question: "Will I receive a certificate?",
          answer:
            "Yes, participants who complete the program will receive a leadership certificate and reference letter.",
        },
      ],
    },
  ]
  
  // Add this function at the end of the file, before the export of getEventById
  const normalizeEvent = (event: any) => {
    return {
      ...event,
      categories: event.categories || [event.category].filter(Boolean),
      schedule: event.schedule || [],
      speakers: event.speakers || [],
      registeredAttendees: event.registrations || 0,
      startDate: event.date,
      endDate: event.date,
      startTime: event.time ? event.time.split(" - ")[0] : "00:00",
      endTime: event.time ? event.time.split(" - ")[1] : "00:00",
      registrationOpen: true,
    }
  }
  
  // Update the getEventById function to normalize the event data
  export const getEventById = async (id: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  
    const event = allEvents.find((event) => event.id === id)
    return event ? normalizeEvent(event) : null
  }
  