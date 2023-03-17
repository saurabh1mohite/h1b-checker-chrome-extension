(() => {
    // const stopwords = new Array("INC", "LLC", "DBA", "", "OF", "GROUP", "SOLUTIONS", "CORPORATION", "SERVICES", "TECHNOLOGIES", "CORP", "HEALTH", "USA", "COMPANY", "THE", "SYSTEMS", "AND", "MEDICAL", "CONSULTING", "MANAGEMENT", "ASSOCIATES", "CO", "PC", "A", "INTERNATIONAL", "AMERICA", "TECHNOLOGY", "CENTER", "SCHOOL", "GLOBAL", "CAPITAL", "P", "ENGINEERING", "US", "UNIVERSITY", "HOSPITAL", "PARTNERS", "CARE", "S", "SVCS", "LLP", "C", "PLLC", "DENTAL", "TECH", "D", "SOFTWARE", "CONSTRUCTION", "LTD", "LP", "NEW", "NORTH", "AMERICAN", "HOLDINGS", "COMMUNITY", "FOR", "DESIGN", "RESEARCH", "UNIV", "COUNTY", "HEALTHCARE", "B", "L", "IT", "ENERGY", "LABS", "ARCHITECTS", "CTR", "INTL", "COLLEGE", "LAW", "INSTITUTE", "DISTRICT", "IN", "PHARMACY", "FINANCIAL", "INSURANCE", "STATE", "PRODUCTS", "INDUSTRIES", "MEDIA", "DATA", "HOME", "HLTH", "CONSULTANTS", "ST", "FOUNDATION", "I", "DEVELOPMENT", "MED", "BUSINESS", "ENTERPRISES", "ARCHITECTURE", "ACADEMY", "THERAPY", "ENGINEERS", "CITY", "INCORPORATED", "PA", "MGMT", "NETWORK", "ADVISORS", "GRP", "DIGITAL", "SERVICE", "EDUCATION", "TEXAS", "MANUFACTURING", "BANK", "YORK", "PUBLIC", "NATIONAL", "UNITED", "VALLEY", "POWER", "M", "FAMILY", "INVESTMENT", "ADVANCED", "RESOURCES", "PHYSICIANS", "AMERICAS", "HOSP", "PACIFIC", "THERAPEUTICS", "PHYSICAL", "SYSTEM", "LIFE", "REGIONAL", "E", "MEMORIAL", "J", "CPA", "ELECTRIC", "CLINIC", "STUDIO", "INFORMATION", "SCHOOLS", "AI", "PHYSICIAN", "COMMUNICATIONS", "R", "BLUE", "SCIENCE", "TRADING", "LABORATORIES", "VENTURES", "U", "CALIFORNIA", "FOODS", "LOGISTICS", "ANALYTICS", "PHARMACEUTICALS", "ONE", "CENTRAL", "MARKETING", "COM", "REHAB", "WEST", "INFOTECH", "PHARMA", "SAN", "ASSOCIATION", "GENERAL", "H", "ENTERPRISE", "LIMITED", "LL", "MEDICINE", "ASSO", "ASSET", "FLORIDA", "PROFESSIONAL", "DIST", "N", "NETWORKS", "FIRST", "MGT", "T", "AT", "AUTOMOTIVE", "INST", "WORLD", "HOLDING", "SOUTHERN", "NY", "UNION", "ELECTRONICS", "INTEGRATED", "MD", "CHARTER", "DDS", "SCIENCES", "SUPPLY", "INVESTMENTS", "DB", "ASSOC", "CLOUD", "INDEPENDENT", "FKA")

    let linkedinNavbar;
    let employers;
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type} = obj;
        if (type === 'NEW') {
            newWebpageLoaded();
        }
    });

    const newWebpageLoaded = async () => {
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");
            bookmarkBtn.src = chrome.runtime.getURL("assets/h1b-reload.png");
            bookmarkBtn.className = 'bookmark-btn';
            bookmarkBtn.title = 'Click load H1B information';

            linkedinNavbar = document.getElementsByClassName("global-nav__nav")[0];
            linkedinNavbar.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", loadH1BInfo);
        }
    };


    // If DOM content is not loaded
    if (document.readyState == 'complete') {
        newWebpageLoaded();
    } else {
        document.addEventListener('DOMContentLoaded', newWebpageLoaded);
    }
    // Observer to check if the nav bar location where bookmark should come is loaded
    const observer = new MutationObserver(() => {
        if (!linkedinNavbar) {
            linkedinNavbar = document.getElementsByClassName("global-nav__nav")[0];
            newWebpageLoaded();
        }
    });
    observer.observe(document, { childList: true, subtree: true });

    const loadH1BInfo = () => {
        // get the DOM of employers listed in JOB page
        let employers = document.getElementsByClassName("job-card-container__company-name")
        let employer;
        let words;
        let filtered_words;
        let h1b_info;
        chrome.runtime.sendMessage({type: 'get_data'}, (response) => {
            // Check if the data is available
            if (response.data) {
              // Do something with the data
              let h1b_filed = 0;
              const stopwords = response.data['#stopwords@']
              for (let i = 0; i < employers.length; ++i) {
                employer = employers[i].textContent.trim().toUpperCase();
                if (!employer.endsWith(" 5 YEARS")) {
                    employer = employer.replace(/[^a-zA-Z0-9\s]/g, '').trim()
                    words = employer.split(' ')
                    filtered_words = words.filter(word => !stopwords.includes(word));
                    employer = filtered_words.join(" ");
                    h1b_filed = binarySearch(response.data[employer[0]], employer);
                    h1b_info = document.createElement("div")

                    h1b_info.innerHTML = 'Filed ' + h1b_filed.toString() + ' applications in past 5 years'
                    employers[i].appendChild(h1b_info)
                    if (h1b_filed > 0) {
                        h1b_info.style.backgroundColor = 'green';
                    } else { 
                        h1b_info.style.backgroundColor = "red";
                    }
                }
                
              }
            }
          });
    };


    const binarySearch = (data, target) => {
        let low = 0;
        let high = data.length - 1;

        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            let current = data[mid][0]; // Assume employer names are stored in first element of each sub-list

            if (current < target) {
                low = mid + 1;
            } else if (current > target) {
                high = mid - 1;
            } else {
                return data[mid][1]; // Return the sub-list containing the employer name and number of employees
            }
        }

        return 0;

    }

    const employersObserver = new MutationObserver(() => {
        if (!employers) {
            employers = document.getElementsByClassName("job-card-container__company-name");
            loadH1BInfo();
        }
    })
})();