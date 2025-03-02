// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('JavaScript is loaded and working!');
    
    // Add animation classes to elements
    document.querySelectorAll('section').forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        section.style.transitionDelay = (index * 0.2) + 's';
        
        // Use Intersection Observer to trigger animations when sections come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    }, 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(section);
    });
    
    // Add hover animations to buttons and links
    document.querySelectorAll('button, .button, .nav-link').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        });
    });
    
    // Initialize animations on scroll
    initScrollAnimations();
    
    // Initialize skill bars
    initSkillBars();
    
    // Initialize counters
    initCounters();
    
    // Get language buttons
    const enBtn = document.getElementById('en-btn');
    const frBtn = document.getElementById('fr-btn');
    
    if (!enBtn || !frBtn) {
        console.error("Language buttons not found!");
        return;
    }
    
    console.log("Language buttons found:", enBtn, frBtn);
    
    // Direct element selector translations
    const elementTranslations = {
        en: {
            // Navigation - select by link href
            'a[href="#about"]': 'About Me',
            'a[href="#skills"]': 'Skills',
            'a[href="#experience"]': 'Experience',
            'a[href="#education"]': 'Education',
            'a[href="#projects"]': 'Projects',
            'a[href="#contact"]': 'Contact',
            
            // Section headings - select by closest h2 in section
            'section#about h2': 'ABOUT ME',
            'section#skills h2': 'SKILLS',
            'section#experience h2': 'EXPERIENCE',
            'section#education h2': 'EDUCATION',
            'section#extracurricular h2': 'EXTRACURRICULAR',
            'section#contact h2': 'CONTACT',

            // Paragraphs
            'p[data-lang="about-description"]': 'Having lived in London for 17 years, I chose to study at Efrei Paris, a digital engineering school to obtain a degree in computer sciences engineering. I am currently in a Data & AI master\'s program at Efrei and doing an apprenticeship at Deloitte as a data analyst.',
            
            // Skills section headings
            'section#skills .skill-category:nth-child(1) h3': 'Tech Skills',
            'section#skills .skill-category:nth-child(2) h3': 'Languages',
            'section#skills .skill-category:nth-child(3) h3': 'Soft Skills',

            'section#skills .skill-category:nth-child(2) ul li:nth-child(1)': 'French - Native',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(2)': 'English - C2 / Bilingual',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(3)': 'Spanish - B2',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(4)': 'German - A2',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(5)': 'Italian - A1',
    
            'section#skills .skill-category:nth-child(3) ul li:nth-child(1)': 'Teamwork',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(2)': 'Project Work',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(3)': 'Adaptability',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(4)': 'Curiosity',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(5)': 'Efficiency',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(6)': 'Resilience',
            //deloitte
            'section#experience .timeline .timeline-item:nth-child(1) h3': 'DATA ANALYST - APPRENTICESHIP',
            'section#experience .timeline .timeline-item:nth-child(1) h4': 'DELOITTE | PARIS | SEPT 2024-AUG 2026',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(1)': 'Disruptive dashboards using Tableau Prep/Tableau, powered by Excel & Dataverse',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(2)': 'Agile automation with Python, Power Automate and internal Salesforce CRM',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(3)': 'Optimized data storage and smart access via Excel',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(4)': 'High-tech marketing analyses with ML, generating impactful insights',
            //kickmaker
            'section#experience .timeline .timeline-item:nth-child(2) h3': 'DATA OPS - APPRENTICESHIP',
            'section#experience .timeline .timeline-item:nth-child(2) h4': 'KICKMAKER | PARIS | SEPT 2023 - AUG 2024',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(1)': 'Implementation and development of advanced reports under Power BI, using Microsoft Dataverse capabilities',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(2)': 'Process automation with Python and Power Automate',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(3)': 'Optimization of data storage and access for analysis',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(4)': 'In-depth marketing analyses, generating detailed reports to support strategic decisions',
            //ohm
            'section#experience .timeline .timeline-item:nth-child(3) h3': 'DATA SCIENTIST - INTERNSHIP',
            'section#experience .timeline .timeline-item:nth-child(3) h4': 'OHM ENERGIE | PARIS | MAY 2023 - AUG 2023',
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(1)': 'Creation of Python, VBA, Excel and SQL tools generating significant efficiency gains',
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(2)': 'Creation and deployment of interactive dashboards via Tableau®',
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(3)': 'Experience in data manipulation, cleaning, transformation, processing and API integration',
            //oilx
            'section#experience .timeline .timeline-item:nth-child(4) h3': 'DATA ANALYST - INTERNSHIP',
            'section#experience .timeline .timeline-item:nth-child(1) h4': 'OILX | LONDON | MAY 2022 - AUG 2022',
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(1)': 'Implementation of oil price forecasting models, based on historical data',
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(2)': 'Collection and analysis of large-scale data via web scraping',
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(3)': 'Data manipulation and analysis using pandas, matplotlib, and vizzu',
            
            "section#education .education-container .education-details:nth-child(1) h3": "MASTER OF DATA & AI",
            "section#education .education-container .education-item .education-year:nth-child(1) span::nth-child(1)": "2024",
            "section#education .education-container .education-item .education-year:nth-child(1) span::nth-child(2)": "2026",

            "section#education .education-container .education-details:nth-child(2) h3": "COMPUTER SCIENCES ENGINEERING",
            "section#education .education-container .education-item .education-year:nth-child(2) span::nth-child(1)": "2021",
            "section#education .education-container .education-item .education-year:nth-child(2) span::nth-child(2)": "2024",

            "section#education .education-container .education-item:nth-child(3) h3": "INTEGRATED PREPARATORY CLASSES",
            "section#education .education-container .education-item .education-year:nth-child(3) span::nth-child(1)": "2020",
            "section#education .education-container .education-item .education-year:nth-child(3) span::nth-child(2)": "2021",
        },
        fr: {
            // Navigation
            'a[href="#about"]': 'À Propos',
            'a[href="#skills"]': 'Compétences',
            'a[href="#experience"]': 'Expérience',
            'a[href="#education"]': 'Formation',
            'a[href="#projects"]': 'Projets',
            'a[href="#contact"]': 'Contact',
            
            // Section headings
            'section#about h2': 'A PROPOS DE MOI',
            'section#skills h2': 'COMPÉTENCES',
            'section#experience h2': 'EXPÉRIENCE',
            'section#education h2': 'FORMATION',
            'section#extracurricular h2': 'ACTIVITÉS EXTRA-SCOLAIRES',
            'section#contact h2': 'CONTACT',
            
            // Paragraphs
            'p[data-lang="about-description"]': 'Ayant vécu à Londres pendant 17 ans, j\'ai choisi d\'étudier à Efrei Paris, une école d\'ingénierie numérique pour obtenir un diplôme d\'ingénierie numérique. Je suis actuellement en master de Data IA à l\'Efrei et en alternance chez Deloitte en tant que data analyste.',
            

            'section#skills .skill-category:nth-child(2) ul li:nth-child(1)': 'Français - Maternelle',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(2)': 'Anglais - C2 / Bilingue',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(3)': 'Espagnol - B2',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(4)': 'Allemand - A2',
            'section#skills .skill-category:nth-child(2) ul li:nth-child(5)': 'Italien - A1',

            'section#skills .skill-category:nth-child(3) ul li:nth-child(1)': 'Travail d\'équipe',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(2)': 'Travail en Projet',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(3)': 'Adaptabilité',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(4)': 'Curiosité',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(5)': 'Efficacité',
            'section#skills .skill-category:nth-child(3) ul li:nth-child(6)': 'Résilience',
            //deloitte
            'section#experience .timeline .timeline-item:nth-child(1) h3': 'DATA ANALYST - ALTERNANCE',
            'section#experience .timeline .timeline-item:nth-child(1) h4': 'DELOITTE | PARIS | SEPT 2024-AOUT 2026',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(1)': 'Dashboards disruptifs sous Tableau Prep/Tableau, boostés par Excel & Dataverse',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(2)': 'Automatisation agile avec Python, Power Automate et CRM Salesforce interne',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(3)': 'Stockage data optimisé et accès intelligent via Excel',
            'section#experience .timeline .timeline-item:nth-child(1) ul li:nth-child(4)': 'Analyses marketing high-tech avec ML, générant des insights percutants',
            //kickmaker
            'section#experience .timeline .timeline-item:nth-child(2) h3': 'DATA OPS - ALTERNANCE',
            'section#experience .timeline .timeline-item:nth-child(2) h4': 'KICKMAKER | PARIS | SEPT 2023 - AOUT 2024',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(1)': 'Mise en place et développement de rapports avancés sous Power BI, utilisant les capacités de Microsoft Dataverse',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(2)': 'Automatisation des processus avec Python et Power Automate',
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(3)': "Optimisation du stockage et de l'accès aux données pour les analyse",
            'section#experience .timeline .timeline-item:nth-child(2) ul li:nth-child(4)': 'Analyses marketing approfondies, générant des rapports détaillés pour soutenir les décisions stratégiques',
            
            
            //ohm
            'section#experience .timeline .timeline-item:nth-child(3) h3': 'DATA SCIENTIST - STAGE',
            'section#experience .timeline .timeline-item:nth-child(3) h4': 'OHM ENERGIE | PARIS | MAI 2023 - AOUT 2023',
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(1)': "Création d'outils Python, VBA, Excel et SQL générant des gains d'efficacité significatifs",
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(2)': 'Création et déploiement de tableaux de bord interactifs via Tableau®',
            'section#experience .timeline .timeline-item:nth-child(3) ul li:nth-child(3)': "Expérience en manipulation de données, nettoyage, transformation, traitement et intégration d'API",
            //oilx
            'section#experience .timeline .timeline-item:nth-child(4) h3': 'DATA ANALYST - STAGE',
            'section#experience .timeline .timeline-item:nth-child(1) h4': 'OILX | LONDON | MAI 2022 - AOUT 2022',
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(1)': "Mise en place de modèles de prévision de prix du pétrole, basés sur des données historiques",
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(2)': 'Collecte et analyse de données à grande échelle via web scraping',
            'section#experience .timeline .timeline-item:nth-child(4) ul li:nth-child(3)': "Manipulation et analyse de données à l'aide de pandas, matplotlib, et vizzu",
            
            "section#education .education-container .education-item:nth-child(1) h3": "MASTER DE DATA & IA",
            "section#education .education-container .education-item .education-year:nth-child(1) span:nth-child(1)": "2024",
            "section#education .education-container .education-item .education-year:nth-child(1) span:nth-child(2)": "2026",

            "section#education .education-container .education-item:nth-child(2) h3": "INGÉNIERIE NUMÉRIQUE",
            "section#education .education-container .education-item .education-year:nth-child(2) span:nth-child(1)": "2021",
            "section#education .education-container .education-item .education-year:nth-child(2) span:nth-child(2)": "2024",

            "section#education .education-container .education-item:nth-child(3) h3": "CLASSES PRÉPARATOIRES INTÉGRÉES",
            "section#education .education-container .education-item .education-year:nth-child(3) span:nth-child(1)": "2020",
            "section#education .education-container .education-item .education-year:nth-child(3) span:nth-child(2)": "2021",
        }
    };
    
    // Function to switch language
    function switchLanguage(lang) {
        console.log(`Switching to language: ${lang}`);
        
        // Update active button state
        if (lang === 'en') {
            enBtn.classList.add('active');
            frBtn.classList.remove('active');
        } else {
            frBtn.classList.add('active');
            enBtn.classList.remove('active');
        }
        
        // Translate elements based on CSS selectors
        let translationCount = 0;
        
        for (const selector in elementTranslations[lang]) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                console.log(`Translating element matching "${selector}":`, element);
                element.textContent = elementTranslations[lang][selector];
                translationCount++;
            });
        }
        
        console.log(`Translated ${translationCount} elements`);
        
        // Save language preference
        localStorage.setItem('language', lang);
        console.log("Language preference saved");
    }

    enBtn.addEventListener('click', () => switchLanguage('en'));
    frBtn.addEventListener('click', () => switchLanguage('fr'));
    

    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        console.log(`Restoring saved language: ${savedLanguage}`);
        switchLanguage(savedLanguage);
    }

    // Add chart animations
    createChartAnimations();
});

