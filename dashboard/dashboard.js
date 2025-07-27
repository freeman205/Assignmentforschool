// dashboard.js

// Ensure app.js is loaded first for apiCall, getAuthToken, etc.
// This script assumes app.js is loaded before it.

// Declare variables before using them
const getCurrentUser = window.getCurrentUser
const apiCall = window.apiCall
const showToast = window.showToast
const displayMessage = window.displayMessage
const clearAuthData = window.clearAuthData

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    // If no user is logged in, redirect to login page
    window.location.href = "../index.html" // Adjusted path
    return
  }

  // --- DOM Elements ---
  const userPointsElement = document.getElementById("userPoints")
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const sidebar = document.getElementById("sidebar")
  const sidebarOverlay = document.getElementById("sidebarOverlay")
  const closeSidebarButton = document.getElementById("closeSidebarButton")

  // Main content sections (placeholders for now)
  const specialOffersList = document.getElementById("specialOffersList")
  const featuredWaysToEarnList = document.getElementById("featuredWaysToEarnList")
  const shopPartnersList = document.getElementById("shopPartnersList")
  const gamesList = document.getElementById("gamesList")

  // Sidebar navigation buttons
  const logoutButton = document.getElementById("logoutButton")
  const resetPinButton = document.getElementById("resetPinButton")
  const changePasswordButton = document.getElementById("changePasswordButton")

  // Footer elements
  const footerAccordion = document.getElementById("footerAccordion")
  const footerGrid = document.getElementById("footerGrid")

  // --- Initial UI Setup ---
  if (userPointsElement) userPointsElement.textContent = `${currentUser.points_balance.toFixed(2)} SB`

  // --- Event Listeners ---
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogoutButton)
  }
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", toggleSidebar)
  }
  if (closeSidebarButton) {
    closeSidebarButton.addEventListener("click", toggleSidebar)
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", toggleSidebar) // Close sidebar when clicking overlay
  }
  if (resetPinButton) {
    resetPinButton.addEventListener("click", () => {
      window.location.href = "../pin-reset.html" // Adjusted path
    })
  }
  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      window.location.href = "../forgot-password.html" // Adjusted path
    })
  }

  // --- Sidebar Toggle Functionality ---
  function toggleSidebar() {
    document.body.classList.toggle("sidebar-open")
    sidebarOverlay.classList.toggle("hidden")
  }

  // Close sidebar on navigation link click (mobile)
  document.querySelectorAll("aside nav a.nav-link, aside nav button.nav-link").forEach((element) => {
    element.addEventListener("click", function (e) {
      // Only prevent default for anchor tags that scroll to a section
      if (this.tagName === "A" && this.getAttribute("href").startsWith("#")) {
        e.preventDefault()
        const targetId = this.getAttribute("href").substring(1) // Remove '#'
        document.getElementById(targetId).scrollIntoView({
          behavior: "smooth",
        })
      }

      // Update active class for all nav links
      document.querySelectorAll("aside nav a.nav-link").forEach((link) => link.classList.remove("active"))
      this.classList.add("active") // Apply active class to the clicked link/button

      // Close sidebar on mobile after clicking a link/button
      if (window.innerWidth < 768) {
        toggleSidebar()
      }
    })
  })

  // Set initial active link based on URL hash or default
  const initialSection = window.location.hash || "#dashboard-overview"
  const initialLink = document.querySelector(`aside nav a[href="${initialSection}"]`)
  if (initialLink) {
    initialLink.classList.add("active")
  }

  // --- Data for dynamic content (replace with API calls) ---
  const mockSpecialOffers = [
    {
      id: "offer1",
      title: "Earn 700 SB",
      description: "Offer Partner A",
      image: "/placeholder.svg?height=64&width=64",
      disclaimer: "Terms apply. Limited time.",
    },
    {
      id: "offer2",
      title: "Earn 500 SB",
      description: "Offer Partner B",
      image: "/placeholder.svg?height=64&width=64",
      disclaimer: "New user bonus.",
    },
  ]

  const mockShopPartners = [
    { id: "shop1", name: "Retailer One", cashback: "1%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop2", name: "Retailer Two", cashback: "Up to 4%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop3", name: "Retailer Three", cashback: "Up to 3%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop4", name: "Retailer Four", cashback: "1%", logo: "/placeholder.svg?height=64&width=64" },
  ]

  const mockGames = [
    {
      id: "game1",
      title: "Fun Game Title",
      points: "13,224",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Requires in-app purchases to reach maximum earnings.",
    },
    {
      id: "game2",
      title: "Puzzle Master",
      points: "443",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Points awarded upon reaching specific game levels.",
    },
    {
      id: "game3",
      title: "Adventure Quest",
      points: "37",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Limited time offer. See game details for more info.",
    },
  ]

  const footerSectionsData = [
    {
      title: "Reward System",
      links: [
        { name: "About Us", href: "#" },
        { name: "How it Works", href: "#" },
        { name: "Blog", href: "#" },
      ],
    },
    {
      title: "Rewards",
      links: [
        { name: "Gift Cards", href: "#" },
        { name: "PayPal Cash", href: "#" },
        { name: "Bitcoin", href: "#" },
      ],
    },
    {
      title: "Ways to Earn",
      links: [
        { name: "Surveys", href: "#" },
        { name: "Shopping", href: "#" },
        { name: "Games", href: "#" },
        { name: "Offers", href: "#" },
      ],
    },
    {
      title: "Information",
      links: [
        { name: "FAQ", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Use", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Cookie Policy", href: "#" },
      ],
    },
    {
      title: "Accessibility",
      links: [
        { name: "Accessibility Statement", href: "#" },
        { name: "Contact Accessibility", href: "#" },
      ],
    },
    {
      title: "Contact Us",
      links: [
        { name: "Support", href: "#" },
        { name: "Partnerships", href: "#" },
      ],
    },
    {
      title: "Connect With Us",
      links: [
        { name: "Facebook", href: "#", icon: "facebook" },
        { name: "Twitter", href: "#", icon: "twitter" },
        { name: "Instagram", href: "#", icon: "instagram" },
      ],
    },
  ]

  // --- Dynamic Content Loading Functions (API Integration Points) ---

  async function loadSpecialOffers() {
    // This is where you would make an API call to fetch special offers
    // Example: const offers = await apiCall("/offers/special", "GET", null, true);
    // For now, using mock data:
    const offers = mockSpecialOffers

    if (specialOffersList) {
      specialOffersList.innerHTML = ""
      offers.forEach((offer) => {
        const offerHtml = `
          <div class="card p-4 flex items-center gap-4">
              <img src="${offer.image}" alt="${offer.description}" class="rounded-md object-cover size-16">
              <div class="flex-1">
                  <h3 class="font-semibold text-gray-800">${offer.title}</h3>
                  <p class="text-sm text-gray-600">${offer.description}</p>
              </div>
              <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                  Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
              </button>
          </div>
        `
        specialOffersList.insertAdjacentHTML("beforeend", offerHtml)
      })
    }
  }

  async function loadFeaturedWaysToEarn() {
    // This is where you would make an API call to fetch featured offers
    // Example: const featuredOffers = await apiCall("/offers/featured", "GET", null, true);
    // For now, using mock data (reusing special offers for simplicity):
    const featuredOffers = mockSpecialOffers.slice(0, 1) // Just one for featured

    if (featuredWaysToEarnList) {
      featuredWaysToEarnList.innerHTML = ""
      featuredOffers.forEach((offer) => {
        const offerHtml = `
          <div class="card p-4 flex items-center gap-4">
              <img src="${offer.image}" alt="${offer.description}" class="rounded-md object-cover size-16">
              <div class="flex-1">
                  <h3 class="font-semibold text-gray-800">${offer.title}</h3>
                  <p class="text-sm text-gray-600">${offer.description}</p>
              </div>
              <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                  Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
              </button>
          </div>
        `
        featuredWaysToEarnList.insertAdjacentHTML("beforeend", offerHtml)
      })
    }
  }

  async function loadShopPartners() {
    // This is where you would make an API call to fetch shop partners
    // Example: const partners = await apiCall("/shop/partners", "GET", null, true);
    // For now, using mock data:
    const partners = mockShopPartners

    if (shopPartnersList) {
      shopPartnersList.innerHTML = ""
      partners.forEach((partner) => {
        const partnerHtml = `
          <div class="card p-4 flex flex-col items-center text-center">
              <img src="${partner.logo}" alt="${partner.name} logo" class="rounded-full mb-2 object-contain size-16">
              <h3 class="font-medium text-gray-800">${partner.name}</h3>
              <p class="text-sm text-emerald-600 font-semibold">${partner.cashback} Cash Back</p>
          </div>
        `
        shopPartnersList.insertAdjacentHTML("beforeend", partnerHtml)
      })
    }
  }

  async function loadGames() {
    // This is where you would make an API call to fetch games
    // Example: const gamesData = await apiCall("/games", "GET", null, true);
    // For now, using mock data:
    const gamesData = mockGames

    if (gamesList) {
      gamesList.innerHTML = ""
      gamesData.forEach((game) => {
        const gameHtml = `
          <div class="card p-4 flex items-center gap-4">
              <img src="${game.image}" alt="${game.title}" class="rounded-md object-cover size-20">
              <div class="flex-1">
                  <h3 class="font-semibold text-gray-800">${game.title}</h3>
                  <p class="text-sm text-emerald-600 font-semibold">Earn up to ${game.points} SB</p>
              </div>
              <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                  Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
              </button>
          </div>
        `
        gamesList.insertAdjacentHTML("beforeend", gameHtml)
      })
    }
  }

  // --- Footer Accordion/Grid Logic ---
  function renderFooter() {
    // Render for mobile (accordion)
    if (footerAccordion) {
      footerAccordion.innerHTML = "" // Clear existing content
      footerSectionsData.forEach((section, index) => {
        const accordionItem = document.createElement("div")
        accordionItem.className = "accordion-item"
        accordionItem.innerHTML = `
          <button class="accordion-trigger" aria-expanded="false" aria-controls="accordion-content-${index}">
            ${section.title}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div id="accordion-content-${index}" class="accordion-content hidden">
            <ul>
              ${section.links
                .map(
                  (link) => `
                <li>
                  <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                    ${getSocialIconSvg(link.icon)}
                    ${link.name}
                  </a>
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>
        `
        footerAccordion.appendChild(accordionItem)

        const triggerButton = accordionItem.querySelector(".accordion-trigger")
        const contentDiv = accordionItem.querySelector(".accordion-content")

        triggerButton.addEventListener("click", () => {
          const isExpanded = triggerButton.getAttribute("aria-expanded") === "true"
          triggerButton.setAttribute("aria-expanded", String(!isExpanded))
          contentDiv.classList.toggle("hidden")
        })
      })
    }

    // Render for desktop (grid)
    if (footerGrid) {
      footerGrid.innerHTML = "" // Clear existing content
      footerSectionsData.forEach((section) => {
        const sectionDiv = document.createElement("div")
        sectionDiv.innerHTML = `
          <h3 class="text-lg font-semibold text-gray-800 mb-4">${section.title}</h3>
          <ul class="space-y-2 text-gray-600">
            ${section.links
              .map(
                (link) => `
              <li>
                <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                  ${getSocialIconSvg(link.icon)}
                  ${link.name}
                </a>
              </li>
            `,
              )
              .join("")}
          </ul>
        `
        footerGrid.appendChild(sectionDiv)
      })
    }
  }

  function getSocialIconSvg(iconName) {
    switch (iconName) {
      case "facebook":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`
      case "twitter":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5 4.9 9 5.1 0-.4.1-.8.1-1.2C12.1 5.8 17 3 22 4Z"/></svg>`
      case "instagram":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`
      default:
        return ""
    }
  }

  // --- Initial Data Load and Setup ---
  await loadSpecialOffers()
  await loadFeaturedWaysToEarn()
  await loadShopPartners()
  await loadGames()
  renderFooter()

  // Placeholder for existing dashboard functions (if you re-add them)
  // await fetchDashboardStats();
  // await fetchSurveys();
  // await fetchTransferHistory();
  // await fetchRedemptionRates();
  // await fetchRedemptionHistory();
  // await fetchActivityLog();

  // Declare handleLogoutButton function
  function handleLogoutButton() {
    clearAuthData()
    window.location.href = "../index.html" // Redirect to login page after logout
  }
})
