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