// Function to handle scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-fade, .animate-scale, .animate-slide');
    
    // Check if element is in viewport
    const isInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    };
    
    // Function to run on scroll
    const handleScroll = () => {
        animatedElements.forEach(element => {
            if (isInViewport(element) && !element.classList.contains('animated')) {
                element.classList.add('animated');
            }
        });
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Trigger once on load
    handleScroll();
}

// Function to animate skill bars
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar');
    
    skillBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-width');
        
        // Reset width initially
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth + '%';
        }, 300);
    });
}

// Function to animate counters
function initCounters() {
    const counters = document.querySelectorAll('.counter-value');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // ms
        const steps = 50;
        const stepValue = target / steps;
        let current = 0;
        
        const updateCounter = () => {
            current += stepValue;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, duration / steps);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Adjust for header
                behavior: 'smooth'
            });
        }
    });
});

// Simplified chart animations function without looping
function createChartAnimations() {
    const sections = ['about', 'skills', 'experience', 'education', 'extracurricular'];
    
    // Color options based on your theme with gradient definitions
    const colors = [
        {line: 'rgba(191, 125, 101, 0.8)', gradient: ['rgba(191, 125, 101, 0.3)', 'rgba(191, 125, 101, 0)']},
        {line: 'rgba(103, 115, 85, 0.8)', gradient: ['rgba(103, 115, 85, 0.3)', 'rgba(103, 115, 85, 0)']},
        {line: 'rgba(255, 87, 34, 0.8)', gradient: ['rgba(255, 87, 34, 0.3)', 'rgba(255, 87, 34, 0)']},
        {line: 'rgba(76, 175, 80, 0.8)', gradient: ['rgba(76, 175, 80, 0.3)', 'rgba(76, 175, 80, 0)']},
        {line: 'rgba(33, 150, 243, 0.8)', gradient: ['rgba(33, 150, 243, 0.3)', 'rgba(33, 150, 243, 0)']}
    ];
    
    // Generate trading-style points for the line
    function generateTradingPoints() {
        let points = '';
        const numPoints = 20; // More points for smoother curve
        let currentY = 100; // Start in the middle
        
        for (let i = 0; i < numPoints; i++) {
            const x = (i * 1000) / (numPoints - 1);
            
            // Create more dramatic trading-like movements
            const sharpMove = Math.random() > 0.85 ? (Math.random() * 60 - 30) : 0;
            const momentum = (currentY - 100) * -0.2; // Tendency to return to middle
            const randomWalk = (Math.random() * 20) - 10;
            
            currentY += momentum + randomWalk + sharpMove;
            currentY = Math.max(20, Math.min(180, currentY)); // Keep within bounds
            
            points += `${x},${currentY} `;
        }
        
        return points.trim();
    }
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Only add the line chart if it doesn't exist
        if (!section.querySelector('.line-chart-bg')) {
            // Choose a random color for each section
            const colorIndex = Math.floor(Math.random() * colors.length);
            
            // Create SVG container
            const chartBg = document.createElement('div');
            chartBg.className = 'line-chart-bg';
            section.style.position = 'relative';
            
            // Generate a unique gradient ID for each section
            const gradientId = `grad-${sectionId}`;
            
            // Create SVG with initial polyline and gradient area
            chartBg.innerHTML = `
                <svg class="line-chart" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <!-- Grid lines -->
                    <line x1="0" y1="50" x2="1000" y2="50" stroke="#ddd" stroke-width="1" stroke-dasharray="5,5" />
                    <line x1="0" y1="100" x2="1000" y2="100" stroke="#ddd" stroke-width="1" stroke-dasharray="5,5" />
                    <line x1="0" y1="150" x2="1000" y2="150" stroke="#ddd" stroke-width="1" stroke-dasharray="5,5" />
                    
                    <!-- Gradient definition -->
                    <defs>
                        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${colors[colorIndex].gradient[0]}" />
                            <stop offset="100%" stop-color="${colors[colorIndex].gradient[1]}" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Gradient area under the line -->
                    <path class="chart-area" 
                        d="" 
                        fill="url(#${gradientId})" 
                    />
                    
                    <!-- The line itself -->
                    <polyline class="animated-line" 
                        points="${generateTradingPoints()}" 
                        fill="none" 
                        stroke="${colors[colorIndex].line}" 
                        stroke-width="3"
                        stroke-linejoin="round"
                    />
                </svg>
            `;
            
            section.appendChild(chartBg);
            
            // Get references to the elements
            const svg = chartBg.querySelector('svg');
            const polyline = svg.querySelector('.animated-line');
            const path = svg.querySelector('.chart-area');
            
            // Create path data that goes down to bottom after the last point
            function updateGradientPath() {
                const points = polyline.getAttribute('points').trim().split(' ');
                if (points.length < 2) return;
                
                let pathData = `M ${points[0]} `;
                points.forEach(point => {
                    pathData += `L ${point} `;
                });
                
                // Extract last point x coordinate
                const lastPoint = points[points.length - 1];
                const lastX = lastPoint.split(',')[0];
                
                // Complete the path by going down and back to start
                pathData += `L ${lastX},200 L 0,200 Z`;
                path.setAttribute('d', pathData);
            }
            
            // Initialize the area path
            updateGradientPath();
        }
    });
}
