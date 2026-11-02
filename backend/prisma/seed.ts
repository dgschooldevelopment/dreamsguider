import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DreamsGuider database seeding...');

  // Clear existing data in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 1. Create Admin and Students
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'DreamsGuider Admin',
      email: 'admin@dreamsguider.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 98765 43210',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: studentPassword,
      role: 'STUDENT',
      phone: '+91 91234 56789',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patil',
      email: 'priya@gmail.com',
      password: studentPassword,
      role: 'STUDENT',
      phone: '+91 92345 67890',
    },
  });

  const sachin = await prisma.user.create({
    data: {
      name: 'Sachin Kadam',
      email: 'sachin@gmail.com',
      password: studentPassword,
      role: 'STUDENT',
      phone: '+91 93456 78901',
    },
  });

  console.log('👤 Created users: 1 Admin, 3 Students');

  // 2. Create Course 1: Full Stack Web Development
  const course1 = await prisma.course.create({
    data: {
      title: 'Full Stack Web Development Masterclass (MERN & Next.js)',
      slug: 'full-stack-web-development-masterclass',
      description: 'Master frontend and backend development from scratch. Learn HTML, CSS, JavaScript ES6+, React, Node.js, Express, and Database design with real-world projects.',
      category: 'Web Development',
      level: 'All Levels',
      duration: '45 Hours',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Introduction & Web Fundamentals',
            description: 'Getting started with web architecture, modern tooling, and semantic markup.',
            order: 1,
            topics: {
              create: [
                {
                  title: '1. Welcome to DreamsGuider & Course Overview',
                  description: 'Introduction to course structure, Discord community, and developer roadmap.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  videoType: 'url',
                  duration: 600,
                  order: 1,
                  notes: 'Welcome students! Here is our syllabus overview and link to course Discord channel.',
                },
                {
                  title: '2. HTML5 Semantic Layouts & Forms',
                  description: 'Deep dive into accessible HTML, forms, input types, and SEO meta tags.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                  videoType: 'url',
                  duration: 1200,
                  order: 2,
                  notes: 'Semantic HTML helps screen readers and search engines understand page structure.',
                },
                {
                  title: '3. CSS3 Flexbox & Modern Grid System',
                  description: 'Learn flex directions, alignments, auto-fit grid layouts, and responsive media queries.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                  videoType: 'url',
                  duration: 1500,
                  order: 3,
                  notes: 'Key rule: Use Flexbox for 1-dimensional layouts and CSS Grid for 2-dimensional layouts.',
                },
              ],
            },
          },
          {
            title: 'Module 2: JavaScript & Modern ES6+ Deep Dive',
            description: 'Core concepts of JavaScript, closures, async programming, and fetch API.',
            order: 2,
            topics: {
              create: [
                {
                  title: '4. Variables, Scopes, Closures & Execution Context',
                  description: 'Understanding how JS works behind the scenes, call stack, and memory heap.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                  videoType: 'url',
                  duration: 1800,
                  order: 1,
                  notes: 'Closures give you access to an outer function scope from an inner function.',
                },
                {
                  title: '5. Promises, Async/Await and Error Handling',
                  description: 'Handling asynchronous workflows, try/catch blocks, and network requests.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                  videoType: 'url',
                  duration: 2100,
                  order: 2,
                  notes: 'Always wrap async calls in try/catch or handle promise rejections cleanly.',
                },
              ],
            },
          },
          {
            title: 'Module 3: React.js & Frontend State Mastery',
            description: 'Building modern reactive single page applications with React, Hooks, and Tailwind CSS.',
            order: 3,
            topics: {
              create: [
                {
                  title: '6. React Components, Props & useState Hook',
                  description: 'Component architecture, passing props, and state-driven UI rerendering.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
                  videoType: 'url',
                  duration: 2400,
                  order: 1,
                  notes: 'Never mutate state directly. Always use the setState updater.',
                },
                {
                  title: '7. useEffect, Custom Hooks & API Integration',
                  description: 'Lifecycle hooks, dependency array rules, and building custom fetch hooks.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                  videoType: 'url',
                  duration: 2200,
                  order: 2,
                  notes: 'Remember to clean up event listeners and timers in useEffect return function.',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Create Course 2: Python Programming & AI Automation
  const course2 = await prisma.course.create({
    data: {
      title: 'Python Programming & AI Automation Bootcamp',
      slug: 'python-programming-ai-automation',
      description: 'Learn Python from foundational syntax to writing web scrapers, data pipelines, and integrating AI LLMs like OpenAI & Gemini into custom applications.',
      category: 'Data Science & AI',
      level: 'Beginner to Intermediate',
      duration: '30 Hours',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Python Core Foundations',
            description: 'Data types, control structures, functions, and file handling.',
            order: 1,
            topics: {
              create: [
                {
                  title: '1. Installing Python, Virtual Environments & VS Code',
                  description: 'Setting up Python 3.12, pip, and creating isolated virtual environments.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                  videoType: 'url',
                  duration: 900,
                  order: 1,
                  notes: 'Best practice: Always use python -m venv .venv for each project.',
                },
                {
                  title: '2. Python Lists, Dictionaries & List Comprehensions',
                  description: 'Mastering idiomatic Python collections and transformations.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
                  videoType: 'url',
                  duration: 1400,
                  order: 2,
                  notes: 'List comprehensions provide a concise way to create lists based on existing lists.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Automation with Beautiful Soup & APIs',
            description: 'Web scraping, parsing HTML data, and building scheduled bots.',
            order: 2,
            topics: {
              create: [
                {
                  title: '3. Scraping Live Websites with Beautiful Soup & Requests',
                  description: 'Extracting data, handling headers, user-agents, and saving data to CSV/JSON.',
                  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                  videoType: 'url',
                  duration: 1800,
                  order: 1,
                  notes: 'Respect robots.txt and add rate limiting delays to avoid getting IP blocked.',
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('📚 Created 2 comprehensive courses with modules & topics');

  // 4. Enroll Students
  // Rahul enrolled in Course 1
  await prisma.enrollment.create({
    data: {
      userId: rahul.id,
      courseId: course1.id,
      status: 'ACTIVE',
    },
  });

  // Priya enrolled in Course 1 and Course 2
  await prisma.enrollment.create({
    data: {
      userId: priya.id,
      courseId: course1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: priya.id,
      courseId: course2.id,
      status: 'ACTIVE',
    },
  });

  // Sachin enrolled in Course 2
  await prisma.enrollment.create({
    data: {
      userId: sachin.id,
      courseId: course2.id,
      status: 'ACTIVE',
    },
  });

  console.log('🎓 Enrolled students into courses');

  // 5. Add Progress for Rahul
  const c1Topics = await prisma.topic.findMany({
    where: {
      module: { courseId: course1.id },
    },
    orderBy: { order: 'asc' },
  });

  if (c1Topics.length >= 2) {
    // Rahul completed topic 1 & 2
    await prisma.topicProgress.create({
      data: {
        userId: rahul.id,
        topicId: c1Topics[0].id,
        isCompleted: true,
        lastWatchedSec: c1Topics[0].duration,
        completedAt: new Date(),
      },
    });

    await prisma.topicProgress.create({
      data: {
        userId: rahul.id,
        topicId: c1Topics[1].id,
        isCompleted: true,
        lastWatchedSec: c1Topics[1].duration,
        completedAt: new Date(),
      },
    });
  }

  // 6. Create Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      topicId: c1Topics[2]?.id || null,
      title: 'Assignment 1: Responsive Portfolio Landing Page with Flex & Grid',
      description: 'Create a clean personal portfolio landing page showcasing your skills, about section, projects cards, and a working contact form using semantic HTML5 and modern CSS3 (Flexbox/Grid). Ensure it is fully responsive on mobile devices.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      topicId: c1Topics[4]?.id || null,
      title: 'Assignment 2: Async Weather App with Live API & Error Handling',
      description: 'Build an interactive Weather Dashboard in React using OpenWeatherMap API or WeatherAPI. Handle loading states, search input, invalid cities error messages, and temperature conversion.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxScore: 100,
    },
  });

  // Rahul submitted Assignment 1
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      userId: rahul.id,
      submissionText: 'GitHub Repo: https://github.com/rahul-dreams/portfolio\nLive Demo: https://rahul-portfolio.vercel.app\n\nI have implemented responsive navbar with hamburger menu, CSS grid projects gallery, and form validation.',
      status: 'GRADED',
      score: 95,
      feedback: 'Excellent work Rahul! Great typography, fluid responsive layout, and clean semantic markup. Keep it up!',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Priya submitted Assignment 1 (Pending review)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      userId: priya.id,
      submissionText: 'Here is my assignment submission. Built using Flexbox and Grid. Tested across Chrome, Firefox and Mobile Safari.',
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });

  console.log('📝 Created assignments and sample submissions');

  // 7. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: rahul.id,
        title: 'New Video Uploaded: React Components & Hooks',
        message: 'Admin uploaded new lecture "6. React Components, Props & useState Hook" in Full Stack Web Development Masterclass.',
        type: 'NEW_VIDEO',
        link: `/learn/${course1.slug}`,
        isRead: false,
      },
      {
        userId: rahul.id,
        title: 'Assignment Graded: Portfolio Landing Page',
        message: 'Your assignment "Assignment 1: Responsive Portfolio Landing Page" was reviewed and scored 95/100!',
        type: 'ASSIGNMENT_GRADED',
        link: `/learn/${course1.slug}`,
        isRead: true,
      },
      {
        userId: priya.id,
        title: 'Course Allocated: Python Programming & AI Automation',
        message: 'You have been enrolled in Python Programming & AI Automation Bootcamp by DreamsGuider Admin!',
        type: 'COURSE_ALLOCATED',
        link: `/learn/${course2.slug}`,
        isRead: false,
      },
    ],
  });

  console.log('🔔 Created notifications for students');
  console.log('✨ DreamsGuider database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
