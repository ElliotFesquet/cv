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
            'section#about h2': 'About Me',
            'section#skills h2': 'Skills',
            'section#experience h2': 'Experience',
            'section#education h2': 'Education',
            'section#projects h2': 'Projects',
            'section#contact h2': 'Contact',
            
            // Add more selectors as needed
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
            'section#about h2': 'À Propos de Moi',
            'section#skills h2': 'Compétences',
            'section#experience h2': 'Expérience Professionnelle',
            'section#education h2': 'Formation',
            'section#projects h2': 'Projets',
            'section#contact h2': 'Contact',
            
            // Add more selectors as needed
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
    
    // Set up click event listeners
    enBtn.addEventListener('click', function() {
        console.log("English button clicked");
        switchLanguage('en');
    });
    
    frBtn.addEventListener('click', function() {
        console.log("French button clicked");
        switchLanguage('fr');
    });
    
    console.log("Event listeners attached to language buttons");
    
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
